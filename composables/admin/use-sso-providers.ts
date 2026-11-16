import { ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import type { AdminSsoProviderRow } from '@/types/admin'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { getApiErrorMessage } from '@/utils/shared/api-error'

interface SsoProviderListResponse {
    success: boolean
    total?: number
    data: AdminSsoProviderRow[]
}

export function useSsoProviders() {
    const t = useI18nText()
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
        onRowsChange,
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
            title: t('admin.sso.flow.refreshSuccessTitle'),
            description: t('admin.sso.flow.refreshSuccess'),
            duration: 2000,
        })
    }

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
                throw new Error(response.message || t('admin.sso.flow.statusFailed'))
            }

            toast.success({
                title: t('admin.sso.flow.statusSuccessTitle'),
                description: provider.enabled ? t('admin.sso.flow.disabledMessage') : t('admin.sso.flow.enabledMessage'),
                duration: 3000,
            })

            await refreshProviders()
        } catch (error: unknown) {
            toast.danger({
                title: t('admin.sso.flow.statusFailed'),
                description: getApiErrorMessage(error, t('admin.sso.flow.networkFailed')),
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
                throw new Error(response.message || t('admin.sso.flow.deleteFailed'))
            }

            toast.success({
                title: t('admin.sso.flow.deleteSuccessTitle'),
                description: t('admin.sso.flow.deleteSuccess'),
                duration: 3000,
            })

            await refreshProviders()
            return true
        } catch (error: unknown) {
            toast.danger({
                title: t('admin.sso.flow.deleteFailed'),
                description: getApiErrorMessage(error, t('admin.sso.flow.networkFailed')),
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
        onRowsChange,
        onSort,
        onSearch,
    }
}
