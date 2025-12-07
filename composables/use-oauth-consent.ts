import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

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
    const config = useRuntimeConfig()
    const route = useRoute()

    // 标准 OAuth2.0 和 OpenID Connect scopes 的描述映射
    const scopeDescriptions: Record<string, string> = {
        // OpenID Connect 核心 scopes
        openid: '获取您的基本身份信息',
        profile: '访问您的个人资料信息（姓名、头像等）',
        email: '访问您的电子邮件地址',
        address: '访问您的地址信息',
        phone: '访问您的手机号码',

        // 扩展 scopes
        offline_access: '离线访问权限（获取刷新令牌）',

        // 自定义 scopes
        read: '读取权限',
        write: '写入权限',
        admin: '管理权限',

        // 用户相关
        'user:read': '查看用户信息',
        'user:write': '修改用户信息',
        'user:email': '访问用户邮箱',
        'read:user': '读取用户基本信息（用户名、ID等）',
        'read:profile': '读取用户详细资料',
        'write:user': '修改用户信息',

        // 应用相关
        'app:read': '查看应用信息',
        'app:write': '修改应用信息',
    }

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

    const parsedScopes = computed(() => scopes.value.map((scopeItem) => ({
        scope: scopeItem,
        description: scopeDescriptions[scopeItem] || `访问 ${scopeItem} 权限`,
    })))

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
            name: '第三方应用',
            clientId: clientId as string,
            description: '正在请求访问您的账户权限',
        }
    })

    const applicationName = computed(() => application.value?.name || '未知应用')

    // 封装导航函数
    const handleGoHome = () => {
        navigateTo('/profile')
    }

    // 处理错误和验证
    watch([() => clientId, fetchError], ([newClientId, newError]) => {
        if (!newClientId) {
            hasError.value = true
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '缺少必需参数：client_id',
                life: 3000,
            })
            return
        }

        if (newError) {
            // 如果是 404 或 403 错误，显示特定错误信息
            if (newError.statusCode === 404) {
                hasError.value = true
                toast.add({
                    severity: 'error',
                    summary: '错误',
                    detail: '应用不存在，请检查授权链接是否正确',
                    life: 3000,
                })
            } else if (newError.statusCode === 403) {
                hasError.value = true
                toast.add({
                    severity: 'error',
                    summary: '错误',
                    detail: '该应用已被禁用，无法进行授权',
                    life: 3000,
                })
            } else {
                // 对于其他错误，记录警告但不阻止用户继续（使用备用应用信息）
                console.warn('获取应用详细信息失败，使用默认信息:', newError)
            }
        }
    }, { immediate: true })

    async function allowConsent() {
        if (submitting.value) {
            return
        }

        try {
            submitting.value = true

            const { error, data } = await authClient.oauth2.consent({
                accept: true,
            })

            if (error) {
                throw new Error(error.message)
            }
            toast.add({
                severity: 'success',
                summary: '授权成功',
                detail: '您已成功授权该应用访问您的账户',
                life: 3000,
            })
            // 根据 Better Auth 文档，成功后会自动重定向到 redirect_uri
            // 如果没有自动重定向，可以手动处理
            if (data?.redirectURI) {
                window.location.href = data.redirectURI
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: error.message || '授权失败',
                life: 3000,
            })
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

            const { error, data } = await authClient.oauth2.consent({
                accept: false,
            })

            if (error) {
                throw new Error(error.message)
            }

            // 根据 Better Auth 文档，拒绝后会自动重定向到 redirect_uri 并带有错误参数
            // 如果没有自动重定向，可以手动处理
            if (data?.redirectURI) {
                window.location.href = data.redirectURI
            } else {
                toast.add({
                    severity: 'info',
                    summary: '已拒绝授权',
                    detail: '您已拒绝该应用访问您的账户',
                    life: 3000,
                })
                // 可以重定向到首页或其他页面
                setTimeout(() => {
                    navigateTo('/profile')
                }, 2000)
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: error.message || '拒绝授权失败',
                life: 3000,
            })
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
