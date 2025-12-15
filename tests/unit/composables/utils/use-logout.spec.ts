import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useLogout } from '@/composables/utils/use-logout'

// Mock dependencies
const { mockToast, mockAuthClient, mockNavigateTo } = vi.hoisted(() => {
    const toast = {
        add: vi.fn(),
    }
    const authClient = {
        signOut: vi.fn(),
    }
    const navigateTo = vi.fn()
    return { mockToast: toast, mockAuthClient: authClient, mockNavigateTo: navigateTo }
})

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockToast,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: mockAuthClient,
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
describe('composables/utils/use-logout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should logout successfully', async () => {
        const { logout, loading } = useLogout()

        mockAuthClient.signOut.mockResolvedValue(undefined)

        const promise = logout()
        expect(loading.value).toBe(true)

        await promise

        expect(loading.value).toBe(false)
        expect(mockAuthClient.signOut).toHaveBeenCalled()
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: '登出成功',
        }))
        expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('should handle logout error', async () => {
        const { logout, loading } = useLogout()

        mockAuthClient.signOut.mockRejectedValue(new Error('Failed'))

        await logout()

        expect(loading.value).toBe(false)
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '登出失败',
        }))
        expect(mockNavigateTo).not.toHaveBeenCalled()
    })
})
