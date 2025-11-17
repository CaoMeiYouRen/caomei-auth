import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import type { H3Event } from 'h3'
import { checkAdmin } from '@/server/utils/check-admin'

const { demoModeRef, getUserSessionMock, getDemoConfigMock } = vi.hoisted(() => ({
    demoModeRef: { value: false },
    getUserSessionMock: vi.fn(),
    getDemoConfigMock: vi.fn(),
}))

vi.mock('@/server/utils/get-user-session', () => ({
    getUserSession: getUserSessionMock,
}))

vi.mock('@/server/utils/demo-data-generator', () => ({
    getDemoConfig: getDemoConfigMock,
}))

vi.mock('@/utils/env', () => ({
    get DEMO_MODE() {
        return demoModeRef.value
    },
}))

const createErrorMock = vi.fn((error: any) => error)

beforeAll(() => {
    ;(globalThis as any).createError = createErrorMock
})

afterAll(() => {
    delete (globalThis as any).createError
})

beforeEach(() => {
    demoModeRef.value = false
    getUserSessionMock.mockReset()
    getDemoConfigMock.mockReset()
    createErrorMock.mockClear()
})

describe('server/utils/check-admin', () => {
    const mockEvent = { headers: {} } as H3Event

    it('throws 401 when user session is missing', async () => {
        getUserSessionMock.mockResolvedValueOnce(null)

        await expect(checkAdmin(mockEvent)).rejects.toMatchObject({
            statusCode: 401,
            message: '未登录用户',
        })
    })

    it('throws 403 for non-admin users outside demo mode', async () => {
        getUserSessionMock.mockResolvedValueOnce({
            userId: 'user-1',
            session: {
                user: {
                    role: 'user',
                },
            },
        })

        await expect(checkAdmin(mockEvent)).rejects.toMatchObject({
            statusCode: 403,
            message: '无权限访问',
        })
    })

    it('returns success for admins outside demo mode', async () => {
        const mockSession = {
            userId: 'user-2',
            session: {
                user: {
                    role: 'admin,user',
                },
            },
        }
        getUserSessionMock.mockResolvedValueOnce(mockSession)

        await expect(checkAdmin(mockEvent)).resolves.toEqual({
            status: 200,
            success: true,
            data: mockSession,
            demoMode: false,
        })
    })

    it('grants access to demo admin while in demo mode', async () => {
        demoModeRef.value = true
        getDemoConfigMock.mockReturnValue({
            adminUser: { name: '演示管理员' },
        })
        const mockSession = {
            userId: 'demo-admin-id',
            session: {
                user: {
                    name: '演示管理员',
                },
            },
        }
        getUserSessionMock.mockResolvedValueOnce(mockSession)

        await expect(checkAdmin(mockEvent)).resolves.toEqual({
            status: 200,
            success: true,
            data: mockSession,
            demoMode: true,
        })
    })

    it('denies non-admins while in demo mode', async () => {
        demoModeRef.value = true
        getDemoConfigMock.mockReturnValue({
            adminUser: { name: '演示管理员' },
        })
        getUserSessionMock.mockResolvedValueOnce({
            userId: 'demo-user-id',
            session: {
                user: {
                    name: '不是管理员',
                },
            },
        })

        await expect(checkAdmin(mockEvent)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Demo 模式：无管理员权限',
        })
    })
})
