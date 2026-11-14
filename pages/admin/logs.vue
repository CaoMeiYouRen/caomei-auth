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
                @rows-change="onRowsChange"
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
    onRowsChange,
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

/* 统计组件（stats-overview / period-stats / provider-stats / trend-chart）在统计组件批次
 * （`docs/design/governance/2026-11-10-phase4-registration.md` M10）迁移前仍是浅色外观，
 * 且 provider-stats 内部还有 PrimeVue 表格。保留该 mixin 维持暗色可读性，M10 完成统计组件
 * token 化后随整页一并删除。 */
@include admin-page-dark-theme;

/* 同上：`admin-page-dark-theme` 的 class 分支在 Vue scoped 下无法命中子组件，
 * class-only 暗色（手动切换、系统浅色）时 provider-stats 的 PrimeVue 表头仍是浅色。
 * 迁移前的 P4-0 立即修块在这里兜底，统计组件批次迁移后与上一条一起删除。 */
@include dark-mode {
    .admin-logs {
        :deep(.p-datatable-thead > tr > th) {
            background: var(--admin-surface-muted) !important;
            color: var(--admin-text) !important;
            border-color: var(--admin-border) !important;
        }

        :deep(.p-datatable-tbody > tr > td) {
            color: var(--admin-text) !important;
            border-color: var(--admin-border) !important;
        }

        :deep(.p-paginator) {
            background: var(--admin-surface) !important;
            color: var(--admin-text) !important;
            border-color: var(--admin-border) !important;
        }
    }
}
</style>
