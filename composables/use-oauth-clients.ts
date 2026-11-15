import { ref, computed, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { formatDateTime } from '@/utils/shared/date'
import { useI18nText } from '@/composables/utils/use-i18n-text'

/** scope → 简要文案键（字面量集中，便于 i18n 审计扫到完整键名）。 */
const SCOPE_LABEL_KEYS: Record<string, string> = {
    openid: 'oauth.scopes.label.openid',
    profile: 'oauth.scopes.label.profile',
    email: 'oauth.scopes.label.email',
    address: 'oauth.scopes.label.address',
    phone: 'oauth.scopes.label.phone',
    offline_access: 'oauth.scopes.label.offlineAccess',
    read: 'oauth.scopes.label.read',
    write: 'oauth.scopes.label.write',
    admin: 'oauth.scopes.label.admin',
    'user:read': 'oauth.scopes.label.userRead',
    'user:write': 'oauth.scopes.label.userWrite',
    'user:email': 'oauth.scopes.label.userEmail',
    'read:user': 'oauth.scopes.label.readUser',
    'read:profile': 'oauth.scopes.label.readProfile',
    'write:user': 'oauth.scopes.label.writeUser',
    'app:read': 'oauth.scopes.label.appRead',
    'app:write': 'oauth.scopes.label.appWrite',
}

interface AuthorizedApp {
    id: string
    clientId: string
    consentedAt: string
    scopes: string[]
    application: {
        name: string
        description?: string
        logoUri?: string
        clientUri?: string
        tosUri?: string
        policyUri?: string
    }
}

export async function useOAuthClients() {
    const toast = useToast()
    const t = useI18nText()

    const showRevokeDialog = ref(false)
    const selectedApp = ref<AuthorizedApp>()
    const revoking = ref(false)
    const revokingApps = ref(new Set<string>())

    // 使用 useFetch 进行 SSR 优化的数据获取
    const { data: authorizedAppsData, pending: loading, error, refresh: refreshApps } = await useFetch<{
        success: boolean
        data: AuthorizedApp[]
        message?: string
    }>('/api/oauth/consents', {
        default: () => ({ success: false, data: [], message: '' }),
        server: true,
        lazy: false,
    })

    // 计算属性，从 useFetch 结果中提取数据
    const authorizedApps = computed(() => {
        if (authorizedAppsData.value?.success) {
            return authorizedAppsData.value.data
        }
        return []
    })

    // 处理错误
    watch(error, (newError) => {
        if (newError) {
            toast.danger({
                title: t('oauth.flow.errorTitle'),
                description: newError.message || t('oauth.flow.listFailed'),
                duration: 3000,
            })
        }
    })

    // 重新加载授权应用列表
    async function loadAuthorizedApps() {
        await refreshApps()
    }

    // 获取权限描述
    function getScopeDescription(scope: string) {
        const key = SCOPE_LABEL_KEYS[scope]
        return key ? t(key) : scope
    }

    // 确认撤销授权
    function confirmRevokeAuthorization(app: AuthorizedApp) {
        selectedApp.value = app
        showRevokeDialog.value = true
    }

    // 撤销授权
    async function revokeAuthorization() {
        if (!selectedApp.value) {
            return
        }

        try {
            revoking.value = true
            revokingApps.value.add(selectedApp.value.clientId)

            const response = await $fetch<any>('/api/oauth/revoke-consent', {
                method: 'POST',
                body: {
                    clientId: selectedApp.value.clientId,
                },
            })

            if (response.success) {
                toast.success({
                    title: t('oauth.flow.revokeSuccessTitle'),
                    description: t('oauth.flow.revokeSuccess', { name: selectedApp.value.application.name }),
                    duration: 3000,
                })

                await loadAuthorizedApps()
            } else {
                throw new Error(response.message || t('oauth.flow.revokeFailed'))
            }
        } catch (revokeError: unknown) {
            toast.danger({
                title: t('oauth.flow.revokeFailedTitle'),
                description: revokeError instanceof Error && revokeError.message ? revokeError.message : t('oauth.flow.revokeFailed'),
                duration: 3000,
            })
        } finally {
            revoking.value = false
            revokingApps.value.delete(selectedApp.value.clientId)
            showRevokeDialog.value = false
            selectedApp.value = {} as any
        }
    }

    // 打开链接
    function openLink(url: string) {
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    function goProfile() {
        navigateTo('/profile')
    }

    function goDocs() {
        openLink('https://auth-docs.cmyr.dev/docs/usage/user-management')
    }

    return {
        loading,
        authorizedApps,
        showRevokeDialog,
        selectedApp,
        revoking,
        revokingApps,
        getScopeDescription,
        confirmRevokeAuthorization,
        revokeAuthorization,
        openLink,
        goProfile,
        goDocs,
        formatDateTime,
    }
}
