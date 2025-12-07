import { ref, onMounted, watch, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { authClient } from '@/lib/auth-client'
import { nicknameValidator } from '@/utils/shared/validate'
import { AUTH_BASE_URL } from '@/utils/shared/env'
import { getSocialColor } from '@/utils/web/social-colors'
import type { SocialProvider } from '@/types/social'

export async function useProfileFlow() {
    const config = useRuntimeConfig().public
    const phoneEnabled = !!config.phoneEnabled

    const toast = useToast()
    const confirm = useConfirm()
    const user = ref({
        id: '',
        username: '',
        nickname: '',
        avatar: '',
        email: '',
        emailVerified: false,
        phone: '',
        phoneVerified: false,
    })

    const saving = ref(false)
    const showEmailModal = ref(false)
    const showPhoneModal = ref(false)
    const showSetUsernameDialog = ref(false)

    const { data: providersData } = await useFetch<{ providers: SocialProvider[] }>('/api/social/providers?includeDisabled=true')
    const isDark = useDark()

    const socialProviders = computed(() => {
        const providers = providersData.value?.providers || []
        return providers.map((provider) => {
            const theme = isDark.value ? 'dark' : 'light'
            const color = getSocialColor(provider.provider, theme)
            return { ...provider, color }
        })
    })

    const enabledProviders = computed(() => socialProviders.value.filter((p) => p.enabled))

    const getProviderName = (provider: string) => {
        const providerObj = socialProviders.value.find((p) => p.provider === provider)
        return providerObj ? providerObj.name : provider
    }

    // Session handling
    const { data: session } = await authClient.useSession(useFetch)
    const clarity = useClarity()

    watch(
        () => session.value?.session,
        async () => {
            const newUser = session.value?.user
            if (newUser) {
                Object.assign(user.value, {
                    id: newUser.id,
                    username: newUser.username || '',
                    nickname: newUser.name || '',
                    avatar: newUser.image || '',
                    email: newUser.email || '',
                    emailVerified: newUser.emailVerified || false,
                    phone: newUser.phoneNumber || '',
                    phoneVerified: newUser.phoneNumberVerified || false,
                })

                clarity.identify(newUser.id, undefined, '/profile', newUser.name)
                clarity.setTag('page_type', 'profile')
                clarity.setTag('user_verified_email', newUser.emailVerified ? 'yes' : 'no')
                clarity.setTag('user_verified_phone', newUser.phoneNumberVerified ? 'yes' : 'no')
            }
        },
        { immediate: true },
    )

    // Social Accounts
    const userAccounts = ref<{
        id: string
        providerId: string
        createdAt: Date
        updatedAt: Date
        accountId: string
        scopes: string[]
    }[]>([])

    const fetchUserAccounts = async () => {
        try {
            const accounts = await authClient.listAccounts({})
            userAccounts.value = accounts.data?.filter((account) => account.providerId !== 'credential') || []
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '获取第三方账号信息失败'
            toast.add({
                severity: 'error',
                summary: '获取第三方账号失败',
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    async function linkSocialAccount(socialProvider: SocialProvider) {
        const { provider, name, social, oauth2, enabled } = socialProvider

        if (!enabled) {
            toast.add({
                severity: 'warn',
                summary: '绑定失败',
                detail: `${name} 登录方式未启用，无法绑定`,
                life: 5000,
            })
            return
        }

        try {
            let result: any
            if (social) {
                result = await authClient.linkSocial({
                    provider,
                    callbackURL: `${AUTH_BASE_URL}/profile`,
                })
            } else if (oauth2) {
                result = await authClient.oauth2.link({
                    providerId: provider,
                    callbackURL: `${AUTH_BASE_URL}/profile`,
                })
            }
            if (!result || result.error) {
                throw new Error(result?.error?.message || `${name} 绑定失败`)
            }
            await fetchUserAccounts()
            toast.add({
                severity: 'success',
                summary: `正在绑定 ${name} 中`,
                life: 2000,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `${name} 绑定时发生未知错误`
            toast.add({
                severity: 'error',
                summary: `${name} 绑定失败`,
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    async function unlinkAccount(provider: string, accountId: string) {
        try {
            const result = await authClient.unlinkAccount({
                providerId: provider,
                accountId,
            })
            if (result.error) {
                throw new Error(result.error.message || `${provider} 解绑失败`)
            }
            await fetchUserAccounts()
            toast.add({
                severity: 'success',
                summary: `已解绑${provider}`,
                life: 2000,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `${provider} 解绑时发生未知错误`
            toast.add({
                severity: 'error',
                summary: `${provider} 解绑失败`,
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    function confirmUnlink(provider: string, accountId: string) {
        const providerName = getProviderName(provider)
        confirm.require({
            message: `确定要解绑 ${providerName} 平台，ID 为 ${accountId} 的账号吗？`,
            header: '确认解绑',
            icon: 'mdi mdi-alert',
            rejectClass: 'p-button-secondary p-button-outlined',
            acceptClass: 'p-button-primary',
            accept: async () => {
                await unlinkAccount(provider, accountId)
            },
        })
    }

    // Profile Actions
    async function saveProfile() {
        if (!nicknameValidator(user.value.nickname)) {
            toast.add({ severity: 'warn', summary: '昵称格式有误', detail: '昵称长度需在 2 - 36 个字符之间，仅允许中英文、数字和常见标点符号。', life: 5000 })
            return
        }
        saving.value = true
        try {
            const result = await authClient.updateUser({
                image: user.value.avatar,
                name: user.value.nickname,
            })
            if (result.error) {
                throw new Error(result.error.message || '资料保存失败')
            }
            toast.add({ severity: 'success', summary: '资料已保存', life: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '资料保存时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '资料保存失败',
                detail: errorMessage,
                life: 5000,
            })
        } finally {
            saving.value = false
        }
    }

    function goChangePassword() {
        navigateTo('/change-password')
    }

    function goOAuthClients() {
        navigateTo('/oauth/clients')
    }

    function goSecurity() {
        navigateTo('/security')
    }

    async function performLogout() {
        try {
            await authClient.signOut({})
            toast.add({ severity: 'success', summary: '登出成功', life: 2000 })
            navigateTo('/login')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登出时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '登出失败',
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    function handleLogout() {
        confirm.require({
            message: '确定要退出登录吗？退出后需要重新登录才能访问您的账户。',
            header: '确认退出',
            icon: 'mdi mdi-logout',
            rejectClass: 'p-button-secondary p-button-outlined',
            acceptClass: 'p-button-primary',
            accept: async () => {
                await performLogout()
            },
        })
    }

    // Privacy Mode
    const privacyMode = ref(false)

    onMounted(async () => {
        await fetchUserAccounts()

        if (import.meta.client) {
            const savedPrivacyMode = localStorage.getItem('caomei-auth-privacy-mode')
            if (savedPrivacyMode !== null) {
                privacyMode.value = savedPrivacyMode === 'true'
            }
        }
    })

    if (import.meta.client) {
        watch(privacyMode, (newValue) => {
            localStorage.setItem('caomei-auth-privacy-mode', String(newValue))
        })
    }

    return {
        user,
        saving,
        showEmailModal,
        showPhoneModal,
        showSetUsernameDialog,
        userAccounts,
        privacyMode,
        socialProviders,
        enabledProviders,
        phoneEnabled,
        fetchUserAccounts,
        linkSocialAccount,
        confirmUnlink,
        saveProfile,
        goChangePassword,
        goOAuthClients,
        goSecurity,
        handleLogout,
    }
}
