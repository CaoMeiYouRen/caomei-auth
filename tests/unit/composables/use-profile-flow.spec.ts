import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useProfileFlow } from '@/composables/use-profile-flow'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
    authClient: { useSession: vi.fn() },
}))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => ({ require: vi.fn() }) }))
vi.mock('@vueuse/core', () => ({ useDark: () => ref(false) }))
vi.mock('@/composables/use-clarity', () => ({ useClarity: () => ({ identify: vi.fn(), setTag: vi.fn() }) }))

vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>()
    return {
        ...actual,
        onMounted: vi.fn(),
    }
})

const useFetchMock = vi.hoisted(() => vi.fn())
const useRuntimeConfigMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

describe('useProfileFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRuntimeConfigMock.mockReturnValue({ public: { phoneEnabled: true } })
    })

    it('should initialize user data from session', async () => {
        const mockSession = {
            data: ref({
                session: { id: 'session-1' },
                user: {
                    id: 'user-1',
                    username: 'testuser',
                    email: 'test@example.com',
                    emailVerified: true,
                },
            }),
        }
        vi.mocked(authClient.useSession).mockResolvedValue(mockSession as any)
        useFetchMock.mockResolvedValue({ data: ref({ providers: [] }) })

        const { user } = await useProfileFlow()
        await nextTick()

        expect(user.value.username).toBe('testuser')
    })

    it('should load social providers', async () => {
        vi.mocked(authClient.useSession).mockResolvedValue({ data: ref(null) } as any)
        const mockProviders = [{ provider: 'github', name: 'GitHub', enabled: true }]
        useFetchMock.mockResolvedValue({ data: ref({ providers: mockProviders }) })

        const { enabledProviders } = await useProfileFlow()

        expect(enabledProviders.value).toHaveLength(1)
        expect(enabledProviders.value[0]?.provider).toBe('github')
    })
})
