import { getVerificationDeadline } from './channel-change'
import type { ChannelChangeRequest, ChannelChangeStatus } from '@/server/entities/channel-change-request'

/**
 * 改绑请求状态判定（阶段 10 M2.1）。
 *
 * 单一纯函数，登录 / 敏感操作 / 状态查询共用，避免三处各写一套时间口径：
 * - `scheduledAt` 为空 → 阶段 9 即时确认模型：以验证码窗口（`createdAt + 10 分钟`）判过期；
 * - `scheduledAt` 非空 → 冷静期模型：只以 `scheduledAt` 判生效，`expiresAt` 不参与、也不被覆写；
 * - `cancelledAt` 一旦写入即视为已撤销，优先于时间判定。
 */

type StateInput = Partial<Pick<ChannelChangeRequest,
    'status' | 'createdAt' | 'expiresAt' | 'scheduledAt' | 'cancelledAt' | 'confirmedAt'>>

function toTime(value: Date | string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
        return null
    }
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
    return Number.isFinite(time) ? time : null
}

/** 验证码窗口是否已关闭（与冷静期无关） */
export function isVerificationWindowClosed(request: StateInput, now = Date.now()): boolean {
    return getVerificationDeadline(request).getTime() <= now
}

/** 冷静期结束（生效）时间；即时确认模型返回 null */
export function getEffectiveAt(request: StateInput): Date | null {
    const scheduled = toTime(request.scheduledAt)
    return scheduled === null ? null : new Date(scheduled)
}

/** 距离生效还需等待的毫秒数；已生效返回 0，即时确认模型返回 null */
export function getRemainingEffectiveMs(request: StateInput, now = Date.now()): number | null {
    const effectiveAt = getEffectiveAt(request)
    if (!effectiveAt) {
        return null
    }
    return Math.max(0, effectiveAt.getTime() - now)
}

/**
 * 解析请求的当前状态（不落库）。
 *
 * `confirmed` 即「已生效」；不引入 `effective` 等新枚举值（M2.1）。
 */
export function resolveRequestState(request: StateInput, now = Date.now()): ChannelChangeStatus {
    const status = request.status ?? 'pending'
    if (status === 'cancelled' || status === 'confirmed' || status === 'expired') {
        return status
    }
    if (request.cancelledAt) {
        return 'cancelled'
    }
    const scheduled = toTime(request.scheduledAt)
    if (scheduled !== null) {
        return now >= scheduled ? 'confirmed' : 'pending'
    }
    return isVerificationWindowClosed(request, now) ? 'expired' : 'pending'
}

/** 是否应当执行冷静期生效（到期且仍为 pending） */
export function shouldApplyScheduledChange(request: StateInput, now = Date.now()): boolean {
    if (request.status !== 'pending' || request.cancelledAt) {
        return false
    }
    const scheduled = toTime(request.scheduledAt)
    return scheduled !== null && now >= scheduled
}

/** 是否可以撤销（冷静期内、未生效、未撤销） */
export function canCancelRequest(request: StateInput, now = Date.now()): boolean {
    return resolveRequestState(request, now) === 'pending' && Boolean(request.scheduledAt)
}
