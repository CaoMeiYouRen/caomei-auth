import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useIndexFlow } from '@/composables/use-index-flow'
import { authClient } from '@/lib/auth-client'

// Mock authClient using hoisted variable
const useSessionMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth-client', () => ({
    authClient: { useSession: useSessionMock },
}))

// Mock Nuxt imports
const useFetchMock = vi.hoisted(() => vi.fn())
const navigateToMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('navigateTo', () => navigateToMock)

describe('useIndexFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize session', async () => {
        const mockSessionData = { user: { id: '1' } }
        useSessionMock.mockResolvedValue({
            data: ref(mockSessionData),
        } as any)

        const { session } = await useIndexFlow()

        expect(session.value).toEqual(mockSessionData)
        expect(useSessionMock).toHaveBeenCalled()
    })

    it('should navigate to correct routes', async () => {
        useSessionMock.mockResolvedValue({
            data: ref({}),
        } as any)

        const { toLogin, toRegister, toProfile } = await useIndexFlow()

        toLogin()
        expect(navigateToMock).toHaveBeenCalledWith('/login')

        toRegister()
        expect(navigateToMock).toHaveBeenCalledWith('/register')

        toProfile()
        expect(navigateToMock).toHaveBeenCalledWith('/profile')
    })
})
