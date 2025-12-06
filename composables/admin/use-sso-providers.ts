import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'

export function useSsoProviders() {
    const toast = useToast()
    const typeFilter = ref('')
    const statusFilter = ref<boolean | ''>('')

    const fetcher = async (params: DataTableFetchParams) => {
        const query: any = {
            page: params.page,
            limit: params.limit,
            sortField: params.sortField,
            sortOrder: params.sortOrder,
            type: typeFilter.value,
            enabled: statusFilter.value === '' ? '' : String(statusFilter.value),
        }

        if (params.searchQuery) {
            query.search = params.searchQuery
        }

        const response = await $fetch<any>('/api/admin/sso/providers', {
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
    } = useDataTable({
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
