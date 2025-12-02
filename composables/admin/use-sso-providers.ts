import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'

export function useSsoProviders() {
    const toast = useToast()
    const searchQuery = ref('')
    const typeFilter = ref('')
    const statusFilter = ref('')

    // 使用 useFetch 进行 SSR 优化的数据获取
    const { data: providersResponse, pending: loading, refresh: refreshProviders, error: fetchError } = useFetch('/api/admin/sso/providers', {
        default: () => ({ success: false, data: [] }),
        server: true, // 确保在服务端执行
        key: 'sso-providers', // 缓存键
        transform: (response: any) => response,
        onResponseError({ response }) {
            console.error('[SSO Providers] Fetch error:', response.status, response.statusText)
        },
    })

    // 响应式的提供商列表
    const providers = computed(() => (providersResponse.value?.success ? providersResponse.value.data : []))

    // 监听获取错误
    watch(fetchError, (error) => {
        if (error) {
            console.error('[SSO Providers] Data fetch error:', error)
            toast.add({
                severity: 'error',
                summary: '数据加载失败',
                detail: '无法获取SSO提供商列表，请刷新页面重试',
                life: 5000,
            })
        }
    }, { immediate: true })

    // 计算属性：过滤后的提供商列表
    const filteredProviders = computed(() => {
        let result = [...providers.value]

        // 搜索过滤
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            result = result.filter((provider: any) => provider.name?.toLowerCase().includes(query)
                || provider.providerId?.toLowerCase().includes(query)
                || provider.domain?.toLowerCase().includes(query)
                || provider.issuer?.toLowerCase().includes(query),
            )
        }

        // 类型过滤
        if (typeFilter.value) {
            result = result.filter((provider: any) => provider.type === typeFilter.value)
        }

        // 状态过滤
        if (statusFilter.value !== '' && statusFilter.value !== null) {
            result = result.filter((provider: any) => provider.enabled === statusFilter.value)
        }

        return result
    })

    // 防抖搜索
    const debouncedSearch = debounce(() => {
        // 搜索逻辑已通过计算属性实现
    }, 300)

    // 刷新提供商列表的处理函数
    const handleRefreshProviders = async () => {
        try {
            searchQuery.value = ''
            typeFilter.value = ''
            statusFilter.value = ''
            await refreshProviders()

            toast.add({
                severity: 'success',
                summary: '刷新成功',
                detail: 'SSO提供商列表已刷新',
                life: 2000,
            })
        } catch (error: any) {
            console.error('刷新提供商列表失败:', error)
            toast.add({
                severity: 'error',
                summary: '刷新失败',
                detail: '无法刷新提供商列表，请检查网络连接',
                life: 3000,
            })
        }
    }

    const toggleProviderStatus = async (provider: any) => {
        if (!provider) {
            return
        }

        try {
            const response: any = await $fetch(`/api/admin/sso/providers/${provider.id}`, {
                method: 'PUT',
                body: { enabled: !provider.enabled },
            })

            if (!response.success) {
                throw new Error(response.message || '状态更新失败')
            }

            toast.add({
                severity: 'success',
                summary: '状态更新成功',
                detail: `SSO 提供商已${!provider.enabled ? '启用' : '禁用'}`,
                life: 3000,
            })

            await refreshProviders()
        } catch (error: any) {
            console.error('切换提供商状态失败:', error)
            toast.add({
                severity: 'error',
                summary: '状态更新失败',
                detail: error.message || '请检查网络连接或联系管理员',
                life: 3000,
            })
        }
    }

    const deleteProvider = async (providerId: string) => {
        try {
            const response: any = await $fetch(`/api/admin/sso/providers/${providerId}`, {
                method: 'DELETE',
            })

            if (!response.success) {
                throw new Error(response.message || '删除失败')
            }

            toast.add({
                severity: 'success',
                summary: '删除成功',
                detail: 'SSO 提供商已成功删除',
                life: 3000,
            })

            await refreshProviders()
            return true
        } catch (error: any) {
            console.error('删除提供商失败:', error)
            toast.add({
                severity: 'error',
                summary: '删除失败',
                detail: error.message || '请检查网络连接或联系管理员',
                life: 5000,
            })
            return false
        }
    }

    return {
        loading,
        providers,
        filteredProviders,
        searchQuery,
        typeFilter,
        statusFilter,
        refreshProviders,
        handleRefreshProviders,
        debouncedSearch,
        toggleProviderStatus,
        deleteProvider,
    }
}
