<template>
    <div class="admin-clients">
        <div class="clients-container">
            <div class="clients-header">
                <div class="header-content">
                    <h1 class="clients-title">
                        {{ t('admin.oauth.page.title') }}
                    </h1>
                    <p class="clients-subtitle">
                        {{ t('admin.oauth.page.subtitle') }}
                    </p>
                    <span class="text-muted">
                        <strong>{{ t('admin.oauth.page.noticeLabel') }}</strong>{{ t('admin.oauth.page.noticeText') }}
                        {{ t('admin.oauth.page.noticeText2') }}
                    </span>
                </div>
                <div class="header-actions">
                    <CaomeiButton
                        variant="secondary"
                        @click="showApiDocsDialog = true"
                    >
                        <template #icon>
                            <i
                                class="mdi mdi-book-open-variant"
                                aria-hidden="true"
                            />
                        </template>
                        {{ t('admin.oauth.page.apiDocs') }}
                    </CaomeiButton>
                    <CaomeiButton @click="openCreateDialog">
                        <template #icon>
                            <i
                                class="mdi mdi-plus"
                                aria-hidden="true"
                            />
                        </template>
                        {{ t('admin.oauth.page.create') }}
                    </CaomeiButton>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="clients-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <CaomeiInput
                            :model-value="searchQuery"
                            :placeholder="t('admin.oauth.page.searchPlaceholder')"
                            :label="t('admin.oauth.page.searchLabel')"
                            @update:model-value="onSearchInput"
                        >
                            <template #prefix>
                                <i
                                    class="mdi mdi-magnify"
                                    aria-hidden="true"
                                />
                            </template>
                        </CaomeiInput>
                    </div>
                    <div class="filter-controls">
                        <BaseTooltip :content="t('admin.oauth.page.refresh')">
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                :label="t('admin.oauth.page.refresh')"
                                @click="handleRefreshApplications"
                            >
                                <template #icon>
                                    <i
                                        class="mdi mdi-refresh"
                                        aria-hidden="true"
                                    />
                                </template>
                            </CaomeiButton>
                        </BaseTooltip>
                    </div>
                </div>
            </div>

            <!-- 应用列表 -->
            <div class="clients-list">
                <div class="table-header">
                    <div class="table-title">
                        {{ t('admin.oauth.page.listTitle', {count: total}) }}
                    </div>
                </div>

                <CaomeiDataTable
                    :data="applications"
                    :columns="columns"
                    row-key="id"
                    :loading="loading"
                    paginator
                    lazy
                    :rows="pageSize"
                    :rows-per-page-options="[10, 25, 50]"
                    :total-records="total"
                    :page="page + 1"
                    :sort-field="sortField"
                    :sort-order="sortOrder"
                    @page="onTablePage"
                    @update:rows="onRowsChange"
                    @sort="onTableSort"
                >
                    <template #cell-name="{row}">
                        <div class="application-info">
                            <CaomeiAvatar
                                :src="row.logoUri || undefined"
                                :alt="row.name"
                                :fallback="getApplicationInitial(row.name)"
                                shape="square"
                                size="lg"
                                class="application-logo"
                            />
                            <div class="application-details">
                                <span class="application-name">{{ row.name }}</span>
                                <small
                                    v-if="row.description"
                                    class="application-description"
                                >{{ row.description }}</small>
                            </div>
                        </div>
                    </template>

                    <template #cell-clientId="{row}">
                        <code class="client-id">{{ row.clientId }}</code>
                    </template>

                    <template #cell-scope="{row}">
                        <div class="scope-tags">
                            <CaomeiTag
                                v-for="scope in splitScopes(row.scope)"
                                :key="scope"
                                size="sm"
                                variant="soft"
                            >
                                {{ scope }}
                            </CaomeiTag>
                        </div>
                    </template>

                    <template #cell-disabled="{row}">
                        <BaseStatusBadge
                            variant="disabled"
                            :status="row.disabled"
                        />
                    </template>

                    <template #cell-actions="{row}">
                        <div class="action-buttons">
                            <BaseTooltip :content="t('admin.oauth.page.actions.edit')">
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    :label="t('admin.oauth.page.actions.edit')"
                                    @click="editApplication(row)"
                                >
                                    <template #icon>
                                        <i
                                            class="mdi mdi-pencil"
                                            aria-hidden="true"
                                        />
                                    </template>
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip :content="row.disabled ? t('admin.oauth.page.actions.enable') : t('admin.oauth.page.actions.disable')">
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    :tone="row.disabled ? 'success' : 'warning'"
                                    :label="row.disabled ? t('admin.oauth.page.actions.enable') : t('admin.oauth.page.actions.disable')"
                                    @click="toggleApplicationStatus(row)"
                                >
                                    <template #icon>
                                        <i
                                            :class="row.disabled ? 'mdi mdi-play' : 'mdi mdi-pause'"
                                            aria-hidden="true"
                                        />
                                    </template>
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip :content="t('admin.oauth.page.actions.delete')">
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    tone="danger"
                                    :label="t('admin.oauth.page.actions.delete')"
                                    @click="confirmDelete(row)"
                                >
                                    <template #icon>
                                        <i
                                            class="mdi mdi-delete"
                                            aria-hidden="true"
                                        />
                                    </template>
                                </CaomeiButton>
                            </BaseTooltip>
                        </div>
                    </template>

                    <template #empty>
                        <div class="empty-state">
                            <i
                                class="mdi mdi-application-brackets-outline"
                                aria-hidden="true"
                            />
                            <p>{{ t('admin.oauth.page.empty') }}</p>
                            <CaomeiButton
                                variant="ghost"
                                @click="openCreateDialog"
                            >
                                {{ t('admin.oauth.page.createFirst') }}
                            </CaomeiButton>
                        </div>
                    </template>
                </CaomeiDataTable>
            </div>
        </div>

        <!-- Dialogs -->
        <CreateApplicationDialog
            v-model:visible="showCreateDialog"
            :application="editingApplication"
            @created="onApplicationCreated"
            @updated="onApplicationUpdated"
        />

        <ApplicationSecretDialog
            v-model:visible="showSecretDialog"
            :application="newApplication"
        />

        <ApiDocsDialog
            v-model:visible="showApiDocsDialog"
        />
    </div>
