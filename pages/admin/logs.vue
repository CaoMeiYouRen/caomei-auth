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
import { authClient } from '@/lib/auth-client'

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

// 统计数据
const statsData = ref<any>(null)
const statsLoading = ref(false)

// 会话日志
const sessions = ref<any[]>([])
const sessionsLoading = ref(false)
const totalRecords = ref(0)
const currentPage = ref(1)
const revokingSession = ref('')

// 搜索和筛选
const searchQuery = ref('')
const selectedStatus = ref<string>()
const dateRange = ref<Date[]>()

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

// 加载会话日志
const loadSessions = async (page = 1) => {
    try {
        sessionsLoading.value = true

        const params: any = {
            page,
            limit: 20,
        }

        if (searchQuery.value) {
            params.search = searchQuery.value
        }

        if (selectedStatus.value && selectedStatus.value !== 'all') {
            params.status = selectedStatus.value
        }

        if (dateRange.value && dateRange.value.length === 2) {
            params.startDate = dateRange.value[0]?.toISOString()
            params.endDate = dateRange.value[1]?.toISOString()
        }

        const { data } = await $fetch('/api/admin/logs/sessions', { params })
        sessions.value = data.sessions
        totalRecords.value = data.pagination.total
        currentPage.value = page
    } catch (error: any) {
        console.error('加载会话日志失败:', error)
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message || '加载会话日志失败',
            life: 3000,
        })
    } finally {
        sessionsLoading.value = false
    }
}

// 撤销会话
const revokeSession = async (session: any) => {
    confirm.require({
        message: `确定要撤销 ${session.user.name} 的会话吗？`,
        header: '确认撤销',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                revokingSession.value = session.sessionToken

                await authClient.admin.revokeUserSession({
                    sessionToken: session.sessionToken,
                })

                toast.add({
                    severity: 'success',
                    summary: '撤销成功',
                    detail: '会话已撤销',
                    life: 3000,
                })

                loadSessions(currentPage.value)
            } catch (error: any) {
                console.error('撤销会话失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '撤销失败',
                    detail: error.message || '撤销会话失败',
                    life: 3000,
                })
            } finally {
                revokingSession.value = ''
            }
        },
    })
}

// 分页处理
const onPageChange = (event: any) => {
    loadSessions(event.page + 1)
}

const onFilterChange = () => {
    loadSessions(1)
}

// 刷新数据
const refreshData = async () => {
    await loadStats()
}

// 刷新会话
const refreshSessions = async () => {
    await loadSessions(1)
}

// 初始化
onMounted(() => {
    // 加载数据
    loadStats()
    loadSessions()
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
