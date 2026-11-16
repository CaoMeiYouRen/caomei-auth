import { ref, onMounted, watch, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { useToast, useConfirm } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { nicknameValidator } from '@/utils/shared/validate'
import { AUTH_BASE_URL } from '@/utils/shared/env'
import { getSocialColor } from '@/utils/web/social-colors'
import type { SocialProvider } from '@/types/social'
import { useI18nText } from '@/composables/utils/use-i18n-text'

export async function useProfileFlow() {
    const config = useRuntimeConfig().public
    const t = useI18nText()
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
        timezone: '',
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
        () => session.value?.user,
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
                    timezone: (newUser as { timezone?: string | null }).timezone ?? '',
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
            const errorMessage = error instanceof Error ? error.message : t('profile.flow.accountsLoadFailed')
            toast.danger({ title: t('profile.flow.accountsLoadFailedTitle'), description: errorMessage, duration: 5000 })
        }
    }

    async function linkSocialAccount(socialProvider: SocialProvider) {
        const { provider, name, enabled } = socialProvider

        if (!enabled) {
            toast.warning({ title: t('profile.flow.bindBlockedTitle'), description: t('profile.flow.bindBlocked', { name }), duration: 5000 })
            return
        }

        try {
            const result = await authClient.linkSocial({
                provider,
                callbackURL: `${AUTH_BASE_URL}/profile`,
            })
            if (!result || result.error) {
                throw new Error(result?.error?.message || t('profile.flow.bindFailed', { name }))
            }
            await fetchUserAccounts()
            toast.success({ title: t('profile.flow.bindInProgress', { name }), duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('profile.flow.bindFailedUnknown', { name })
            toast.danger({ title: t('profile.flow.bindFailed', { name }), description: errorMessage, duration: 5000 })
        }
    }

    async function unlinkAccount(provider: string, accountId: string) {
        try {
            const result = await authClient.unlinkAccount({
                accountId,
            })
            if (result.error) {
                throw new Error(result.error.message || t('profile.flow.unlinkFailed', { provider }))
            }
            await fetchUserAccounts()
            toast.success({ title: t('profile.flow.unlinked', { provider }), duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('profile.flow.unlinkFailedUnknown', { provider })
            toast.danger({ title: t('profile.flow.unlinkFailed', { provider }), description: errorMessage, duration: 5000 })
        }
    }

    async function confirmUnlink(provider: string, accountId: string) {
        const providerName = getProviderName(provider)
        const confirmed = await confirm.open({
            title: t('profile.flow.confirmUnlinkTitle'),
            description: t('profile.flow.confirmUnlink', { provider: providerName, accountId }),
            tone: 'danger',
        })
        if (confirmed) {
            await unlinkAccount(provider, accountId)
        }
    }

    // Profile Actions
    async function saveProfile() {
        if (!nicknameValidator(user.value.nickname)) {
            toast.warning({ title: t('profile.flow.nicknameInvalidTitle'), description: t('profile.flow.nicknameInvalid'), duration: 5000 })
            return
        }
        saving.value = true
        try {
            const result = await authClient.updateUser({
                image: user.value.avatar,
                name: user.value.nickname,
            })
            if (result.error) {
                throw new Error(result.error.message || t('profile.flow.saveFailed'))
            }
            toast.success({ title: t('profile.flow.saved'), duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('profile.flow.saveFailedUnknown')
            toast.danger({ title: t('profile.flow.saveFailed'), description: errorMessage, duration: 5000 })
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
            toast.success({ title: t('profile.flow.logoutSuccess'), duration: 2000 })
            navigateTo('/login')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('profile.flow.logoutFailedUnknown')
            toast.danger({ title: t('profile.flow.logoutFailed'), description: errorMessage, duration: 5000 })
        }
    }

    async function handleLogout() {
        const confirmed = await confirm.open({
            title: t('profile.flow.confirmLogoutTitle'),
            description: t('profile.flow.confirmLogout'),
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
