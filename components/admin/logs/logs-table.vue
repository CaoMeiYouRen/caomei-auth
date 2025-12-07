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
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索用户或IP地址"
                                @input="onSearch"
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
                            @change="onFilterChange"
                        />
                        <Datepicker
                            v-model="dateRange"
                            selection-mode="range"
                            :manual-input="false"
                            placeholder="选择日期范围"
                            show-clear
                            @date-select="onFilterChange"
                        />
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            @click="$emit('refresh')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="sessions-list">
            <BaseTable
                :data="sessions"
                :loading="loading"
                :total-records="totalRecords"
                :rows="pageSize"
                :first="page * pageSize"
                :sort-field="sortField"
                :sort-order="sortOrder === 'asc' ? 1 : -1"
                striped-rows
                responsive-layout="scroll"
                @page="$emit('page', $event)"
                @sort="$emit('sort', $event)"
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
                        <BaseStatusBadge
                            variant="session"
                            :status="data.isActive"
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
                                @click="$emit('revoke', data)"
                            />
                        </div>
                    </template>
                </Column>
            </BaseTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { formatDateTime } from '@/utils/shared/date'
import { getDeviceIcon, formatDevice } from '@/utils/device'

const props = defineProps<{
    sessions: any[]
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
    (e: 'revoke', session: any): void
    (e: 'page', event: any): void
    (e: 'sort', event: any): void
    (e: 'filter-change'): void
}>()

const searchQuery = defineModel<string>('searchQuery')
const selectedStatus = defineModel<string>('selectedStatus')
const dateRange = defineModel<Date[]>('dateRange')

const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '活跃会话', value: 'active' },
    { label: '已过期', value: 'expired' },
]

const onSearch = debounce(() => {
    emit('filter-change')
}, 500)

const onFilterChange = () => {
    emit('filter-change')
}
</script>

<style lang="scss" scoped>
.logs-detail {
    background: $background-light;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

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
            gap: 1rem;
            align-items: center;

            @media (width <= 768px) {
                flex-wrap: wrap;
            }
        }
    }
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary;
    margin: 0;
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
</style>