</template>

<script setup lang="ts">
import type { DataTableColumn, DataTablePageEvent, DataTableSortEvent } from 'caomei-ui'
import { useApplicationManagement } from '@/composables/admin/use-application-management'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import CreateApplicationDialog from '@/components/admin/oauth/create-application-dialog.vue'
import ApplicationSecretDialog from '@/components/admin/oauth/application-secret-dialog.vue'
import ApiDocsDialog from '@/components/admin/oauth/api-docs-dialog.vue'
import { formatDateLocale } from '@/utils/shared/date'
import type { AdminOAuthApplicationRow } from '@/types/admin'

definePageMeta({
    layout: 'admin',
})

const {
    loading,
    applications,
    total,
    page,
    pageSize,
    sortField,
    sortOrder,
    searchQuery,
    handleRefreshApplications,
    toggleApplicationStatus,
    onPage,
    onRowsChange,
    onSort,
    // Dialogs & Actions
    showCreateDialog,
    showSecretDialog,
    showApiDocsDialog,
    editingApplication,
    newApplication,
    openCreateDialog,
    editApplication,
    confirmDelete,
    onApplicationCreated,
    onApplicationUpdated,
    onSearchInput,
} = useApplicationManagement()

const { t } = useI18n()
usePageMeta('admin.oauth.page.title', 'admin.oauth.page.subtitle')

