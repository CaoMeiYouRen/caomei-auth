import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { formatDateTime } from '@/utils/date'

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

    // 标准 OAuth2.0 和 OpenID Connect scopes 的描述映射
    const scopeDescriptions: Record<string, string> = {
        // OpenID Connect 核心 scopes
        openid: '基本身份信息',
        profile: '个人资料信息',
        email: '电子邮件地址',
        address: '地址信息',
        phone: '手机号码',

        // 扩展 scopes
        offline_access: '离线访问权限',

        // 自定义 scopes
        read: '读取权限',
        write: '写入权限',
        admin: '管理权限',

        // 用户相关
        'user:read': '查看用户信息',
        'user:write': '修改用户信息',
        'user:email': '访问用户邮箱',

        // 应用相关
        'app:read': '查看应用信息',
        'app:write': '修改应用信息',
    }

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
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: newError.message || '获取授权应用列表失败',
                life: 3000,
            })
        }
    })

    // 重新加载授权应用列表
    async function loadAuthorizedApps() {
        await refreshApps()
    }

    // 获取权限描述
    function getScopeDescription(scope: string) {
        return scopeDescriptions[scope] || scope
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
                toast.add({
                    severity: 'success',
                    summary: '撤销成功',
                    detail: `已成功撤销对 ${selectedApp.value.application.name} 的授权`,
                    life: 3000,
                })

                await loadAuthorizedApps()
            } else {
                throw new Error(response.message || '撤销授权失败')
            }
        } catch (revokeError: any) {
            toast.add({
                severity: 'error',
                summary: '撤销失败',
                detail: revokeError.message || '撤销授权失败',
                life: 3000,
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
