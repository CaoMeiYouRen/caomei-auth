<template>
    <div class="admin-logs">
        <div class="logs-container">
            <!-- 页面头部 -->
            <div class="logs-header">
                <div class="header-content">
                    <h1 class="logs-title">
                        登录统计
                    </h1>
                    <p class="logs-subtitle">
                        查看登录日志、活跃用户、异常登录等统计报表
                    </p>
                </div>
                <div class="header-actions">
                    <Button
                        icon="mdi mdi-refresh"
                        label="刷新数据"
                        severity="secondary"
                        outlined
                        :loading="statsLoading"
                        @click="refreshData"
                    />
                </div>
            </div>

            <!-- 统计概览 -->
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="mdi mdi-account-group" />
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">
                            {{ statsData?.overview?.totalUsers || 0 }}
                        </div>
                        <div class="stat-label">
                            总用户数
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="mdi mdi-login" />
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">
                            {{ statsData?.overview?.totalSessions || 0 }}
                        </div>
                        <div class="stat-label">
                            总登录次数
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="mdi mdi-account-check" />
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">
                            {{ statsData?.overview?.activeSessions || 0 }}
                        </div>
                        <div class="stat-label">
                            活跃会话
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="mdi mdi-account-heart" />
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">
                            {{ statsData?.overview?.activeUsers || 0 }}
                        </div>
                        <div class="stat-label">
                            活跃用户（7天）
                        </div>
                    </div>
                </div>
            </div>

            <!-- 时间段统计 -->
            <div class="period-stats">
                <div class="section-header">
                    <h2 class="section-title">
                        时间段统计
                    </h2>
                </div>
                <div class="period-cards">
                    <div class="period-card">
                        <div class="period-label">
                            今日登录
                        </div>
                        <div class="period-value">
                            {{ statsData?.periods?.today || 0 }}
                        </div>
                    </div>
                    <div class="period-card">
                        <div class="period-label">
                            昨日登录
                        </div>
                        <div class="period-value">
                            {{ statsData?.periods?.yesterday || 0 }}
                        </div>
                    </div>
                    <div class="period-card">
                        <div class="period-label">
                            本周登录
                        </div>
                        <div class="period-value">
                            {{ statsData?.periods?.week || 0 }}
                        </div>
                    </div>
                    <div class="period-card">
                        <div class="period-label">
                            本月登录
                        </div>
                        <div class="period-value">
                            {{ statsData?.periods?.month || 0 }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 登录方式统计 -->
            <div class="provider-stats">
                <div class="section-header">
                    <h2 class="section-title">
                        登录方式统计
                    </h2>
                </div>
                <div class="provider-chart">
                    <DataTable
                        :value="providerStatsData"
                        :rows="10"
                        striped-rows
                        responsive-layout="scroll"
                    >
                        <Column field="provider" header="登录方式">
                            <template #body="{data}">
                                <div class="provider-cell">
                                    <i
                                        :class="getProviderIcon(data.provider)"
                                        :style="{color: getProviderColor(data.provider)}"
                                    />
                                    <span>{{ getProviderName(data.provider) }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="count" header="登录次数">
                            <template #body="{data}">
                                <div class="count-cell">
                                    <span class="count-value">{{ data.count }}</span>
                                    <div class="count-bar">
                                        <div
                                            class="count-progress"
                                            :style="{width: `${(data.count / maxProviderCount) * 100}%`}"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column field="percentage" header="占比">
                            <template #body="{data}">
                                {{ ((data.count / totalProviderCount) * 100).toFixed(1) }}%
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- 登录趋势图 -->
            <div class="trend-chart">
                <div class="section-header">
                    <h2 class="section-title">
                        登录趋势（最近30天）
                    </h2>
                </div>
                <div class="chart-container">
                    <!-- 这里可以集成 Chart.js 或其他图表库 -->
                    <div class="chart-placeholder">
                        <p>登录趋势图（可集成 Chart.js）</p>
                        <div class="trend-data">
                            <div
                                v-for="item in trendData"
                                :key="item.date"
                                class="trend-item"
                            >
                                <span class="trend-date">{{ formatDate(item.date) }}</span>
                                <span class="trend-count">{{ item.count }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 登录日志详情 -->
            <div class="logs-detail">
                <div class="detail-header">
                    <div class="header-content">
                        <h2 class="section-title">
                            登录日志
                        </h2>
                    </div>
                    <div class="detail-filters">
                        <div class="filter-row">
                            <div class="search-wrapper">
                                <IconField icon-position="left">
                                    <InputIcon class="mdi mdi-magnify" />
                                    <InputText
                                        v-model="searchQuery"
                                        placeholder="搜索用户或IP地址"
                                        @input="debouncedSearch"
                                    />
                                </IconField>
                            </div>
                            <div class="filter-controls">
                                <Select
                                    v-model="selectedStatus"
                                    :options="statusOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="会话状态"
                                    show-clear
                                    @change="() => loadSessions(1)"
                                />
                                <Calendar
                                    v-model="dateRange"
                                    selection-mode="range"
                                    :manual-input="false"
                                    placeholder="选择日期范围"
                                    show-clear
                                    @date-select="() => loadSessions(1)"
                                />
                                <Button
                                    icon="mdi mdi-refresh"
                                    severity="secondary"
                                    outlined
                                    @click="refreshSessions"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sessions-list">
                    <DataTable
                        :value="sessions"
                        :loading="sessionsLoading"
                        :rows="20"
                        :total-records="totalRecords"
                        lazy
                        paginator
                        striped-rows
                        responsive-layout="scroll"
                        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                        current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                        :rows-per-page-options="[10, 20, 50]"
                        @page="onPageChange"
                    >
                        <template #header>
                            <div class="table-header">
                                <div class="table-title">
                                    登录日志 ({{ totalRecords }})
                                </div>
                            </div>
                        </template>
                        <Column field="user.name" header="用户">
                            <template #body="{data}">
                                <div class="user-cell">
                                    <Avatar
                                        :image="data.user.image"
                                        :label="data.user.name?.charAt(0)"
                                        size="small"
                                        shape="circle"
                                    />
                                    <div class="user-info">
                                        <div class="user-name">
                                            {{ data.user.name }}
                                        </div>
                                        <div class="user-email">
                                            {{ data.user.email }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column field="loginTime" header="登录时间">
                            <template #body="{data}">
                                {{ formatDateTime(data.loginTime) }}
                            </template>
                        </Column>
                        <Column field="provider" header="登录方式">
                            <template #body="{data}">
                                <div class="provider-cell">
                                    <i
                                        :class="getProviderIcon(data.provider)"
                                        :style="{color: getProviderColor(data.provider)}"
                                    />
                                    <span>{{ getProviderName(data.provider) }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="ipAddress" header="IP地址" />
                        <Column field="device" header="设备信息">
                            <template #body="{data}">
                                <div class="device-cell">
                                    <i :class="getDeviceIcon(data.device)" />
                                    <span>{{ formatDevice(data.device) }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="isActive" header="状态">
                            <template #body="{data}">
                                <Tag
                                    :value="data.isActive ? '活跃' : '已过期'"
                                    :severity="data.isActive ? 'success' : 'secondary'"
                                />
                            </template>
                        </Column>
                        <Column header="操作">
                            <template #body="{data}">
                                <div class="action-buttons">
                                    <Button
                                        v-if="data.isActive"
                                        v-tooltip.top="'撤销会话'"
                                        icon="mdi mdi-logout"
                                        text
                                        rounded
                                        severity="danger"
                                        :loading="revokingSession === data.sessionToken"
                                        @click="revokeSession(data)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { debounce } from 'lodash-es'
import { authClient } from '@/lib/auth-client'
import { parseUserAgent } from '@/utils/useragent'

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

const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '活跃会话', value: 'active' },
    { label: '已过期', value: 'expired' },
]

// 计算属性
const providerStatsData = computed(() => statsData.value?.providers || [])
const trendData = computed(() => statsData.value?.trend || [])
const maxProviderCount = computed(() => Math.max(...providerStatsData.value.map((item: any) => item.count), 1),
)
const totalProviderCount = computed(() => providerStatsData.value.reduce((sum: number, item: any) => sum + item.count, 0),
)

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
            params.startDate = dateRange.value[0].toISOString()
            params.endDate = dateRange.value[1].toISOString()
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

// 防抖搜索
const debouncedSearch = debounce(() => {
    loadSessions(1)
}, 500)

// 工具函数
const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
        email: 'mdi mdi-email',
        credential: 'mdi mdi-email',
        github: 'mdi mdi-github',
        google: 'mdi mdi-google',
        microsoft: 'mdi mdi-microsoft',
        discord: 'iconfont icon-discord-simple',
        apple: 'mdi mdi-apple',
        twitter: 'mdi mdi-twitter',
        anonymous: 'mdi mdi-incognito',
        wechat: 'mdi mdi-wechat',
        qq: 'mdi mdi-qqchat',
        douyin: 'iconfont icon-douyin',
        weibo: 'mdi mdi-sina-weibo',
    }
    return icons[provider] || 'mdi mdi-account'
}

const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
        email: 'var(--color-default)',
        credential: 'var(--color-default)',
        github: 'var(--color-github)',
        google: 'var(--color-google)',
        microsoft: 'var(--color-microsoft)',
        discord: 'var(--color-discord)',
        apple: 'var(--color-apple)',
        twitter: 'var(--color-twitter)',
        anonymous: 'var(--color-default)',
        wechat: 'var(--color-wechat)',
        qq: 'var(--color-qq)',
        douyin: 'var(--color-douyin)',
        weibo: 'var(--color-weibo)',
    }
    return colors[provider] || 'var(--color-default)'
}

