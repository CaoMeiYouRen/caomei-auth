import { ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import type { AdminSsoProviderRow } from '@/types/admin'

interface SsoProviderListResponse {
    success: boolean
    total?: number
    data: AdminSsoProviderRow[]
}

export function useSsoProviders() {
    const toast = useToast()
    /** `CaomeiSelect` 的选项值只接受字符串 / 数字，筛选值用 `'true'` / `'false'`，服务端按同名 query 解析 */
    const typeFilter = ref<string | null>('')
    const statusFilter = ref<'true' | 'false' | null | ''>('')

    const fetcher = async (params: DataTableFetchParams) => {
        const query: Record<string, string | number> = {
            page: params.page,
            limit: params.limit,
        }

        /* 空筛选不发送，交由服务端按「未筛选」处理，避免 `type=&enabled=` 这种空参数 */
        if (typeFilter.value) {
            query.type = typeFilter.value
        }
        if (statusFilter.value) {
            query.enabled = statusFilter.value
        }

        if (params.sortField) {
            query.sortField = params.sortField
        }
        if (params.sortOrder) {
            query.sortOrder = params.sortOrder
        }
        if (params.searchQuery) {
            query.search = params.searchQuery
        }

        const response = await $fetch<SsoProviderListResponse>('/api/admin/sso/providers', {
            query,
        })

        if (response.success) {
            return {
                data: response.data,
                total: response.total || response.data.length,
            }
        }

        return { data: [], total: 0 }
    }

    const {
        loading,
        data: providers,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        load: loadProviders,
        onPage,
        onSort,
        onSearch,
    } = useDataTable<AdminSsoProviderRow>({
        fetcher,
        defaultSortField: 'createdAt',
        defaultSortOrder: 'desc',
    })

    // Watch filters to reload
    watch([typeFilter, statusFilter], () => {
        page.value = 0
        loadProviders()
    })

    const refreshProviders = async () => {
        await loadProviders()
    }

    const handleRefreshProviders = async () => {
        /* 清空筛选由 watch 触发重载；筛选本来就为空时 watch 不触发，这里补一次请求，避免重复发两次 */
        const hadFilters = Boolean(searchQuery.value) || Boolean(typeFilter.value) || Boolean(statusFilter.value)
        searchQuery.value = ''
        typeFilter.value = ''
        statusFilter.value = ''
        if (!hadFilters) {
            await refreshProviders()
        }
        toast.success({
            title: '刷新成功',
            description: 'SSO提供商列表已刷新',
            duration: 2000,
        })
    }

    const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

    const toggleProviderStatus = async (provider: AdminSsoProviderRow) => {
        if (!provider) {
            return
        }

        try {
            const response = await $fetch<{ success: boolean, message?: string }>(`/api/admin/sso/providers/${provider.id}`, {
                method: 'PUT',
                body: { enabled: !provider.enabled },
            })

            if (!response.success) {
                throw new Error(response.message || '状态更新失败')
            }

            toast.success({
                title: '状态更新成功',
                description: `SSO 提供商已${!provider.enabled ? '启用' : '禁用'}`,
                duration: 3000,
            })

            await refreshProviders()
        } catch (error: unknown) {
            toast.danger({
                title: '状态更新失败',
                description: errorMessage(error, '请检查网络连接或联系管理员'),
                duration: 3000,
            })
        }
    }

    const deleteProvider = async (providerId: string) => {
        try {
            const response = await $fetch<{ success: boolean, message?: string }>(`/api/admin/sso/providers/${providerId}`, {
                method: 'DELETE',
            })

            if (!response.success) {
                throw new Error(response.message || '删除失败')
            }

            toast.success({
                title: '删除成功',
                description: 'SSO 提供商已成功删除',
                duration: 3000,
            })

            await refreshProviders()
            return true
        } catch (error: unknown) {
            toast.danger({
                title: '删除失败',
                description: errorMessage(error, '请检查网络连接或联系管理员'),
                duration: 5000,
            })
            return false
        }
    }

    return {
        loading,
        providers,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        typeFilter,
        statusFilter,
        refreshProviders,
        handleRefreshProviders,
        toggleProviderStatus,
        deleteProvider,
        onPage,
        onSort,
        onSearch,
    }
}
