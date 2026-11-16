import { ref, watch, computed, onMounted } from 'vue'
import { useToast, type DatePickerRange } from 'caomei-ui'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import { authClient } from '@/lib/auth-client'
import type { AdminLogSession, AdminLogStats } from '@/types/admin'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { getApiErrorMessage } from '@/utils/shared/api-error'

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

export function useLogsManagement() {
    const t = useI18nText()
    const toast = useToast()
    const selectedStatus = ref<string | undefined>(undefined)
    /** 日期区间只在两端齐全时由 `CaomeiDatePicker` 抛值；`null` 表示未筛选 */
    const dateRange = ref<DatePickerRange | null>(null)
    /** 精确 IP 筛选（搜索框仍为模糊匹配） */
    const ipFilter = ref('')
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
            /* DatePicker 返回当日零点；结束日取当天 23:59:59，避免选中当天被排除 */
            const end = new Date(dateRange.value[1])
            end.setHours(23, 59, 59, 999)
            query.endDate = end.toISOString()
        }

        if (ipFilter.value.trim()) {
            query.ip = ipFilter.value.trim()
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

    /* 状态下拉 / 日期区间为离散操作，立即刷新；IP 输入由表格防抖后统一触发 onFilterChange */
    watch([selectedStatus, dateRange], () => {
        page.value = 0
        loadSessions()
        loadStats()
    })

    const onFilterChange = () => {
        onSearch()
        loadStats()
    }

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
                title: t('admin.logs.flow.revokeSuccessTitle'),
                description: t('admin.logs.flow.revokeSuccess'),
                duration: 3000,
            })

            await loadSessions()
        } catch (error: unknown) {
            toast.danger({
                title: t('admin.logs.flow.revokeFailed'),
                description: getApiErrorMessage(error, t('admin.logs.flow.revokeFailedDescription')),
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

    /* 统计请求带序号，避免前缀 IP 的慢响应覆盖精确 IP 的结果 */
    let statsRequestId = 0

    // 加载统计数据
    const loadStats = async () => {
        const requestId = ++statsRequestId
        try {
            statsLoading.value = true
            const query: Record<string, string> = {}
            if (selectedStatus.value && selectedStatus.value !== 'all') {
                query.status = selectedStatus.value
            }
            if (dateRange.value) {
                query.startDate = dateRange.value[0].toISOString()
                const end = new Date(dateRange.value[1])
                end.setHours(23, 59, 59, 999)
                query.endDate = end.toISOString()
            }
            if (ipFilter.value.trim()) {
                query.ip = ipFilter.value.trim()
            }
            if (searchQuery.value) {
                query.search = searchQuery.value
            }
            const { data } = await $fetch<LogStatsResponse>('/api/admin/logs/stats', { query })
            if (requestId !== statsRequestId) {
                return
            }
            statsData.value = data
        } catch (error: unknown) {
            toast.danger({
                title: t('admin.logs.flow.statsFailed'),
                description: getApiErrorMessage(error, t('admin.logs.flow.statsFailedDescription')),
                duration: 3000,
            })
        } finally {
            if (requestId === statsRequestId) {
                statsLoading.value = false
            }
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
        ipFilter,
        revokingSessionId,
        refreshSessions,
        revokeSession,
        onPage,
        onRowsChange,
        onSort,
        onSearch,
        onFilterChange,
        // Stats
        statsData,
        statsLoading,
        providerStatsData,
        trendData,
        loadStats,
        refreshData,
    }
}