const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
        email: '邮箱登录',
        credential: '邮箱登录',
        github: 'GitHub',
        google: 'Google',
        microsoft: 'Microsoft',
        discord: 'Discord',
        apple: 'Apple',
        twitter: 'Twitter(X)',
        anonymous: '匿名登录',
        wechat: '微信',
        qq: 'QQ',
        douyin: '抖音',
        weibo: '微博',
    }
    return names[provider] || provider
}

const getDeviceIcon = (device: any) => {
    if (!device) {
return 'mdi mdi-help-circle'
}

    if (device.isMobile) {
return 'mdi mdi-cellphone'
}
    if (device.isTablet) {
return 'mdi mdi-tablet'
}
    if (device.isDesktop) {
return 'mdi mdi-desktop-classic'
}
    return 'mdi mdi-devices'
}

const formatDevice = (device: any) => {
    if (!device) {
return '未知设备'
}

    const parts = []
    if (device.browser) {
parts.push(device.browser)
}
    if (device.os) {
parts.push(device.os)
}

    return parts.join(' / ') || '未知设备'
}

const formatDateTime = (date: string | Date) => new Date(date).toLocaleString('zh-CN')

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
    })

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
    loadStats()
    loadSessions()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.admin-logs {
    min-height: 100vh;
    background: linear-gradient(135deg, $background 0%, $secondary-bg 100%);
    padding: 2rem;
}

