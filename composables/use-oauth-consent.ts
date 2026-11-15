import { ref, computed, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { useI18nText } from '@/composables/utils/use-i18n-text'

/** scope → 文案键（字面量集中，便于 i18n 审计扫到完整键名）。 */
const SCOPE_DESCRIPTION_KEYS: Record<string, string> = {
    openid: 'oauth.scopes.describe.openid',
    profile: 'oauth.scopes.describe.profile',
    email: 'oauth.scopes.describe.email',
    address: 'oauth.scopes.describe.address',
    phone: 'oauth.scopes.describe.phone',
    offline_access: 'oauth.scopes.describe.offlineAccess',
    read: 'oauth.scopes.describe.read',
    write: 'oauth.scopes.describe.write',
    admin: 'oauth.scopes.describe.admin',
    'user:read': 'oauth.scopes.describe.userRead',
    'user:write': 'oauth.scopes.describe.userWrite',
    'user:email': 'oauth.scopes.describe.userEmail',
    'read:user': 'oauth.scopes.describe.readUser',
    'read:profile': 'oauth.scopes.describe.readProfile',
    'write:user': 'oauth.scopes.describe.writeUser',
    'app:read': 'oauth.scopes.describe.appRead',
    'app:write': 'oauth.scopes.describe.appWrite',
}

interface ApplicationInfo {
    name: string
    clientId: string
    description?: string
    logoUri?: string
    clientUri?: string
    tosUri?: string
    policyUri?: string
}

export async function useOAuthConsent() {
    const toast = useToast()
    const t = useI18nText()
    const config = useRuntimeConfig()
    const route = useRoute()

    const submitting = ref(false)
    const hasError = ref(false)
    const isTrustedClient = ref(false)

    // 从 URL 参数中获取 OAuth2.0 标准参数
    const {
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        response_type: responseType,
        scope,
    } = route.query

    const oauthParams = ref({
        clientId: clientId as string,
        redirectUri: redirectUri as string,
        state: state as string,
        responseType: responseType as string,
        scope: scope as string,
    })

    // 解析 scopes
    const scopes = ref<string[]>((scope as string || '').split(' ').filter((s) => s.trim()))

    const parsedScopes = computed(() => scopes.value.map((scopeItem) => {
        const key = SCOPE_DESCRIPTION_KEYS[scopeItem]
        return {
            scope: scopeItem,
            description: key
                ? t(key)
                : t('oauth.scopes.describe.fallback', { scope: scopeItem }),
        }
    }))

    // 使用 useFetch 获取应用信息（仅在有 clientId 时）
    const { data: applicationData, pending: loading, error: fetchError } = await useFetch<{ success: boolean, data: ApplicationInfo }>(`/api/oauth/client/${clientId}`, {
        key: `oauth-client-${clientId}`,
        default: () => ({ success: false, data: null as any, message: '' }),
        server: true,
        lazy: false,
    })

    // 计算属性：应用信息
    const application = computed((): ApplicationInfo => {
        if (applicationData.value?.success && applicationData.value.data) {
            return applicationData.value.data
        }
        // 备用方案
        return {
            name: t('oauth.flow.fallbackApplicationName'),
            clientId: clientId as string,
            description: t('oauth.flow.fallbackApplicationDescription'),
        }
    })

    const applicationName = computed(() => application.value?.name || t('oauth.flow.unknownApplication'))

    // 封装导航函数
    const handleGoHome = () => {
        navigateTo('/profile')
    }

    // 处理错误和验证
    watch([() => clientId, fetchError], ([newClientId, newError]) => {
        if (!newClientId) {
            hasError.value = true
            toast.danger({ title: t('oauth.flow.errorTitle'), description: t('oauth.flow.missingClientId'), duration: 3000 })
            return
        }

        if (newError) {
            // 如果是 404 或 403 错误，显示特定错误信息
            if (newError.statusCode === 404) {
                hasError.value = true
                toast.danger({ title: t('oauth.flow.errorTitle'), description: t('oauth.flow.applicationNotFound'), duration: 3000 })
            } else if (newError.statusCode === 403) {
                hasError.value = true
                toast.danger({ title: t('oauth.flow.errorTitle'), description: t('oauth.flow.applicationDisabled'), duration: 3000 })
            } else {
                // 对于其他错误，记录警告但不阻止用户继续（使用备用应用信息）
                console.warn('Failed to load application details, falling back to defaults:', newError)
            }
        }
    }, { immediate: true })

    async function allowConsent() {
        if (submitting.value) {
            return
        }

        try {
            submitting.value = true

            const { error, data } = await authClient.$fetch<{ redirect: boolean, url: string }>('/oauth2/consent', {
                method: 'POST',
                body: {
                    accept: true,
                },
            })

            if (error) {
                throw new Error(error.message)
            }
            toast.success({ title: t('oauth.flow.allowSuccessTitle'), description: t('oauth.flow.allowSuccess'), duration: 3000 })
            // better-auth 1.7 起由服务端返回重定向地址（data.url）
            if (data?.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            toast.danger({ title: t('oauth.flow.errorTitle'), description: error.message || t('oauth.flow.allowFailed'), duration: 3000 })
        } finally {
            submitting.value = false
        }
    }

    async function denyConsent() {
        if (submitting.value) {
            return
        }

        try {
            submitting.value = true

            const { error, data } = await authClient.$fetch<{ redirect: boolean, url: string }>('/oauth2/consent', {
                method: 'POST',
                body: {
                    accept: false,
                },
            })

            if (error) {
                throw new Error(error.message)
            }

            // better-auth 1.7 起由服务端返回重定向地址（data.url）
            if (data?.url) {
                window.location.href = data.url
            } else {
                toast.info({ title: t('oauth.flow.deniedTitle'), description: t('oauth.flow.denied'), duration: 3000 })
                // 可以重定向到首页或其他页面
                setTimeout(() => {
                    navigateTo('/profile')
                }, 2000)
            }
        } catch (error: any) {
            toast.danger({ title: t('oauth.flow.errorTitle'), description: error.message || t('oauth.flow.denyFailed'), duration: 3000 })
        } finally {
            submitting.value = false
        }
    }

    return {
        loading,
        hasError,
        applicationName,
        application,
        isTrustedClient,
        parsedScopes,
        config,
        oauthParams,
        submitting,
        handleGoHome,
        allowConsent,
        denyConsent,
    }
}
