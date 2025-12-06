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
                @refresh="refreshSessions"
                @revoke="revokeSession"
                @page-change="onPageChange"
                @filter-change="onFilterChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
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

const toast = useToast()
const confirm = useConfirm()

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
} = useLogsManagement()

// 统计数据
const statsData = ref<any>(null)
const statsLoading = ref(false)

// 计算属性
const providerStatsData = computed(() => (statsData.value?.providers || []).sort((a: any, b: any) => b.count - a.count))
const trendData = computed(() => statsData.value?.trend || [])

// 加载统计数据
const loadStats = async () => {
    try {
        statsLoading.value = true
        const { data } = await $fetch('/api/admin/logs/stats')
        statsData.value = data
    } catch (error: any) {
        console.error('加载统计数据失败:', error)
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message || '加载统计数据失败',
            life: 3000,
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