.logs-container {
    max-width: 1400px;
    margin: 0 auto;
}

// 页面头部
.logs-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: $background-light;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .logs-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem 0;
    }

    .logs-subtitle {
        color: $secondary-light;
        margin: 0;
        font-size: 1.1rem;
    }
}

.header-actions {
    display: flex;
    gap: 1rem;

    @media (max-width: 768px) {
        width: 100%;

        :deep(.p-button) {
            flex: 1;
        }
    }
}

// 统计概览
.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: $background-light;
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
        background: linear-gradient(135deg, $blue-50 0%, $blue-100 100%);
        color: $blue;
        width: 4rem;
        height: 4rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        flex-shrink: 0;
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: $secondary;
        line-height: 1;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        color: $secondary-light;
        font-size: 0.95rem;
        font-weight: 500;
    }
}

// 通用部分样式
.period-stats,
.provider-stats,
.trend-chart,
.logs-detail {
    background: $background-light;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.section-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid $border-color;
    background: linear-gradient(135deg, $background 0%, $background-light 100%);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary;
    margin: 0;
}

// 时间段统计
.period-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
    padding: 0;
}

.period-card {
    padding: 2rem;
    text-align: center;
    border-right: 1px solid $border-color;
    transition: background-color 0.2s ease;

    &:last-child {
        border-right: none;
    }

    &:hover {
        background: $background;
    }

    .period-label {
        color: $secondary-light;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
    }

    .period-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: $blue-dark;
        line-height: 1;
    }
}

// 登录方式统计
.provider-chart {
    padding: 0;

    :deep(.p-datatable) {
        border: none;
        border-radius: 0;
    }

    :deep(.p-datatable-header) {
        background: transparent;
        border: none;
        padding: 1.5rem 2rem;
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 1rem 2rem;
        border-color: $border-color;
    }

    :deep(.p-datatable-thead > tr > th) {
        background: $background;
        color: $secondary;
        font-weight: 600;
        padding: 1rem 2rem;
        border-color: $border-color;
    }
}

