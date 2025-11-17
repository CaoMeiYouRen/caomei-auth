import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { rateLimit } from '@/server/utils/rate-limit'

const { incrementMock } = vi.hoisted(() => ({
    incrementMock: vi.fn(),
}))

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: incrementMock,
    },
}))

const getRequestIPMock = vi.fn()

beforeAll(() => {
    ;(globalThis as any).getRequestIP = getRequestIPMock
})

afterAll(() => {
    delete (globalThis as any).getRequestIP
})

beforeEach(() => {
    getRequestIPMock.mockReset()
    incrementMock.mockReset()
})

describe('server/utils/rate-limit', () => {
    it('allows requests while usage stays within the limit', async () => {
        getRequestIPMock.mockReturnValue('203.0.113.5')
        incrementMock.mockResolvedValue(1)
        const event = { path: '/api/login' } as H3Event

        await expect(rateLimit(event, { window: 60, max: 3 })).resolves.toBeUndefined()

        expect(incrementMock).toHaveBeenCalledWith('ratelimit:203.0.113.5:/api/login', 60)
    })

    it('falls back to unknown ip when request address is missing', async () => {
        getRequestIPMock.mockReturnValue(undefined)
        incrementMock.mockResolvedValue(2)
        const event = { path: '/api/profile' } as H3Event

        await expect(rateLimit(event, { window: 120, max: 5 })).resolves.toBeUndefined()

        expect(incrementMock).toHaveBeenCalledWith('ratelimit:unknown:/api/profile', 120)
    })

    it('throws a 429 error once the quota is exceeded', async () => {
        getRequestIPMock.mockReturnValue('198.51.100.10')
        incrementMock.mockResolvedValue(6)
        const event = { path: '/api/login' } as H3Event

        await expect(rateLimit(event, { window: 60, max: 5 })).rejects.toMatchObject({
            statusCode: 429,
            message: '请求过于频繁，请稍后再试',
        })
    })
})
