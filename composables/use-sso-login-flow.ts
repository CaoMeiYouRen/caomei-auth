import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

export function useSsoLoginFlow() {
    const toast = useToast()
    const route = useRoute()

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
            console.error('获取 SSO 提供商列表失败:', error)
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
                throw new Error(result.error.message || 'SSO 登录失败')
            }

            // 成功时会重定向，不需要额外处理
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: error.message || '无法找到匹配的 SSO 提供商',
                life: 5000,
            })
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
                throw new Error(result.error.message || 'SSO 登录失败')
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: error.message || '无法找到匹配的 SSO 提供商',
                life: 5000,
            })
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
                throw new Error(result.error.message || 'SSO 登录失败')
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: error.message || '无法找到匹配的组织',
                life: 5000,
            })
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
                throw new Error(result.error.message || 'SSO 登录失败')
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: error.message || '无法找到指定的 SSO 提供商',
                life: 5000,
            })
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
                throw new Error(result.error.message || 'SSO 登录失败')
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: error.message || `无法使用 ${provider.name || provider.providerId} 登录`,
                life: 5000,
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
            toast.add({
                severity: 'error',
                summary: 'SSO 登录失败',
                detail: '身份验证过程中发生错误，请重试或联系管理员',
                life: 5000,
            })
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
