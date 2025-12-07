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
                @sort="onSort"
                @filter-change="onSearch"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLogsManagement } from '@/composables/admin/use-logs-management'

// Components
import LogsHeader from '@/components/admin/logs/logs-header.vue'
import StatsOverview from '@/components/admin/logs/stats-overview.vue'
import PeriodStats from '@/components/admin/logs/period-stats.vue'
import ProviderStats from '@/components/admin/logs/provider-stats.vue'
import TrendChart from '@/components/admin/logs/trend-chart.vue'
import LogsTable from '@/components/admin/logs/logs-table.vue'

// 页面元数据
definePageMeta({
    title: '登录统计 - 草梅 Auth',
    layout: 'admin',
})

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
    revokingSessionId: revokingSession,
    refreshSessions,
    revokeSession,
    onPage,
    onSort,
    onSearch,
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
    background: linear-gradient(135deg, $background 0%, $secondary-bg 100%);
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

// 应用后台页面暗色模式支持
@include admin-page-dark-theme;
</style>
