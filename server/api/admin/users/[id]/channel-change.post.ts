import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import {
    createChannelChangeRequest,
    maskChannelValue,
    normalizeChannelValue,
} from '@/server/utils/channel-change'
import { deliverChannelChangeCode } from '@/server/utils/channel-change-delivery'
import { auditFromEvent } from '@/server/utils/audit-log'
import { isPhoneChannelConfigured } from '@/server/utils/recovery-channels'
import { evaluateRegistration } from '@/server/utils/registration-policy'

const bodySchema = z.object({
    channel: z.enum(['email', 'phone']),
    value: z.string().min(1).max(255),
    reason: z.string().trim().min(2).max(500),
})

/**
 * 管理员发起邮箱 / 手机改绑（阶段 9 M9）。
 *
 * 管理员只能发起，不能直接改：请求创建后向新通道发送验证码，用户在确认页提交后才生效。
 * 必填原因，全程审计；未配置短信时手机通道直接拒绝。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 10 })
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw createError({ statusCode: 400, message: params.error.message })
    }
    const targetUserId = params.data.id

    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? t('errors.admin.paramsInvalid'),
            data: { code: 'TARGET_INVALID' },
        })
    }
    const { channel, reason } = parsed.data

    const valueSchema = channel === 'email' ? emailSchema : phoneSchema
    const valueResult = valueSchema.safeParse(parsed.data.value)
    if (!valueResult.success) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.targetInvalid',
            data: { code: 'TARGET_INVALID' },
        })
    }
    const newValue = normalizeChannelValue(channel, valueResult.data)

    if (channel === 'phone' && !isPhoneChannelConfigured()) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.channelNotConfigured',
            data: { code: 'CHANNEL_NOT_CONFIGURED' },
        })
    }

    const userRepository = dataSource.getRepository(User)
    const target = await userRepository.findOne({ where: { id: targetUserId } })
    if (!target) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }
    if ((channel === 'email' ? target.email : target.phoneNumber) === newValue) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.targetInvalid',
            data: { code: 'TARGET_INVALID' },
        })
    }
    const existing = channel === 'email'
        ? await userRepository.findOne({ where: { email: newValue } })
        : await userRepository.findOne({ where: { phoneNumber: newValue } })
    if (existing && existing.id !== target.id) {
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.targetTaken',
            data: { code: 'TARGET_TAKEN' },
        })
    }

    const registrationDecision = await evaluateRegistration(
        channel === 'email' ? { email: newValue } : { phone: newValue },
    )
    if (!registrationDecision.allowed) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.registration.notAllowed',
            data: { code: 'REGISTRATION_NOT_ALLOWED' },
        })
    }

    const { request, code } = await createChannelChangeRequest({
        userId: target.id,
        channel,
        value: newValue,
        requestedBy: auth.data.userId,
        reason,
    })

    try {
        await deliverChannelChangeCode(channel, newValue, code, { headers: event.headers })
    } catch (error) {
        const repository = dataSource.getRepository(ChannelChangeRequest)
        request.status = 'cancelled'
        await repository.save(request)
        auditFromEvent(event, {
            action: 'channel.change.request',
            actorId: auth.data.userId,
            targetUserId: target.id,
            before: channel === 'email' ? { email: target.email } : { phone: target.phoneNumber },
            after: channel === 'email' ? { email: newValue } : { phone: newValue },
            result: 'failure',
            reason,
            source: 'admin',
        })
        throw await createLocalizedError(event, {
            statusCode: 502,
            key: 'errors.recovery.sendFailed',
            data: { code: 'SEND_FAILED', cause: error instanceof Error ? error.message : String(error) },
        })
    }

    auditFromEvent(event, {
        action: 'channel.change.request',
        actorId: auth.data.userId,
        targetUserId: target.id,
        before: channel === 'email' ? { email: target.email } : { phone: target.phoneNumber },
        after: channel === 'email' ? { email: newValue } : { phone: newValue },
        reason,
        source: 'admin',
    })

    return {
        status: true,
        data: {
            id: request.id,
            channel,
            maskedTarget: maskChannelValue(channel, newValue),
            expiresAt: request.expiresAt,
        },
    }
})
