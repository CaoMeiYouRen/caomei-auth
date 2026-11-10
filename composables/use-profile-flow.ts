import { ref, onMounted, watch, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { useToast, useConfirm } from 'caomei-ui'
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
    const clarity = useClarity()
    const isDark = useDark()

    // 预先调用 useFetch 以保留 Nuxt 上下文
    const providersPromise = useFetch<{ providers: SocialProvider[] }>('/api/social/providers?includeDisabled=true')

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

    // Session handling
    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

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


    const { data: providersData } = await providersPromise


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
            console.log('accounts', accounts.data)
            userAccounts.value = accounts.data?.filter((account) => account.providerId !== 'credential') || []
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '获取第三方账号信息失败'
            toast.danger({ title: '获取第三方账号失败', description: errorMessage, duration: 5000 })
        }
    }

    async function linkSocialAccount(socialProvider: SocialProvider) {
        const { provider, name, enabled } = socialProvider

        if (!enabled) {
            toast.warning({ title: '绑定失败', description: `${name} 登录方式未启用，无法绑定`, duration: 5000 })
            return
        }

        try {
            const result = await authClient.linkSocial({
                provider,
                callbackURL: `${AUTH_BASE_URL}/profile`,
            })
            if (!result || result.error) {
                throw new Error(result?.error?.message || `${name} 绑定失败`)
            }
            await fetchUserAccounts()
            toast.success({ title: `正在绑定 ${name} 中`, duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `${name} 绑定时发生未知错误`
            toast.danger({ title: `${name} 绑定失败`, description: errorMessage, duration: 5000 })
        }
    }

    async function unlinkAccount(provider: string, accountId: string) {
        try {
            const result = await authClient.unlinkAccount({
                accountId,
            })
            if (result.error) {
                throw new Error(result.error.message || `${provider} 解绑失败`)
            }
            await fetchUserAccounts()
            toast.success({ title: `已解绑${provider}`, duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `${provider} 解绑时发生未知错误`
            toast.danger({ title: `${provider} 解绑失败`, description: errorMessage, duration: 5000 })
        }
    }

    async function confirmUnlink(provider: string, accountId: string) {
        const providerName = getProviderName(provider)
        const confirmed = await confirm.open({
            title: '确认解绑',
            description: `确定要解绑 ${providerName} 平台，ID 为 ${accountId} 的账号吗？`,
            tone: 'danger',
        })
        if (confirmed) {
            await unlinkAccount(provider, accountId)
        }
    }

    // Profile Actions
    async function saveProfile() {
        if (!nicknameValidator(user.value.nickname)) {
            toast.warning({ title: '昵称格式有误', description: '昵称长度需在 2 - 36 个字符之间，仅允许中英文、数字和常见标点符号。', duration: 5000 })
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
            toast.success({ title: '资料已保存', duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '资料保存时发生未知错误'
            toast.danger({ title: '资料保存失败', description: errorMessage, duration: 5000 })
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
            toast.success({ title: '登出成功', duration: 2000 })
            navigateTo('/login')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登出时发生未知错误'
            toast.danger({ title: '登出失败', description: errorMessage, duration: 5000 })
        }
    }

    async function handleLogout() {
        const confirmed = await confirm.open({
            title: '确认退出',
            description: '确定要退出登录吗？退出后需要重新登录才能访问您的账户。',
        })
        if (confirmed) {
            await performLogout()
        }
    }

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
