import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import {
    isChannelChangeExpired,
    markChannelChangeConfirmed,
    maskChannelValue,
    verifyChannelChangeRequest,
} from '@/server/utils/channel-change'
import { auditFromEvent } from '@/server/utils/audit-log'
import { emailService } from '@/server/utils/email/service'
import { sendPhoneNotification } from '@/server/utils/sms'
import { resolveRecoveryMessage } from '@/server/utils/recovery-messages'
import { evaluateRegistration } from '@/server/utils/registration-policy'

const bodySchema = z.object({
    code: z.string().regex(/^\d{6}$/u),
})

/**
 * 确认联系方式改绑（阶段 9 M10）。
 *
 * 只有验证码正确、未过期、未消费时才生效；生效后：
 * 1. 新通道置为已验证；
 * 2. 全部会话失效；
 * 3. 置 `mustResetPassword`（重置完成前拒绝所有登录方式）；
 * 4. 向旧邮箱（可投递时）发送变更通知；
 * 5. 自动向新通道发送密码重置验证码；
 * 6. 全流程写审计。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 10 })
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw createError({ statusCode: 400, message: t('errors.admin.paramsInvalid') })
    }
    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.codeInvalid',
            data: { code: 'CODE_INVALID' },
        })
    }

    const result = await verifyChannelChangeRequest({ id: params.data.id, code: parsed.data.code })
    if (!result.ok) {
        const mapping = {
            REQUEST_NOT_FOUND: { statusCode: 404, key: 'errors.recovery.requestNotFound', code: 'REQUEST_NOT_FOUND' },
            REQUEST_CONSUMED: { statusCode: 409, key: 'errors.recovery.requestConsumed', code: 'REQUEST_CONSUMED' },
            CODE_EXPIRED: { statusCode: 410, key: 'errors.recovery.codeExpired', code: 'CODE_EXPIRED' },
            CODE_INVALID: { statusCode: 400, key: 'errors.recovery.codeInvalid', code: 'CODE_INVALID' },
            TOO_MANY_ATTEMPTS: { statusCode: 429, key: 'errors.recovery.tooManyAttempts', code: 'TOO_MANY_ATTEMPTS' },
        } as const
        const error = mapping[result.reason]
        throw await createLocalizedError(event, {
            statusCode: error.statusCode,
            key: error.key,
            data: { code: error.code },
        })
    }

    const request = result.request
    const userRepository = dataSource.getRepository(User)
    const user = await userRepository.findOne({ where: { id: request.userId } })
    if (!user) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }

    /* 并发兜底：确认前再次检查目标是否被占用 */
    const existing = request.channel === 'email'
        ? await userRepository.findOne({ where: { email: request.newValue } })
        : await userRepository.findOne({ where: { phoneNumber: request.newValue } })
    if (existing && existing.id !== user.id) {
        request.status = 'cancelled'
        await dataSource.getRepository(ChannelChangeRequest).save(request)
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.targetTaken',
            data: { code: 'TARGET_TAKEN' },
        })
    }

    const registrationDecision = await evaluateRegistration(
        request.channel === 'email' ? { email: request.newValue } : { phone: request.newValue },
    )
    if (!registrationDecision.allowed) {
        request.status = 'cancelled'
        await dataSource.getRepository(ChannelChangeRequest).save(request)
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.registration.notAllowed',
            data: { code: 'REGISTRATION_NOT_ALLOWED' },
        })
    }

    const before = request.channel === 'email' ? { email: user.email } : { phone: user.phoneNumber }
    const after = request.channel === 'email' ? { email: request.newValue } : { phone: request.newValue }
    const oldEmail = user.email
    const oldPhone = user.phoneNumber
    const expiresAt = request.expiresAt
    if (isChannelChangeExpired({ expiresAt })) {
        /* 校验与写入之间的极短窗口，仍按过期处理 */
        request.status = 'expired'
        await dataSource.getRepository(ChannelChangeRequest).save(request)
        throw await createLocalizedError(event, {
            statusCode: 410,
            key: 'errors.recovery.codeExpired',
            data: { code: 'CODE_EXPIRED' },
        })
    }

    if (request.channel === 'email') {
        user.email = request.newValue
        user.emailVerified = true
    } else {
        user.phoneNumber = request.newValue
        user.phoneNumberVerified = true
    }
    user.mustResetPassword = true
    await userRepository.save(user)
    await markChannelChangeConfirmed(request)

    /* 全部会话失效：含二级存储中的缓存会话 */
    try {
        const context = await auth.$context
        await context.internalAdapter.deleteUserSessions(user.id)
    } catch (error) {
        auditFromEvent(event, {
            action: 'channel.change.confirm',
            actorId: user.id,
            targetUserId: user.id,
            before,
            after,
            result: 'failure',
            reason: `revoke-sessions: ${error instanceof Error ? error.message : String(error)}`,
            source: 'web',
        })
    }

    auditFromEvent(event, {
        action: 'channel.change.confirm',
        actorId: user.id,
        targetUserId: user.id,
        before,
        after,
        reason: request.reason ?? null,
        source: 'web',
    })
    auditFromEvent(event, {
        action: 'password.reset.forced',
        actorId: user.id,
        targetUserId: user.id,
        reason: 'channel-change',
        source: 'web',
    })

    const maskedTarget = maskChannelValue(request.channel, request.newValue)
    const oldValue = request.channel === 'email' ? oldEmail : oldPhone

    /* 旧通道可投递时发送通知；失败只记录，不影响确认结果 */
    if (oldValue && oldValue !== request.newValue) {
        try {
            if (request.channel === 'email') {
                await emailService.sendChannelChangeNotification(
                    oldValue,
                    `${request.channel}: ${maskedTarget}`,
                    { request: { headers: event.headers } as Request },
                )
            } else {
                const delivered = await sendPhoneNotification(
                    oldValue,
                    resolveRecoveryMessage({ headers: event.headers }, 'channelChangeSmsNotice', { target: maskedTarget }),
                )
                if (!delivered) {
                    throw new Error('sms-provider-does-not-support-notification')
                }
            }
            auditFromEvent(event, {
                action: 'channel.change.notify',
                targetUserId: user.id,
                after: { channel: request.channel },
                source: 'web',
            })
        } catch (error) {
            auditFromEvent(event, {
                action: 'channel.change.notify',
                targetUserId: user.id,
                result: 'failure',
                reason: error instanceof Error ? error.message : String(error),
                source: 'web',
            })
        }
    } else {
        auditFromEvent(event, {
            action: 'channel.change.notify',
            targetUserId: user.id,
            result: 'failure',
            reason: 'no-deliverable-channel',
            source: 'web',
        })
    }

    /* 自动发送密码重置验证码 */
    let resetCodeSent = false
    let resetError: string | null = null
    try {
        if (request.channel === 'email') {
            await auth.api.requestPasswordResetEmailOTP({
                body: { email: request.newValue },
                headers: event.headers,
            })
        } else {
            await auth.api.requestPasswordResetPhoneNumber({
                body: { phoneNumber: request.newValue },
                headers: event.headers,
            })
        }
        resetCodeSent = true
    } catch (error) {
        resetError = error instanceof Error ? error.message : String(error)
    }

    return {
        status: true,
        data: {
            channel: request.channel,
            maskedTarget,
            mustResetPassword: true,
            resetCodeSent,
            resetError,
        },
    }
})
