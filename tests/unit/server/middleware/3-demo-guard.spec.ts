import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

// Hoist mocks
const mockLoggerWarn = vi.fn()
const mockCreateError = vi.fn()

// Mock dependencies
vi.mock('@/utils/shared/env', () => ({
    DEMO_MODE: false,
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: mockLoggerWarn,
    },
}))

// Mock h3
vi.mock('h3', () => ({
    defineEventHandler: (fn: any) => fn,
    createError: mockCreateError,
}))

// Helper to create mock event
function createMockEvent(method: string, url: string): H3Event {
    return {
        node: {
            req: {
                method,
                url,
            },
        },
    } as unknown as H3Event
}

describe('Server Middleware: Demo Guard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreateError.mockImplementation((options: any) => {
            const error = new Error(options.data?.message || 'Demo Mode')
            ;(error as any).statusCode = options.statusCode
            ;(error as any).data = options.data
            throw error
        })
    })

    describe('isDemoMode', () => {
        it('should export isDemoMode function', async () => {
            const { isDemoMode } = await import('@/server/middleware/3-demo-guard')
            expect(isDemoMode).toBeDefined()
            expect(typeof isDemoMode).toBe('function')
        })

        it('should return false when DEMO_MODE is false', async () => {
            const { isDemoMode } = await import('@/server/middleware/3-demo-guard')
            expect(isDemoMode()).toBe(false)
        })
    })

    describe('Middleware behavior', () => {
        it('should allow all requests when DEMO_MODE is false', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: false,
            }))

            // Re-import to get new mock value
            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/admin/create-user')

            // Should not throw since DEMO_MODE is false
            const result = await middleware.default(mockEvent)
            expect(result).toBeUndefined()
        })

        it('should allow GET requests in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('GET', '/api/admin/users')

            // Should not throw for GET requests
            const result = await middleware.default(mockEvent)
            expect(result).toBeUndefined()
        })

        it('should allow sign-in requests in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/auth/sign-in/email')

            // Should not throw for allowed operations
            const result = await middleware.default(mockEvent)
            expect(result).toBeUndefined()
        })

        it('should block dangerous admin operations in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/admin/create-user')

            // Should throw for dangerous admin operations
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should block user registration in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/auth/sign-up')

            // Should throw for sign-up
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should block password change in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/auth/change-password')

            // Should throw for password change
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should block file upload in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/file/upload')

            // Should throw for file upload
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should block PUT requests to admin API in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('PUT', '/api/admin/oauth/applications/123')

            // Should throw for PUT to admin API
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should block DELETE requests to admin API in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('DELETE', '/api/admin/sso/providers/123')

            // Should throw for DELETE to admin API
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })

        it('should allow sign-out requests in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/auth/sign-out')

            // Should not throw for sign-out
            const result = await middleware.default(mockEvent)
            expect(result).toBeUndefined()
        })

        it('should block write operations to non-allowed endpoints in demo mode', async () => {
            vi.doMock('@/utils/shared/env', () => ({
                DEMO_MODE: true,
            }))

            vi.resetModules()
            const middleware = await import('@/server/middleware/3-demo-guard')

            const mockEvent = createMockEvent('POST', '/api/some-random-endpoint')

            // Should throw for non-allowed write operations
            await expect(middleware.default(mockEvent)).rejects.toThrow()
            expect(mockLoggerWarn).toHaveBeenCalled()
        })
    })
})
