import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { getUserSession } from '@/server/utils/get-user-session'

const { getSessionMock } = vi.hoisted(() => ({
    getSessionMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: getSessionMock,
        },
    },
}))
beforeEach(() => {
    getSessionMock.mockReset()
})

describe('server/utils/get-user-session', () => {
    const baseEvent = { headers: { authorization: 'Bearer token' } } as unknown as H3Event

    it('returns session detail when auth client resolves with a user', async () => {
        const mockSession = {
            user: {
                id: 'user-123',
                name: 'tester',
            },
            expires: '2025-01-01T00:00:00Z',
        }
        getSessionMock.mockResolvedValueOnce(mockSession)

        const result = await getUserSession(baseEvent)

        expect(getSessionMock).toHaveBeenCalledWith({ headers: baseEvent.headers })
        expect(result).toEqual({
            session: mockSession,
            user: mockSession.user,
            userId: 'user-123',
        })
    })

    it('throws a 401 error when session is missing or user not authenticated', async () => {
        getSessionMock.mockResolvedValueOnce({ user: null })

        await expect(getUserSession(baseEvent)).rejects.toMatchObject({
            statusCode: 401,
            message: '未登录用户',
        })
    })

    it('propagates 401 when user object lacks an id', async () => {
        getSessionMock.mockResolvedValueOnce({ user: { id: undefined } })

        await expect(getUserSession(baseEvent)).rejects.toMatchObject({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    })
})
