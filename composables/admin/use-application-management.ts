import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { debounce } from 'lodash-es'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'

export function useApplicationManagement() {
    const toast = useToast()
    const confirm = useConfirm()

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

    // Dialog states
    const showCreateDialog = ref(false)
    const showSecretDialog = ref(false)
    const showApiDocsDialog = ref(false)

    const editingApplication = ref<any>(null)
    const newApplication = ref<any>(null)

    // Actions
    const openCreateDialog = () => {
        editingApplication.value = null
        showCreateDialog.value = true
    }

    const editApplication = (app: any) => {
        editingApplication.value = app
        showCreateDialog.value = true
    }

    const confirmDelete = (app: any) => {
        confirm.require({
            message: `确定要删除应用 "${app.name}" 吗？此操作无法撤销。`,
            header: '确认删除',
            icon: 'mdi mdi-alert-circle',
            rejectLabel: '取消',
            acceptLabel: '删除',
            rejectClass: 'p-button-secondary p-button-text',
            acceptClass: 'p-button-danger',
            accept: () => {
                deleteApplication(app.id)
            },
        })
    }

    // Event handlers
    const onApplicationCreated = (app: any) => {
        newApplication.value = app
        showSecretDialog.value = true
        refreshApplications()
    }

    const onApplicationUpdated = () => {
        refreshApplications()
    }

    const onSearchInput = debounce((value: string | undefined) => {
        searchQuery.value = value || ''
        onSearch()
    }, 300)

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
        // Dialogs & Actions
        showCreateDialog,
        showSecretDialog,
        showApiDocsDialog,
        editingApplication,
        newApplication,
        openCreateDialog,
        editApplication,
        confirmDelete,
        onApplicationCreated,
        onApplicationUpdated,
        onSearchInput,
    }
}
