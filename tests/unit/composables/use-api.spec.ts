import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from '@/composables/core/use-api'

// Mock dependencies
const mocks = vi.hoisted(() => {
    const add = vi.fn()
    return {
        useFetch: vi.fn(),
        useToast: vi.fn(() => ({ add })),
        navigateTo: vi.fn(),
        addSpy: add,
    }
})

vi.mock('nuxt/app', () => ({
    useFetch: mocks.useFetch,
    navigateTo: mocks.navigateTo,
}))

vi.mock('primevue/usetoast', () => ({
    useToast: mocks.useToast,
}))

describe('useApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call useFetch with default options', () => {
        useApi('/api/test')

        const args = mocks.useFetch.mock.calls[0]
        if (!args) {
            throw new Error('useFetch was not called')
        }
        expect(args[0]).toBe('/api/test')
        expect(args[1]).toEqual(expect.objectContaining({
            key: '/api/test',
            onResponseError: expect.any(Function),
        }))
    })

    it('should merge custom options', () => {
        useApi('/api/test', { method: 'POST' })

        const args = mocks.useFetch.mock.calls[0]
        if (!args) {
            throw new Error('useFetch was not called')
        }
        expect(args[0]).toBe('/api/test')
        expect(args[1]).toEqual(expect.objectContaining({
            method: 'POST',
        }))
    })

    describe('error handling', () => {
        let onResponseError: (context: any) => void

        beforeEach(() => {
            // Capture the onResponseError handler
            useApi('/api/test')
            const callArgs = mocks.useFetch.mock.calls[0]
            if (!callArgs) {
                throw new Error('useFetch was not called')
            }
            const options = callArgs[1]
            onResponseError = options.onResponseError
        })

        it('should handle 401 error', () => {
            onResponseError({
                response: {
                    status: 401,
                    _data: { message: 'Unauthorized' },
                },
            })

            expect(mocks.addSpy).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: '认证失效',
            }))
            expect(mocks.navigateTo).toHaveBeenCalledWith('/login')
        })

        it('should handle 403 error', () => {
            onResponseError({
                response: {
                    status: 403,
                    _data: { message: 'Forbidden' },
                },
            })

            expect(mocks.addSpy).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: '权限不足',
            }))
            expect(mocks.navigateTo).not.toHaveBeenCalled()
        })

        it('should handle generic error', () => {
            onResponseError({
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                },
            })

            expect(mocks.addSpy).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: '请求错误',
                detail: 'Internal Server Error',
            }))
        })

        it('should use message from response data if available', () => {
            onResponseError({
                response: {
                    status: 400,
                    _data: { message: 'Custom Error Message' },
                },
            })

            expect(mocks.addSpy).toHaveBeenCalledWith(expect.objectContaining({
                detail: 'Custom Error Message',
            }))
        })
    })
})
