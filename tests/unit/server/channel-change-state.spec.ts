import { describe, expect, it } from 'vitest'
import {
    canCancelRequest,
    getEffectiveAt,
    getRemainingEffectiveMs,
    isVerificationWindowClosed,
    resolveRequestState,
    shouldApplyScheduledChange,
} from '@/server/utils/channel-change-state'
import { CHANNEL_CHANGE_EXPIRES_IN_MS, getVerificationDeadline } from '@/server/utils/channel-change'

const NOW = new Date('2026-11-21T12:00:00Z').getTime()
const HOUR = 60 * 60 * 1000

describe('server/utils/channel-change-state', () => {
    it('uses createdAt + 10 minutes as the verification window', () => {
        const createdAt = new Date(NOW - CHANNEL_CHANGE_EXPIRES_IN_MS + 1000)
        expect(getVerificationDeadline({ createdAt }).getTime()).toBe(createdAt.getTime() + CHANNEL_CHANGE_EXPIRES_IN_MS)
        expect(isVerificationWindowClosed({ createdAt }, NOW)).toBe(false)
        expect(isVerificationWindowClosed({ createdAt: new Date(NOW - CHANNEL_CHANGE_EXPIRES_IN_MS) }, NOW)).toBe(true)
        /* 老数据没有 createdAt 时回落到 expiresAt */
        expect(isVerificationWindowClosed({ expiresAt: new Date(NOW - 1) }, NOW)).toBe(true)
        expect(isVerificationWindowClosed({ expiresAt: new Date(NOW + 1000) }, NOW)).toBe(false)
    })

    it('resolves the immediate-confirmation model by the verification window', () => {
        expect(resolveRequestState({ status: 'pending', createdAt: new Date(NOW - 1000) }, NOW)).toBe('pending')
        expect(resolveRequestState({ status: 'pending', createdAt: new Date(NOW - CHANNEL_CHANGE_EXPIRES_IN_MS - 1) }, NOW)).toBe('expired')
        expect(resolveRequestState({ status: 'confirmed' }, NOW)).toBe('confirmed')
        expect(resolveRequestState({ status: 'cancelled' }, NOW)).toBe('cancelled')
        expect(resolveRequestState({ status: 'expired' }, NOW)).toBe('expired')
    })

    it('resolves the cooling-off model only by scheduledAt and ignores expiresAt', () => {
        const base = {
            status: 'pending' as const,
            createdAt: new Date(NOW - 2 * HOUR),
            /* 验证码窗口早已关闭，但冷静期未到：仍是 pending */
            expiresAt: new Date(NOW - HOUR),
        }
        expect(resolveRequestState({ ...base, scheduledAt: new Date(NOW + HOUR) }, NOW)).toBe('pending')
        expect(resolveRequestState({ ...base, scheduledAt: new Date(NOW) }, NOW)).toBe('confirmed')
        expect(resolveRequestState({ ...base, scheduledAt: new Date(NOW - 1) }, NOW)).toBe('confirmed')
        /* 冷静期未到但 expiresAt 在未来也不提前生效 */
        expect(resolveRequestState({ ...base, expiresAt: new Date(NOW + HOUR), scheduledAt: new Date(NOW + 2 * HOUR) }, NOW)).toBe('pending')
    })

    it('treats cancelledAt as cancelled and reports remaining cooling-off time', () => {
        const request = {
            status: 'pending' as const,
            scheduledAt: new Date(NOW + 24 * HOUR),
            cancelledAt: new Date(NOW),
        }
        expect(resolveRequestState(request, NOW)).toBe('cancelled')
        expect(getEffectiveAt(request)).toEqual(new Date(NOW + 24 * HOUR))
        expect(getRemainingEffectiveMs({ scheduledAt: new Date(NOW + HOUR) }, NOW)).toBe(HOUR)
        expect(getRemainingEffectiveMs({ scheduledAt: new Date(NOW - HOUR) }, NOW)).toBe(0)
        expect(getRemainingEffectiveMs({ scheduledAt: null }, NOW)).toBeNull()
        expect(canCancelRequest({ status: 'pending', scheduledAt: new Date(NOW + HOUR) }, NOW)).toBe(true)
        expect(canCancelRequest({ status: 'pending', scheduledAt: new Date(NOW - HOUR) }, NOW)).toBe(false)
        expect(canCancelRequest({ status: 'pending', scheduledAt: null }, NOW)).toBe(false)
    })

    it('only applies scheduled requests that are due and still pending', () => {
        expect(shouldApplyScheduledChange({ status: 'pending', scheduledAt: new Date(NOW - 1) }, NOW)).toBe(true)
        expect(shouldApplyScheduledChange({ status: 'pending', scheduledAt: new Date(NOW + 1) }, NOW)).toBe(false)
        expect(shouldApplyScheduledChange({ status: 'pending', scheduledAt: null }, NOW)).toBe(false)
        expect(shouldApplyScheduledChange({ status: 'cancelled', scheduledAt: new Date(NOW - 1) }, NOW)).toBe(false)
        expect(shouldApplyScheduledChange({ status: 'pending', scheduledAt: new Date(NOW - 1), cancelledAt: new Date(NOW - 2) }, NOW)).toBe(false)
    })
})
