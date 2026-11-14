<template>
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
                        <CaomeiInput
                            v-model="searchQuery"
                            placeholder="搜索用户或IP地址"
                            label="搜索用户或IP地址"
                            clearable
                            @update:model-value="onSearch"
                        >
                            <template #prefix>
                                <i class="mdi mdi-magnify" aria-hidden="true" />
                            </template>
                        </CaomeiInput>
                    </div>
                    <div class="filter-controls">
                        <div class="filter-item filter-item--status">
                            <CaomeiSelect
                                :model-value="selectedStatus ?? null"
                                :options="statusOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="会话状态"
                                label="会话状态"
                                show-clear
                                @update:model-value="onStatusChange"
                            />
                        </div>
                        <div class="filter-item filter-item--range">
                            <CaomeiDatePicker
                                v-model="dateRange"
                                selection-mode="range"
                                placeholder="选择日期范围"
                                label="选择日期范围"
                            />
                            <BaseTooltip
                                v-if="dateRange"
                                content="清除日期范围"
                            >
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    label="清除日期范围"
                                    @click="dateRange = null"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-close" aria-hidden="true" />
                                    </template>
                                </CaomeiButton>
                            </BaseTooltip>
                        </div>
                        <BaseTooltip content="刷新">
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                label="刷新"
                                @click="$emit('refresh')"
                            >
                                <template #icon>
                                    <i class="mdi mdi-refresh" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </BaseTooltip>
                    </div>
                </div>
            </div>
        </div>

        <div class="sessions-list">
            <div class="table-header">
                <div class="table-title">
                    登录日志 ({{ totalRecords }})
                </div>
            </div>

            <CaomeiDataTable
                :data="sessions"
                :columns="columns"
                row-key="id"
                :loading="loading"
                paginator
                lazy
                :rows="pageSize"
                :rows-per-page-options="[10, 20, 25, 50]"
                :total-records="totalRecords"
                :page="page + 1"
                :sort-field="sortField"
                :sort-order="sortOrder"
                empty-text="暂无登录日志"
                @page="onTablePage"
                @sort="onTableSort"
                @update:rows="onTableRows"
            >
                <template #cell-user="{row}">
                    <div class="user-cell">
                        <CaomeiAvatar
                            :src="row.user.image || undefined"
                            :alt="row.user.name || row.user.email"
                            :fallback="row.user.name?.charAt(0)?.toUpperCase() || row.user.email?.charAt(0)?.toUpperCase()"
                            shape="circle"
                            size="sm"
                            class="user-avatar"
                        />
                        <div class="user-info">
                            <div class="user-name">
                                {{ row.user.name }}
                            </div>
                            <div class="user-email">
                                {{ row.user.email }}
                            </div>
                        </div>
                    </div>
                </template>

                <template #cell-device="{row}">
                    <div class="device-cell">
                        <i :class="getDeviceIcon(row.device)" aria-hidden="true" />
                        <span>{{ formatDevice(row.device) }}</span>
                    </div>
                </template>

                <template #cell-isActive="{row}">
                    <BaseStatusBadge
                        variant="session"
                        :status="row.isActive"
                    />
                </template>

                <template #cell-actions="{row}">
                    <div class="action-buttons">
                        <BaseTooltip
                            v-if="row.isActive"
                            content="撤销会话"
                        >
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="danger"
                                label="撤销会话"
                                :loading="revokingSession === row.sessionToken"
                                @click="$emit('revoke', row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-logout" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </BaseTooltip>
                    </div>
                </template>
            </CaomeiDataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import type { DataTableColumn, DataTablePageEvent, DataTableSortEvent, DatePickerRange } from 'caomei-ui'
import { formatDateTime } from '@/utils/shared/date'
import { getDeviceIcon, formatDevice } from '@/utils/web/device'
import type { AdminLogSession } from '@/types/admin'

