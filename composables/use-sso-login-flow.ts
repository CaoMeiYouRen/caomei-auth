import { ref, onMounted } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { useI18nText } from '@/composables/utils/use-i18n-text'

export function useSsoLoginFlow() {
    const toast = useToast()
    const route = useRoute()
    const t = useI18nText()

    // 表单数据
    const emailForm = ref({
        email: '',
        loading: false,
    })

    const domainForm = ref({
        domain: '',
        loading: false,
    })

    const orgForm = ref({
        organizationSlug: '',
        loading: false,
    })

    const providerForm = ref({
        providerId: '',
        loading: false,
    })

    // 可用的 SSO 提供商
    const availableProviders = ref<any[]>([])
    const specificProviderLoading = ref('')

    // 获取可用的 SSO 提供商列表
    async function loadAvailableProviders() {
        try {
            const response = await $fetch('/api/sso/providers/available', {
                method: 'GET',
            })

            if (response.success) {
                availableProviders.value = response.data || []
            }
        } catch (error) {
            console.error('Failed to load SSO providers:', error)
        }
    }

    // 通过邮箱登录
    async function signInWithEmail() {
        try {
            emailForm.value.loading = true

            const result = await authClient.signIn.sso({
                email: emailForm.value.email,
                callbackURL: '/profile',
                errorCallbackURL: '/sso-login?error=sso_failed',
            })

            if (result.error) {
                throw new Error(result.error.message || t('sso.errorTitle'))
            }

            // 成功时会重定向，不需要额外处理
        } catch (error: any) {
            toast.danger({ title: t('sso.errorTitle'), description: error.message || t('sso.errorEmail'), duration: 5000 })
        } finally {
            emailForm.value.loading = false
        }
    }

    // 通过域名登录
    async function signInWithDomain() {
        try {
            domainForm.value.loading = true

            const result = await authClient.signIn.sso({
                domain: domainForm.value.domain,
                callbackURL: '/profile',
                errorCallbackURL: '/sso-login?error=sso_failed',
            })

            if (result.error) {
                throw new Error(result.error.message || t('sso.errorTitle'))
            }
        } catch (error: any) {
            toast.danger({ title: t('sso.errorTitle'), description: error.message || t('sso.errorDomain'), duration: 5000 })
        } finally {
            domainForm.value.loading = false
        }
    }

    // 通过组织登录
    async function signInWithOrganization() {
        try {
            orgForm.value.loading = true

            const result = await authClient.signIn.sso({
                organizationSlug: orgForm.value.organizationSlug,
                callbackURL: '/profile',
                errorCallbackURL: '/sso-login?error=sso_failed',
            })

            if (result.error) {
                throw new Error(result.error.message || t('sso.errorTitle'))
            }
        } catch (error: any) {
            toast.danger({ title: t('sso.errorTitle'), description: error.message || t('sso.errorOrg'), duration: 5000 })
        } finally {
            orgForm.value.loading = false
        }
    }

    // 通过 Provider ID 登录
    async function signInWithProvider() {
        try {
            providerForm.value.loading = true

            const result = await authClient.signIn.sso({
                providerId: providerForm.value.providerId,
                callbackURL: '/profile',
                errorCallbackURL: '/sso-login?error=sso_failed',
            })

            if (result.error) {
                throw new Error(result.error.message || t('sso.errorTitle'))
            }
        } catch (error: any) {
            toast.danger({ title: t('sso.errorTitle'), description: error.message || t('sso.errorProvider'), duration: 5000 })
        } finally {
            providerForm.value.loading = false
        }
    }

    // 通过特定提供商登录
    async function signInWithSpecificProvider(provider: any) {
        try {
            specificProviderLoading.value = provider.providerId

            const result = await authClient.signIn.sso({
                providerId: provider.providerId,
                callbackURL: '/profile',
                errorCallbackURL: '/sso-login?error=sso_failed',
            })

            if (result.error) {
                throw new Error(result.error.message || t('sso.errorTitle'))
            }
        } catch (error: any) {
            toast.danger({
                title: t('sso.errorTitle'),
                description: error.message || t('sso.errorSpecific', { name: provider.name || provider.providerId }),
                duration: 5000,
            })
        } finally {
            specificProviderLoading.value = ''
        }
    }

    // 页面挂载时获取可用提供商
    onMounted(() => {
        loadAvailableProviders()

        // 检查 URL 参数中的错误信息
        if (route.query.error === 'sso_failed') {
            toast.danger({ title: t('sso.errorTitle'), description: t('sso.errorCallback'), duration: 5000 })
        }
    })

    return {
        emailForm,
        domainForm,
        orgForm,
        providerForm,
        availableProviders,
        specificProviderLoading,
        signInWithEmail,
        signInWithDomain,
        signInWithOrganization,
        signInWithProvider,
        signInWithSpecificProvider,
    }
}