.provider-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;

    i {
        font-size: 1.25rem;
        // 颜色通过内联样式设置，使用各平台品牌色
    }
}

.count-cell {
    display: flex;
    align-items: center;
    gap: 1rem;

    .count-value {
        font-weight: 600;
        color: $secondary;
        min-width: 3rem;
    }

    .count-bar {
        flex: 1;
        height: 8px;
        background: $border-color;
        border-radius: 4px;
        overflow: hidden;
        min-width: 100px;

        .count-progress {
            height: 100%;
            background: linear-gradient(90deg, $blue 0%, $blue-light 100%);
            transition: width 0.3s ease;
        }
    }
}

// 登录趋势图
.chart-container {
    padding: 2rem;
}

.chart-placeholder {
    text-align: center;
    padding: 3rem 2rem;
    color: $secondary-light;
    background: linear-gradient(135deg, $background 0%, $background-light 100%);
    border-radius: 8px;
    border: $border-dashed;

    p {
        font-size: 1.1rem;
        margin-bottom: 2rem;
        font-weight: 500;
    }

    .trend-data {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
    }

    .trend-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: $background-light;
        border-radius: 8px;
        min-width: 5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .trend-date {
            font-size: 0.85rem;
            color: $secondary-light;
            font-weight: 500;
        }

        .trend-count {
            font-weight: 700;
            color: $blue-darker;
            font-size: 1.25rem;
        }
    }
}

// 登录日志详情
.detail-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid $border-color;
    background: linear-gradient(135deg, $background 0%, $background-light 100%);

    .header-content {
        margin-bottom: 1.5rem;
    }

    .detail-filters {
        .filter-row {
            display: flex;
            gap: 1rem;
            align-items: center;

            @media (max-width: 768px) {
                flex-direction: column;
                align-items: stretch;
            }
        }

        .search-wrapper {
            flex: 1;
            min-width: 300px;

            @media (max-width: 768px) {
                min-width: 0;
            }
        }

        .filter-controls {
            display: flex;
            gap: 1rem;
            align-items: center;

            @media (max-width: 768px) {
                flex-wrap: wrap;
            }
        }
    }
}

.sessions-list {
    :deep(.p-datatable) {
        border: none;
        border-radius: 0;
    }

    :deep(.p-datatable-header) {
        background: transparent;
        border: none;
        padding: 1.5rem 2rem;
        margin: 0;
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 1rem 2rem;
        border-color: $border-color;
        vertical-align: middle;
    }

    :deep(.p-datatable-thead > tr > th) {
        background: $background;
        color: $secondary;
        font-weight: 600;
        padding: 1rem 2rem;
        border-color: $border-color;
    }

    :deep(.p-paginator) {
        background: $background;
        border-top: 1px solid $border-color;
        padding: 1rem 2rem;
    }
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .table-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: $secondary;
    }
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .user-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .user-name {
        font-weight: 500;
        color: $secondary;
        line-height: 1.2;
    }

    .user-email {
        font-size: 0.85rem;
        color: $secondary-light;
        line-height: 1.2;
    }
}

.device-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
        color: $secondary-light;
        font-size: 1.1rem;
    }

    span {
        color: $secondary;
        font-size: 0.9rem;
    }
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

// 响应式设计
@media (max-width: 768px) {
    .admin-logs {
        padding: 1rem;
    }

    .stats-overview {
        grid-template-columns: 1fr;
    }

    .period-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .period-card {
        border-right: none;
        border-bottom: 1px solid $border-color;

        &:nth-child(odd) {
            border-right: 1px solid $border-color;
        }

        &:last-child,
        &:nth-last-child(2) {
            border-bottom: none;
        }
    }

    .sessions-list {
        :deep(.p-datatable-tbody > tr > td),
        :deep(.p-datatable-thead > tr > th) {
            padding: 0.75rem 1rem;
        }
    }
}

@media (max-width: 480px) {
    .period-cards {
        grid-template-columns: 1fr;
    }

    .period-card {
        border-right: none;

        &:not(:last-child) {
            border-bottom: 1px solid $border-color;
        }
    }
}
</style>