defineProps<{
    sessions: AdminLogSession[]
    loading: boolean
    totalRecords: number
    revokingSession: string
    page: number
    pageSize: number
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
    (e: 'refresh'): void
    (e: 'revoke', session: AdminLogSession): void
    (e: 'page', event: { page: number, rows: number }): void
    (e: 'rows-change', rows: number): void
    (e: 'sort', event: { sortField: string, sortOrder: number }): void
    (e: 'filter-change'): void
}>()

const searchQuery = defineModel<string>('searchQuery', { required: true })
const selectedStatus = defineModel<string | undefined>('selectedStatus', { required: true })
const dateRange = defineModel<DatePickerRange | null>('dateRange', { required: true })

const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '活跃会话', value: 'active' },
    { label: '已过期', value: 'expired' },
]

/* 操作列只通过 `#cell-actions` 插槽渲染；时间列用 accessor 统一格式化，避免大小写插槽名 */
const columns: DataTableColumn<AdminLogSession>[] = [
    { key: 'user', header: '用户' },
    {
        key: 'loginTime',
        header: '登录时间',
        width: '180px',
        accessor: (row) => formatDateTime(row.loginTime),
    },
    { key: 'ipAddress', header: 'IP地址', width: '150px' },
    { key: 'device', header: '设备信息' },
    { key: 'isActive', header: '状态', width: '100px' },
    { key: 'actions', header: '操作', width: '90px', align: 'right', frozen: 'right' },
]

const onSearch = debounce(() => {
    emit('filter-change')
}, 500)

/* `CaomeiSelect` 清除后回传 `null`，页面状态仍用 `undefined` 表示未筛选 */
function onStatusChange(value: string | number | null | undefined) {
    selectedStatus.value = typeof value === 'string' ? value : undefined
}

/** 分页：`CaomeiDataTable` 的 `first` 为 0 基偏移，页面状态保持 0 基页码 */
function onTablePage(event: DataTablePageEvent) {
    emit('page', { page: event.first / event.rows, rows: event.rows })
}

/** 每页条数变更意图：交给 `useDataTable` 过滤分页器随后补发的旧 rows 事件 */
function onTableRows(rows: number) {
    emit('rows-change', rows)
}

/** 排序：`asc` / `desc` 换算为页面状态的 1 / -1（与 `useDataTable` 对齐） */
function onTableSort(event: DataTableSortEvent) {
    if (!event.sortField || !event.sortOrder) {
        return
    }
    emit('sort', { sortField: event.sortField, sortOrder: event.sortOrder === 'asc' ? 1 : -1 })
}
</script>

<style lang="scss" scoped>
.logs-detail {
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
    margin-bottom: 2rem;
    overflow: hidden;
}

.detail-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--admin-border);
    background: var(--admin-surface);

    .header-content {
        margin-bottom: 1.5rem;
    }
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--admin-text);
    margin: 0;
}

.detail-filters {
    .filter-row {
        display: flex;
        gap: 1rem;
        align-items: center;

        @media (width <= 768px) {
            flex-direction: column;
            align-items: stretch;
        }
    }

    .search-wrapper {
        flex: 1;
        min-width: 300px;

        @media (width <= 768px) {
            min-width: 0;
        }
    }

    .filter-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;

        @media (width <= 768px) {
            flex-wrap: wrap;
        }
    }

    .filter-item {
        &--status {
            width: 9rem;
        }

        &--range {
            display: flex;
            gap: 0.25rem;
            align-items: center;
        }
    }
}

.sessions-list {
    /* 表格表面改用 Admin 语义 token，暗色下与卡片保持一致 */
    --caomei-color-text: var(--admin-text);
    --caomei-data-table-head-bg: var(--admin-surface-muted);
    --caomei-data-table-border: var(--admin-border);

    padding-bottom: 0.5rem;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem 1rem;

    .table-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--admin-text);
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
        color: var(--admin-text);
        line-height: 1.2;
    }

    .user-email {
        font-size: 0.85rem;
        color: var(--admin-muted);
        line-height: 1.2;
    }
}

.device-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
        color: var(--admin-muted);
        font-size: 1.1rem;
    }

    span {
        color: var(--admin-text);
        font-size: 0.9rem;
    }
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}
</style>
