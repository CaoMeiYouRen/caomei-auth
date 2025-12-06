import { useToast } from 'primevue/usetoast'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'

export function useApplicationManagement() {
    const toast = useToast()

    const fetcher = async (params: DataTableFetchParams) => {
        const query: any = {
            page: params.page,
            limit: params.limit,
            sortField: params.sortField,
            sortOrder: params.sortOrder,
        }

        if (params.searchQuery) {
            query.search = params.searchQuery
        }

        const response = await $fetch<any>('/api/admin/oauth/applications', {
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
        data: applications,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        load: loadApplications,
        onPage,
        onSort,
        onSearch,
    } = useDataTable({
        fetcher,
        defaultSortField: 'createdAt',
        defaultSortOrder: 'desc',
    })

    const refreshApplications = async () => {
        await loadApplications()
    }

    const handleRefreshApplications = () => {
        searchQuery.value = ''
        refreshApplications()
    }

    const toggleApplicationStatus = async (app: any) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${app.id}`, {
                method: 'PUT',
                body: {
                    disabled: !app.disabled,
                },
            })

            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `应用已${app.disabled ? '启用' : '禁用'}`,
                life: 3000,
            })

            await refreshApplications()
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: error.message || '操作失败',
                life: 3000,
            })
        }
    }

    const deleteApplication = async (id: string) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${id}`, {
                method: 'DELETE',
            })

            toast.add({
                severity: 'success',
                summary: '删除成功',
                detail: '应用已删除',
                life: 3000,
            })

            await refreshApplications()
            return true
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '删除失败',
                detail: error.message || '删除失败',
                life: 3000,
            })
            return false
        }
    }

    return {
        loading,
        applications,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        refreshApplications,
        handleRefreshApplications,
        toggleApplicationStatus,
        deleteApplication,
        onPage,
        onSort,
        onSearch,
    }
}
