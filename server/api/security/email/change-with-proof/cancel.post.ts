import { defineEventHandler } from 'h3'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { User } from '@/server/entities/user'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent } from '@/server/utils/audit-log'
import { resolveRequestState } from '@/server/utils/channel-change-state'
import { notifyChannelChangeLifecycle } from '@/server/utils/channel-change-notify'

/**
 * 撤销冷静期内的换邮箱申请（阶段 10 M3.2）。
 *
 * 只有 pending 且已写入 `scheduledAt` 的请求可撤销；已生效返回 409，
 * 撤销后状态回到 cancelled（前端按「未申请」展示）。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 5 })
    const { userId } = await getUserSession(event)
    const repository = dataSource.getRepository(ChannelChangeRequest)
    const requests = await repository.find({
        where: { userId, channel: 'email', source: 'user', status: 'pending' },
    })
    const request = requests
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
    if (!request) {
        throw await createLocalizedError(event, {
            statusCode: 404,
            key: 'errors.recovery.noPendingRequest',
            data: { code: 'NO_PENDING_REQUEST' },
        })
    }

    const state = resolveRequestState(request)
    if (state === 'confirmed') {
        /* 到期但尚未惰性生效：按已生效处理并提示 */
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.alreadyEffective',
            data: { code: 'ALREADY_EFFECTIVE' },
        })
    }
    if (state !== 'pending' || !request.scheduledAt) {
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.noPendingRequest',
            data: { code: 'NO_PENDING_REQUEST' },
        })
    }

    request.status = 'cancelled'
    request.cancelledAt = new Date()
    await repository.save(request)

    auditFromEvent(event, {
        action: 'email.change.cancel',
        actorId: userId,
        targetUserId: userId,
        after: { requestId: request.id, email: request.newValue },
        source: 'web',
    })

    const user = await dataSource.getRepository(User).findOne({ where: { id: userId } })
    await notifyChannelChangeLifecycle({
        userId,
        event: 'cancel',
        oldEmail: user?.email ?? null,
        newEmail: request.newValue,
    })

    return {
        status: true,
        data: {
            state: 'cancelled',
            requestId: request.id,
            cancelledAt: request.cancelledAt,
        },
    }
})
