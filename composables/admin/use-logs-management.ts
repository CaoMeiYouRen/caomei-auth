import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import { authClient } from '@/lib/auth-client'

export function useLogsManagement() {
    const toast = useToast()
    const selectedStatus = ref<string>()
    const dateRange = ref<Date[]>()
    const revokingSessionId = ref<string>('')

    const fetcher = async (params: DataTableFetchParams) => {
        const query: any = {
            page: params.page + 1,
            limit: params.limit,
        }

        if (params.searchQuery) {
            query.search = params.searchQuery
        }

        if (selectedStatus.value && selectedStatus.value !== 'all') {
            query.status = selectedStatus.value
        }

        if (dateRange.value && dateRange.value.length === 2) {
            query.startDate = dateRange.value[0]?.toISOString()
            query.endDate = dateRange.value[1]?.toISOString()
        }

        const response = await $fetch<any>('/api/admin/logs/sessions', {
            query,
        })

        return {
            data: response.data.sessions,
            total: response.data.pagination.total,
        }
    }

    const {
        loading,
        data: sessions,
        total,
        page,
        pageSize,
        searchQuery,
        load: loadSessions,
        onPage,
        onSearch,
    } = useDataTable({
        fetcher,
        defaultPageSize: 20,
    })

    watch([selectedStatus, dateRange], () => {
        page.value = 0
        loadSessions()
    })

    const refreshSessions = async () => {
        await loadSessions()
    }

    const revokeSession = async (session: any) => {
        try {
            revokingSessionId.value = session.sessionToken

            await authClient.admin.revokeUserSession({
                sessionToken: session.sessionToken,
            })

            toast.add({
                severity: 'success',
                summary: '撤销成功',
                detail: '会话已撤销',
                life: 3000,
            })

            await loadSessions()
        } catch (error: any) {
            console.error('撤销会话失败:', error)
            toast.add({
                severity: 'error',
                summary: '撤销失败',
                detail: error.message || '撤销会话失败',
                life: 3000,
            })
        } finally {
            revokingSessionId.value = ''
        }
    }

    return {
        loading,
        sessions,
        total,
        page,
        pageSize,
        searchQuery,
        selectedStatus,
        dateRange,
        revokingSessionId,
        refreshSessions,
        revokeSession,
        onPage,
        onSearch,
    }
}
