import { ref, watch, computed, onMounted } from 'vue'
import { useToast, type DatePickerRange } from 'caomei-ui'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import { authClient } from '@/lib/auth-client'
import type { AdminLogSession, AdminLogStats } from '@/types/admin'

interface LogSessionsResponse {
    success: boolean
    data: {
        sessions: AdminLogSession[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

interface LogStatsResponse {
    success: boolean
    data: AdminLogStats
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

export function useLogsManagement() {
    const toast = useToast()
    const selectedStatus = ref<string | undefined>(undefined)
    /** 日期区间只在两端齐全时由 `CaomeiDatePicker` 抛值；`null` 表示未筛选 */
    const dateRange = ref<DatePickerRange | null>(null)
    const revokingSessionId = ref<string>('')

    const fetcher = async (params: DataTableFetchParams) => {
        const query: Record<string, string | number> = {
            page: params.page + 1,
            limit: params.limit,
        }

        if (params.searchQuery) {
            query.search = params.searchQuery
        }

        if (selectedStatus.value && selectedStatus.value !== 'all') {
            query.status = selectedStatus.value
        }

        if (dateRange.value) {
            query.startDate = dateRange.value[0].toISOString()
            query.endDate = dateRange.value[1].toISOString()
        }

        const response = await $fetch<LogSessionsResponse>('/api/admin/logs/sessions', {
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
        sortField,
        sortOrder,
        searchQuery,
        load: loadSessions,
        onPage,
        onRowsChange,
        onSort,
        onSearch,
    } = useDataTable<AdminLogSession>({
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

    const revokeSession = async (session: AdminLogSession) => {
        try {
            revokingSessionId.value = session.sessionToken

            await authClient.admin.revokeUserSession({
                sessionToken: session.sessionToken,
            })

            toast.success({
                title: '撤销成功',
                description: '会话已撤销',
                duration: 3000,
            })

            await loadSessions()
        } catch (error: unknown) {
            toast.danger({
                title: '撤销失败',
                description: errorMessage(error, '撤销会话失败'),
                duration: 3000,
            })
        } finally {
            revokingSessionId.value = ''
        }
    }

    // 统计数据
    const statsData = ref<AdminLogStats | null>(null)
    const statsLoading = ref(false)

    // 计算属性
    const providerStatsData = computed(() => [...(statsData.value?.providers || [])].sort((a, b) => b.count - a.count))
    const trendData = computed(() => statsData.value?.trend || [])

    // 加载统计数据
    const loadStats = async () => {
        try {
            statsLoading.value = true
            const { data } = await $fetch<LogStatsResponse>('/api/admin/logs/stats')
            statsData.value = data
        } catch (error: unknown) {
            toast.danger({
                title: '加载失败',
                description: errorMessage(error, '加载统计数据失败'),
                duration: 3000,
            })
        } finally {
            statsLoading.value = false
        }
    }

    // 刷新数据
    const refreshData = async () => {
        await loadStats()
    }

    // 初始化
    onMounted(() => {
        // 加载数据
        loadStats()
    })

    return {
        loading,
        sessions,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        selectedStatus,
        dateRange,
        revokingSessionId,
        refreshSessions,
        revokeSession,
        onPage,
        onRowsChange,
        onSort,
        onSearch,
        // Stats
        statsData,
        statsLoading,
        providerStatsData,
        trendData,
        loadStats,
        refreshData,
    }
}