/* 操作列只通过 `#cell-actions` 插槽渲染；`createdAt` 用 accessor 统一格式化 */
const columns: DataTableColumn<AdminOAuthApplicationRow>[] = [
    { key: 'name', header: t('admin.oauth.page.columns.name'), sortable: true },
    { key: 'clientId', header: 'Client ID', width: '220px' },
    { key: 'scope', header: t('admin.oauth.page.columns.scope'), width: '220px' },
    { key: 'disabled', header: t('admin.oauth.page.columns.status'), sortable: true, width: '100px' },
    {
        key: 'createdAt',
        header: t('admin.oauth.page.columns.createdAt'),
        sortable: true,
        width: '180px',
        accessor: (row) => formatDateLocale(row.createdAt),
    },
    { key: 'actions', header: t('admin.oauth.page.columns.actions'), width: '160px', align: 'right', frozen: 'right' },
]

/** 头像回退文本：取应用名首字符，避免空名时渲染空头像 */
function getApplicationInitial(name?: string | null) {
    return name?.charAt(0)?.toUpperCase() || '?'
}

/** 授权范围按空白拆分为独立标签（服务端以空格拼接） */
function splitScopes(scope?: string | null) {
    return (scope || '').split(/\s+/).filter(Boolean)
}

/** 分页：`CaomeiDataTable` 的 `first` 为 0 基偏移，页面状态保持 0 基页码 */
function onTablePage(event: DataTablePageEvent) {
    onPage({ page: event.first / event.rows, rows: event.rows })
}

/** 排序：`asc` / `desc` 换算为页面状态的 1 / -1 */
function onTableSort(event: DataTableSortEvent) {
    if (!event.sortField || !event.sortOrder) {
        return
    }
    onSort({ sortField: event.sortField, sortOrder: event.sortOrder === 'asc' ? 1 : -1 })
}
</script>

<style lang="scss" scoped>
.admin-clients {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.clients-container {
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
    padding: 1.5rem;
}

.clients-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    .header-content {
        .clients-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--admin-text);
            margin: 0 0 0.5rem;
        }

        .clients-subtitle {
            color: var(--admin-muted);
            margin: 0 0 0.5rem;
            font-size: 0.875rem;
        }

        .text-muted {
            font-size: 0.75rem;
            color: var(--admin-muted);
            display: block;
            max-width: 600px;
        }
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
    }
}

.clients-filters {
    margin-bottom: 1.5rem;

    .filter-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;

        .search-wrapper {
            flex: 1;
            min-width: 300px;
        }
    }
}

.clients-list {
    /* 表格表面改用 Admin 语义 token，暗色下与卡片保持一致 */
    --caomei-color-text: var(--admin-text);
    --caomei-data-table-head-bg: var(--admin-surface-muted);
    --caomei-data-table-border: var(--admin-border);
}

.table-header {
    display: flex;
    align-items: center;
    padding-bottom: 1rem;

    .table-title {
        font-weight: 600;
        color: var(--admin-text);
    }
}

.application-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    .application-logo {
        --caomei-avatar-bg: var(--admin-primary-soft);
        --caomei-avatar-color: var(--admin-text);

        flex-shrink: 0;
    }

    .application-details {
        display: flex;
        flex-direction: column;

        .application-name {
            font-weight: 600;
            color: var(--admin-text);
        }

        .application-description {
            color: var(--admin-muted);
            font-size: 0.75rem;
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}

.client-id {
    font-family: monospace;
    background: var(--admin-surface-muted);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--admin-text);
}

.scope-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--admin-muted);
    gap: 1rem;

    i {
        font-size: 3rem;
        color: var(--admin-border);
    }

    p {
        margin: 0;
    }
}

// 响应式适配
@media (width <= 768px) {
    .admin-clients {
        padding: 1rem;
    }

    .clients-header {
        flex-direction: column;
        gap: 1rem;

        .header-actions {
            width: 100%;

            .caomei-button {
                flex: 1;
            }
        }
    }

    .clients-filters {
        .filter-row {
            flex-direction: column;
            align-items: stretch;

            .search-wrapper {
                width: 100%;
                min-width: 0;
            }
        }
    }
}
</style>
