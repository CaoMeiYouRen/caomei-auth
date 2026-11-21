import { defineEventHandler } from 'h3'
import { dataSource } from '@/server/database'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { getUserSession } from '@/server/utils/get-user-session'
import { maskEmail } from '@/server/utils/privacy'
import { applyDueChannelChanges } from '@/server/utils/channel-change-apply'
import { getRemainingEffectiveMs, resolveRequestState } from '@/server/utils/channel-change-state'

/**
 * 自助换邮箱状态（阶段 10 M3.2）。
 *
 * 读路径先触发惰性生效（到期即生效），再返回状态与剩余时间，供倒计时卡使用。
 * 没有申请时返回 `state: 'none'`。
 */
export default defineEventHandler(async (event) => {
    const { userId } = await getUserSession(event)
    await applyDueChannelChanges(userId)

    const requests = await dataSource.getRepository(ChannelChangeRequest).find({
        where: { userId, channel: 'email', source: 'user' },
    })
    const request = requests
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
    if (!request) {
        return { status: true, data: { state: 'none' } }
    }

    const state = resolveRequestState(request)
    return {
        status: true,
        data: {
            state,
            requestId: request.id,
            maskedTarget: maskEmail(request.newValue),
            createdAt: request.createdAt,
            scheduledAt: request.scheduledAt,
            cancelledAt: request.cancelledAt,
            remainingMs: getRemainingEffectiveMs(request),
            proofFactor: request.proofFactor,
        },
    }
})
