import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from '@/composables/core/use-api'

// Mock dependencies
const toast = { add: vi.fn() }
const navigateToMock = vi.fn()
const useFetchMock = vi.fn()

vi.mock('primevue/usetoast', () => ({
    useToast: () => toast,
}))

vi.mock('nuxt/app', () => ({
    useFetch: (url: any, options: any) => useFetchMock(url, options),
    navigateTo: (url: any) => navigateToMock(url),
}))

describe('useApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('calls useFetch with correct options', () => {
        useApi('/test', { method: 'POST' })
        expect(useFetchMock).toHaveBeenCalledWith('/test', expect.objectContaining({
            method: 'POST',
            key: '/test',
        }))
    })

    it('handles 401 error', () => {
        useApi('/test')
        const calls = useFetchMock.mock.calls
        const options = calls[0]?.[1]

        if (!options) {
            throw new Error('Options not passed to useFetch')
        }

        // Simulate error
        options.onResponseError({
            response: {
                status: 401,
                _data: { message: 'Unauthorized' },
            },
        })

        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '认证失效',
        }))
        expect(navigateToMock).toHaveBeenCalledWith('/login')
    })

    it('handles 403 error', () => {
        useApi('/test')
        const calls = useFetchMock.mock.calls
        const options = calls[0]?.[1]

        if (!options) {
            throw new Error('Options not passed to useFetch')
        }

        options.onResponseError({
            response: {
                status: 403,
                _data: { message: 'Forbidden' },
            },
        })

        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '权限不足',
        }))
    })
})
