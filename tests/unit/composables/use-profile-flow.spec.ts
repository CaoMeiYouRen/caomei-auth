import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useProfileFlow } from '@/composables/use-profile-flow'

// --- Mocks ---
const {
    mockAuthClient,
    mockUseToast,
    mockUseConfirm,
    mockUseClarity,
    mockNavigateTo,
} = vi.hoisted(() => ({
    mockAuthClient: {
        useSession: vi.fn(),
        listAccounts: vi.fn(),
        linkSocial: vi.fn(),
        oauth2: {
            link: vi.fn(),
        },
        unlinkAccount: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
    },
    mockUseToast: {
        add: vi.fn(),
    },
    mockUseConfirm: {
        require: vi.fn(),
    },
    mockUseClarity: {
        identify: vi.fn(),
        setTag: vi.fn(),
    },
    mockNavigateTo: vi.fn(),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('@/lib/auth-client', () => ({
    authClient: mockAuthClient,
}))

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockUseToast,
}))

vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => mockUseConfirm,
}))

vi.mock('@vueuse/core', () => ({
    useDark: () => ref(false),
}))

vi.mock('@/composables/use-clarity', () => ({
    useClarity: () => mockUseClarity,
}))

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

        // Default session mock
        mockAuthClient.useSession.mockReturnValue({
            data: ref({
                session: { id: 'session-1' },
                user: {
                    id: 'user-1',
                    username: 'testuser',
                    email: 'test@example.com',
                    emailVerified: true,
                },
            }),
        })

        // Default providers mock
        useFetchMock.mockResolvedValue({ data: ref({ providers: [] }) })

        // Default listAccounts mock
        mockAuthClient.listAccounts.mockResolvedValue({ data: [] })
    })

    it('should initialize user data from session', async () => {
        const { user } = await useProfileFlow()
        await nextTick()

        expect(user.value.username).toBe('testuser')
        expect(mockUseClarity.identify).toHaveBeenCalledWith('user-1', undefined, '/profile', undefined)
    })

    it('should load social providers', async () => {
        const mockProviders = [{ provider: 'github', name: 'GitHub', enabled: true }]
        useFetchMock.mockResolvedValue({ data: ref({ providers: mockProviders }) })

        const { enabledProviders } = await useProfileFlow()

        expect(enabledProviders.value).toHaveLength(1)
        expect(enabledProviders.value[0]?.provider).toBe('github')
    })

    it('should fetch user accounts', async () => {
        const mockAccounts = [
            { id: '1', providerId: 'github', accountId: 'gh_123' },
            { id: '2', providerId: 'credential', accountId: 'cred_123' }, // Should be filtered out
        ]
        mockAuthClient.listAccounts.mockResolvedValue({ data: mockAccounts })

        const { userAccounts, fetchUserAccounts } = await useProfileFlow()

        // fetchUserAccounts is called in onMounted, which we mocked to run immediately
        // But listAccounts is async, so we might need to wait or call it manually if the onMounted logic didn't await it properly in the test context
        // Actually, onMounted in the component is async, but our mock executes it synchronously.
        // The async function inside onMounted will return a promise that we are not awaiting in the mock.
        // So we should call fetchUserAccounts manually to be sure, or await a flushPromises.

        await fetchUserAccounts()

        expect(userAccounts.value).toHaveLength(1)
        expect(userAccounts.value[0]?.providerId).toBe('github')
    })

    it('should handle fetch user accounts error', async () => {
        mockAuthClient.listAccounts.mockRejectedValue(new Error('Fetch failed'))

        const { fetchUserAccounts } = await useProfileFlow()
        await fetchUserAccounts()

        expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '获取第三方账号失败',
        }))
    })

    describe('Social Account Linking', () => {
        it('should link social account (social: true)', async () => {
            const { linkSocialAccount } = await useProfileFlow()
            const provider = { provider: 'github', name: 'GitHub', enabled: true, social: true }

            mockAuthClient.linkSocial.mockResolvedValue({ data: true })

            await linkSocialAccount(provider as any)

            expect(mockAuthClient.linkSocial).toHaveBeenCalledWith(expect.objectContaining({
                provider: 'github',
            }))
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should link social account (oauth2: true)', async () => {
            const { linkSocialAccount } = await useProfileFlow()
            const provider = { provider: 'oidc', name: 'OIDC', enabled: true, oauth2: true }

            mockAuthClient.oauth2.link.mockResolvedValue({ data: true })

            await linkSocialAccount(provider as any)

            expect(mockAuthClient.oauth2.link).toHaveBeenCalledWith(expect.objectContaining({
                providerId: 'oidc',
            }))
        })

        it('should handle link error', async () => {
            const { linkSocialAccount } = await useProfileFlow()
            const provider = { provider: 'github', name: 'GitHub', enabled: true, social: true }

            mockAuthClient.linkSocial.mockResolvedValue({ error: { message: 'Link failed' } })

            await linkSocialAccount(provider as any)

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Link failed',
            }))
        })

        it('should warn if provider is disabled', async () => {
            const { linkSocialAccount } = await useProfileFlow()
            const provider = { provider: 'github', name: 'GitHub', enabled: false }

            await linkSocialAccount(provider as any)

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warn',
            }))
            expect(mockAuthClient.linkSocial).not.toHaveBeenCalled()
        })
    })

    describe('Unlink Account', () => {
        it('should confirm unlink', async () => {
            const { confirmUnlink } = await useProfileFlow()

            confirmUnlink('github', 'gh_123')

            expect(mockUseConfirm.require).toHaveBeenCalledWith(expect.objectContaining({
                header: '确认解绑',
                accept: expect.any(Function),
            }))
        })

        it('should unlink account successfully', async () => {
            const { confirmUnlink } = await useProfileFlow()

            // Trigger the accept callback manually
            let acceptCallback: () => Promise<void> = async () => {}
            mockUseConfirm.require.mockImplementation((options: any) => {
                acceptCallback = options.accept
            })

            confirmUnlink('github', 'gh_123')

            mockAuthClient.unlinkAccount.mockResolvedValue({ data: true })

            await acceptCallback()

            expect(mockAuthClient.unlinkAccount).toHaveBeenCalledWith({
                providerId: 'github',
                accountId: 'gh_123',
            })
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should handle unlink error', async () => {
            const { confirmUnlink } = await useProfileFlow()

            // Trigger the accept callback manually
            let acceptCallback: () => Promise<void> = async () => {}
            mockUseConfirm.require.mockImplementation((options: any) => {
                acceptCallback = options.accept
            })

            confirmUnlink('github', 'gh_123')

            mockAuthClient.unlinkAccount.mockResolvedValue({ error: { message: 'Unlink failed' } })

            await acceptCallback()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Unlink failed',
            }))
        })
    })

    describe('Profile Actions', () => {
        it('should save profile successfully', async () => {
            const { saveProfile, user } = await useProfileFlow()

            user.value.nickname = 'NewNickname'
            mockAuthClient.updateUser.mockResolvedValue({ data: true })

            await saveProfile()

            expect(mockAuthClient.updateUser).toHaveBeenCalledWith(expect.objectContaining({
                name: 'NewNickname',
            }))
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should validate nickname before saving', async () => {
            const { saveProfile, user } = await useProfileFlow()

            user.value.nickname = 'A' // Too short

            await saveProfile()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warn',
                summary: '昵称格式有误',
            }))
            expect(mockAuthClient.updateUser).not.toHaveBeenCalled()
        })

        it('should handle save profile error', async () => {
            const { saveProfile, user } = await useProfileFlow()

            user.value.nickname = 'ValidNickname'
            mockAuthClient.updateUser.mockResolvedValue({ error: { message: 'Update failed' } })

            await saveProfile()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Update failed',
            }))
        })
    })

    describe('Navigation & Logout', () => {
        it('should navigate to change password', async () => {
            const { goChangePassword } = await useProfileFlow()
            goChangePassword()
            expect(mockNavigateTo).toHaveBeenCalledWith('/change-password')
        })

        it('should navigate to oauth clients', async () => {
            const { goOAuthClients } = await useProfileFlow()
            goOAuthClients()
            expect(mockNavigateTo).toHaveBeenCalledWith('/oauth/clients')
        })

        it('should navigate to security', async () => {
            const { goSecurity } = await useProfileFlow()
            goSecurity()
            expect(mockNavigateTo).toHaveBeenCalledWith('/security')
        })

        it('should handle logout', async () => {
            const { handleLogout } = await useProfileFlow()

            let acceptCallback: () => Promise<void> = async () => {}
            mockUseConfirm.require.mockImplementation((options: any) => {
                acceptCallback = options.accept
            })

            handleLogout()

            mockAuthClient.signOut.mockResolvedValue({ data: true })

            await acceptCallback()

            expect(mockAuthClient.signOut).toHaveBeenCalled()
            expect(mockNavigateTo).toHaveBeenCalledWith('/login')
        })
    })
})
