import { ref } from 'vue'
import { useToast, useConfirm } from 'caomei-ui'
import { debounce } from 'lodash-es'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import type { AdminOAuthApplicationRow, AdminOAuthClientCredentials } from '@/types/admin'

interface ApplicationListResponse {
    success: boolean
    total?: number
    data: AdminOAuthApplicationRow[]
}

export function useApplicationManagement() {
    const toast = useToast()
    const confirm = useConfirm()

    const fetcher = async (params: DataTableFetchParams) => {
        const query: Record<string, string | number> = {
            page: params.page,
            limit: params.limit,
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

        const response = await $fetch<ApplicationListResponse>('/api/admin/oauth/applications', {
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
    } = useDataTable<AdminOAuthApplicationRow>({
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

    const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

    const toggleApplicationStatus = async (app: AdminOAuthApplicationRow) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${app.id}`, {
                method: 'PUT',
                body: {
                    disabled: !app.disabled,
                },
            })

            toast.success({
                title: '成功',
                description: `应用已${app.disabled ? '启用' : '禁用'}`,
                duration: 3000,
            })

            await refreshApplications()
        } catch (error: unknown) {
            toast.danger({
                title: '错误',
                description: errorMessage(error, '操作失败'),
                duration: 3000,
            })
        }
    }

    const deleteApplication = async (id: string) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${id}`, {
                method: 'DELETE',
            })

            toast.success({
                title: '删除成功',
                description: '应用已删除',
                duration: 3000,
            })

            await refreshApplications()
            return true
        } catch (error: unknown) {
            toast.danger({
                title: '删除失败',
                description: errorMessage(error, '删除失败'),
                duration: 3000,
            })
            return false
        }
    }

    // Dialog states
    const showCreateDialog = ref(false)
    const showSecretDialog = ref(false)
    const showApiDocsDialog = ref(false)

    const editingApplication = ref<AdminOAuthApplicationRow | null>(null)
    const newApplication = ref<AdminOAuthClientCredentials | null>(null)

    // Actions
    const openCreateDialog = () => {
        editingApplication.value = null
        showCreateDialog.value = true
    }

    const editApplication = (app: AdminOAuthApplicationRow) => {
        editingApplication.value = app
        showCreateDialog.value = true
    }

    const confirmDelete = async (app: AdminOAuthApplicationRow) => {
        const confirmed = await confirm.open({
            title: '确认删除',
            description: `确定要删除应用 "${app.name}" 吗？此操作无法撤销。`,
            confirmLabel: '删除',
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }
        await deleteApplication(app.id)
    }

    // Event handlers
    const onApplicationCreated = (app: AdminOAuthClientCredentials) => {
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
