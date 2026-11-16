<template>
    <div class="admin-logs">
        <div class="logs-container">
            <!-- 页面头部 -->
            <LogsHeader
                :loading="statsLoading"
                @refresh="refreshData"
            />

            <!-- 统计概览 -->
            <StatsOverview :stats="statsData" />

            <!-- 时间段统计 -->
            <PeriodStats :stats="statsData" />

            <!-- 登录方式统计 -->
            <ProviderStats :provider-stats="providerStatsData" />

            <!-- 登录趋势图 -->
            <TrendChart :trend-data="trendData" />

            <!-- 登录日志详情 -->
            <LogsTable
                v-model:search-query="searchQuery"
                v-model:selected-status="selectedStatus"
                v-model:date-range="dateRange"
                v-model:ip-filter="ipFilter"
                :sessions="sessions"
                :loading="sessionsLoading"
                :total-records="totalRecords"
                :revoking-session="revokingSession"
                :page="page"
                :page-size="pageSize"
                :sort-field="sortField"
                :sort-order="sortOrder"
                @refresh="refreshSessions"
                @revoke="revokeSession"
                @page="onPage"
                @rows-change="onRowsChange"
                @sort="onSort"
                @filter-change="onFilterChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLogsManagement } from '@/composables/admin/use-logs-management'
import { usePageMeta } from '@/composables/utils/use-page-meta'

// Components
import LogsHeader from '@/components/admin/logs/logs-header.vue'
import StatsOverview from '@/components/admin/logs/stats-overview.vue'
import PeriodStats from '@/components/admin/logs/period-stats.vue'
import ProviderStats from '@/components/admin/logs/provider-stats.vue'
import TrendChart from '@/components/admin/logs/trend-chart.vue'
import LogsTable from '@/components/admin/logs/logs-table.vue'

definePageMeta({
    layout: 'admin',
})

usePageMeta('admin.logs.page.title', 'admin.logs.page.subtitle')

const {
    loading: sessionsLoading,
    sessions,
    total: totalRecords,
    page,
    pageSize,
    sortField,
    sortOrder,
    searchQuery,
    selectedStatus,
    dateRange,
    ipFilter,
    revokingSessionId: revokingSession,
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
    refreshData,
} = useLogsManagement()
</script>

<style lang="scss" scoped>
.admin-logs {
    min-height: 100vh;
    background: var(--admin-bg);
    padding: 2rem;
}

.logs-container {
    max-width: 1400px;
    margin: 0 auto;
}

// 响应式设计
@media (width <= 768px) {
    .admin-logs {
        padding: 1rem;
    }
}
</style>
