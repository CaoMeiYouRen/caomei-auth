import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent } from '@/server/utils/audit-log'
import { verifyChannelChangeRequest } from '@/server/utils/channel-change'
import { getRemainingEffectiveMs } from '@/server/utils/channel-change-state'
import { CHANNEL_CHANGE_COOLING_OFF_HOURS } from '@/utils/shared/env'
import { coolingOffHoursToMs } from '@/utils/shared/cooling-off'

const bodySchema = z.object({
    code: z.string().regex(/^\d{6}$/u),
})

/**
 * 确认新邮箱归属（阶段 10 M2.4）。
 *
 * 6 位验证码 10 分钟有效、3 次尝试；通过后写入 `scheduledAt`（默认 +24h，上限 72h），
 * 请求保持 pending 直到冷静期结束。重复确认幂等返回当前状态，不再消费验证码。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 10 })
    const { userId } = await getUserSession(event)
    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid code',
            data: { code: 'CODE_INVALID' },
        })
    }

    const repository = dataSource.getRepository(ChannelChangeRequest)
    const pending = await repository.find({
        where: { userId, channel: 'email', status: 'pending', source: 'user' },
    })
    const request = pending
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
    if (!request) {
        throw await createLocalizedError(event, {
            statusCode: 404,
            key: 'errors.recovery.noPendingRequest',
            data: { code: 'NO_PENDING_REQUEST' },
        })
    }

    /* 归属已验证过：幂等返回，不重复消费验证码 */
    if (request.scheduledAt) {
        return {
            status: true,
            data: {
                status: 'pending',
                scheduledAt: request.scheduledAt,
                remainingMs: getRemainingEffectiveMs(request),
                coolingOffHours: CHANNEL_CHANGE_COOLING_OFF_HOURS,
            },
        }
    }

    const result = await verifyChannelChangeRequest({ id: request.id, code: parsed.data.code })
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

    const scheduledAt = new Date(Date.now() + coolingOffHoursToMs(CHANNEL_CHANGE_COOLING_OFF_HOURS))
    request.scheduledAt = scheduledAt
    await repository.save(request)

    auditFromEvent(event, {
        action: 'email.change.confirm',
        actorId: userId,
        targetUserId: userId,
        after: { scheduledAt: scheduledAt.toISOString(), coolingOffHours: CHANNEL_CHANGE_COOLING_OFF_HOURS },
        source: 'web',
    })

    return {
        status: true,
        data: {
            status: 'pending',
            scheduledAt,
            remainingMs: getRemainingEffectiveMs(request),
            coolingOffHours: CHANNEL_CHANGE_COOLING_OFF_HOURS,
        },
    }
})
