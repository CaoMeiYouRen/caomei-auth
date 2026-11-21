import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import {
    createChannelChangeApi,
    splitRemainingMs,
    useChannelChange,
    type ChannelChangeApi,
    type ChannelChangeStatus,
} from '@/composables/use-channel-change'

function createApi(overrides: Partial<ChannelChangeApi> = {}): ChannelChangeApi {
    const base: ChannelChangeApi = {
        status: vi.fn(async (): Promise<ChannelChangeStatus> => ({ state: 'none' })),
        request: vi.fn(async () => ({ requestId: 'req-1', maskedTarget: 'n***@example.com', factor: 'totp', requiresVerify: true })),
        confirm: vi.fn(async () => ({ status: 'pending' as const, scheduledAt: new Date().toISOString(), remainingMs: 1000, coolingOffHours: 24 })),
        cancel: vi.fn(async () => ({ state: 'cancelled' })),
        sendProofOtp: vi.fn(async () => ({ channel: 'phone', expiresInSeconds: 600 })),
    }
    return { ...base, ...overrides }
}

function withScope<T>(fn: () => T): T {
    const scope = effectScope()
    try {
        return fn()
    } finally {
        scope.stop()
    }
}

describe('composables/use-channel-change', () => {
    it('splits remaining time into hours and minutes', () => {
        expect(splitRemainingMs(0)).toEqual({ hours: 0, minutes: 0 })
        expect(splitRemainingMs(59_000)).toEqual({ hours: 0, minutes: 1 })
        expect(splitRemainingMs(24 * 60 * 60 * 1000)).toEqual({ hours: 24, minutes: 0 })
        expect(splitRemainingMs(-1000)).toEqual({ hours: 0, minutes: 0 })
    })

    it('refreshes status and counts down without going negative', async () => {
        vi.useFakeTimers()
        const api = createApi({
            status: vi.fn(async (): Promise<ChannelChangeStatus> => ({
                state: 'pending',
                scheduledAt: new Date().toISOString(),
                remainingMs: 2500,
            })),
        })
        const flow = withScope(() => useChannelChange({ api }))
        await flow.refresh()
        expect(flow.status.value.state).toBe('pending')
        expect(flow.remainingMs.value).toBe(2500)
        expect(flow.isPending.value).toBe(true)
        expect(flow.canCancel.value).toBe(true)

        vi.advanceTimersByTime(3000)
        expect(flow.remainingMs.value).toBe(0)
        expect(flow.canCancel.value).toBe(false)
        flow.stopCountdown()
        vi.useRealTimers()
    })

    it('requests, confirms and cancels through the injected api', async () => {
        const api = createApi()
        const flow = withScope(() => useChannelChange({ api }))
        await flow.requestChange({ newEmail: 'new@example.com', password: 'pw', factor: 'totp', code: '123456' })
        expect(api.request).toHaveBeenCalledWith({
            newEmail: 'new@example.com',
            password: 'pw',
            factor: 'totp',
            code: '123456',
        })

        await flow.confirmOwnership('123456')
        expect(api.confirm).toHaveBeenCalledWith('123456')
        expect(api.status).toHaveBeenCalled()

        await flow.cancel()
        expect(api.cancel).toHaveBeenCalled()
        expect(api.status).toHaveBeenCalledTimes(2)
        expect(flow.submitting.value).toBe(false)
    })

    it('exposes the default $fetch-backed api', () => {
        const api = createChannelChangeApi()
        expect(typeof api.status).toBe('function')
        expect(typeof api.request).toBe('function')
        expect(typeof api.confirm).toBe('function')
        expect(typeof api.cancel).toBe('function')
        expect(typeof api.sendProofOtp).toBe('function')
    })
})
