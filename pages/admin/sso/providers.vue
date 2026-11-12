<template>
    <div class="admin-sso">
        <div class="sso-container">
            <!-- 页面头部 -->
            <div class="sso-header">
                <div class="header-content">
                    <h1 class="sso-title">
                        SSO 提供商管理
                    </h1>
                    <p class="sso-subtitle">
                        管理单点登录（SSO）提供商，支持 OIDC 和 SAML 协议
                    </p>
                    <span class="text-muted">
                        <strong>注意：</strong>当前 SSO 实现基于 Better Auth SSO 插件，支持标准 OIDC/OAuth2 和 SAML 2.0 协议。
                        请确保提供商端配置正确的回调 URL 和授权范围。
                    </span>
                </div>
                <div class="header-actions">
                    <CaomeiButton @click="openCreateDialog">
                        <template #icon>
                            <i class="mdi mdi-plus" aria-hidden="true" />
                        </template>
                        创建提供商
                    </CaomeiButton>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="sso-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <CaomeiInput
                            :model-value="searchQuery"
                            placeholder="搜索提供商名称、域名或 Provider ID..."
                            label="搜索提供商"
                            @update:model-value="onSearchInput"
                        >
                            <template #prefix>
                                <i class="mdi mdi-magnify" aria-hidden="true" />
                            </template>
                        </CaomeiInput>
                    </div>
                    <div class="filter-controls">
                        <div class="filter-item">
                            <CaomeiSelect
                                v-model="typeFilter"
                                :options="typeOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="筛选类型"
                                aria-label="筛选类型"
                                show-clear
                            />
                        </div>
                        <div class="filter-item">
                            <CaomeiSelect
                                v-model="statusFilter"
                                :options="statusOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="筛选状态"
                                aria-label="筛选状态"
                                show-clear
                            />
                        </div>
                        <CaomeiButton
                            icon-only
                            variant="secondary"
                            label="刷新"
                            title="刷新"
                            :loading="loading"
                            @click="handleRefreshProviders"
                        >
                            <template #icon>
                                <i class="mdi mdi-refresh" aria-hidden="true" />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>
            </div>

            <!-- SSO 提供商列表 -->
            <div class="sso-list">
                <div class="table-header">
                    <div class="table-title">
                        SSO 提供商列表 ({{ total }})
                    </div>
                </div>

                <CaomeiDataTable
                    :data="providers"
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
                    empty-text="暂无 SSO 提供商"
                    @page="onTablePage"
                    @sort="onTableSort"
                >
                    <template #cell-name="{row}">
                        <div class="provider-info">
                            <span class="provider-name">{{ row.name || row.providerId }}</span>
                            <small
                                v-if="row.description"
                                class="provider-description"
                            >{{ row.description }}</small>
                            <div class="provider-meta">
                                <small class="provider-domain">
                                    <i class="mdi mdi-domain" aria-hidden="true" />
                                    {{ row.domain }}
                                </small>
                                <small class="provider-issuer">
                                    <i class="mdi mdi-link" aria-hidden="true" />
                                    {{ row.issuer }}
                                </small>
                            </div>
                        </div>
                    </template>

                    <template #cell-type="{row}">
                        <CaomeiTag
                            :tone="row.type === 'saml' ? 'warning' : 'primary'"
                            variant="soft"
                            size="sm"
                        >
                            {{ row.type?.toUpperCase() || 'OIDC' }}
                        </CaomeiTag>
                    </template>

                    <template #cell-enabled="{row}">
                        <BaseStatusBadge
                            variant="enabled"
                            :status="row.enabled"
                        />
                    </template>

                    <template #cell-createdAt="{row}">
                        <div class="date-info">
                            <div>{{ formatDateLocale(row.createdAt) }}</div>
                            <small>{{ formatRelativeTime(row.createdAt) }}</small>
                        </div>
                    </template>

                    <template #cell-actions="{row}">
                        <div class="action-buttons">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="primary"
                                label="查看详情"
                                title="查看详情"
                                @click="openViewDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-eye" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="warning"
                                label="编辑"
                                title="编辑"
                                @click="openEditDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-pencil" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                :tone="row.enabled ? 'warning' : 'success'"
                                :label="row.enabled ? '禁用' : '启用'"
                                :title="row.enabled ? '禁用' : '启用'"
                                :loading="togglingId === row.id"
                                @click="handleToggleStatus(row)"
                            >
                                <template #icon>
                                    <i :class="row.enabled ? 'mdi mdi-pause' : 'mdi mdi-play'" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="danger"
                                label="删除"
                                title="删除"
                                @click="openDeleteDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-delete" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </template>
                </CaomeiDataTable>
            </div>
        </div>

        <!-- 创建/编辑 SSO 提供商对话框 -->
        <AdminSsoCreateProviderDialog
            v-model:visible="showCreateDialog"
            :provider="selectedProvider"
            @created="handleCreated"
            @updated="handleUpdated"
        />

        <!-- 查看提供商详情对话框 -->
        <AdminSsoProviderDetailDialog
            v-model:visible="showViewDialog"
            :provider="selectedProvider"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { DataTableColumn, DataTablePageEvent, DataTableSortEvent } from 'caomei-ui'
import { useConfirm } from 'caomei-ui'
import { debounce } from 'lodash-es'
import { formatDateLocale } from '@/utils/shared/date'
import { useSsoProviders } from '@/composables/admin/use-sso-providers'
import type { AdminSsoProviderRow } from '@/types/admin'

definePageMeta({
    title: 'SSO 提供商管理 - 草梅 Auth',
    layout: 'admin',
})

// 设置页面 SEO
useHead({
    title: 'SSO 提供商管理',
    meta: [
        {
            name: 'description',
            content: '管理单点登录（SSO）提供商，支持 OIDC 和 SAML 协议的配置和管理',
        },
        {
            name: 'keywords',
            content: 'SSO,单点登录,OIDC,SAML,身份验证,提供商管理',
        },
    ],
})

const confirm = useConfirm()
const {
    providers,
    loading,
    total,
    page,
    pageSize,
    sortField,
    sortOrder,
    searchQuery,
    typeFilter,
    statusFilter,
    refreshProviders,
    handleRefreshProviders,
    deleteProvider,
    toggleProviderStatus,
    onPage,
    onSort,
    onSearch,
} = useSsoProviders()

const onSearchInput = debounce((value: string | undefined) => {
    searchQuery.value = value || ''
    onSearch()
}, 300)

// 筛选选项（`CaomeiSelect` 的值只接受字符串 / 数字，状态用 'true' / 'false' 交服务端解析）
const typeOptions = [
    { label: 'OIDC/OAuth2', value: 'oidc' },
    { label: 'SAML 2.0', value: 'saml' },
]

const statusOptions = [
    { label: '启用', value: 'true' },
    { label: '禁用', value: 'false' },
]

const columns: DataTableColumn<AdminSsoProviderRow>[] = [
    { key: 'name', header: '提供商信息' },
    { key: 'type', header: '协议类型', width: '120px' },
    { key: 'enabled', header: '状态', sortable: true, width: '100px' },
    { key: 'createdAt', header: '创建时间', sortable: true, width: '180px' },
    { key: 'actions', header: '操作', width: '200px', align: 'right', frozen: 'right' },
]

// 对话框状态
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const selectedProvider = ref<AdminSsoProviderRow | null>(null)
const togglingId = ref<string | null>(null)

// 打开创建对话框
function openCreateDialog() {
    selectedProvider.value = null
    showCreateDialog.value = true
}

// 打开编辑对话框
function openEditDialog(provider: AdminSsoProviderRow) {
    selectedProvider.value = provider
    showCreateDialog.value = true
}

// 打开查看对话框
function openViewDialog(provider: AdminSsoProviderRow) {
    selectedProvider.value = provider
    showViewDialog.value = true
}

// 打开删除确认框
async function openDeleteDialog(provider: AdminSsoProviderRow) {
    const confirmed = await confirm.open({
        title: '确认删除',
        description: `确定要删除 SSO 提供商 "${provider.name || provider.providerId}" 吗？此操作不可撤销。`,
        confirmLabel: '删除',
        tone: 'danger',
    })
    if (!confirmed) {
        return
    }
    await deleteProvider(provider.id)
}

// 处理创建成功
function handleCreated() {
    refreshProviders()
}

// 处理更新成功
function handleUpdated() {
    refreshProviders()
}

// 处理状态切换
async function handleToggleStatus(provider: AdminSsoProviderRow) {
    try {
        togglingId.value = provider.id
        await toggleProviderStatus(provider)
    } finally {
        togglingId.value = null
    }
}

// 格式化相对时间
function formatRelativeTime(date: string | Date) {
    if (!date) {
        return ''
    }
    const now = new Date()
    const target = new Date(date)
    const diff = now.getTime() - target.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) {
        return '刚刚'
    }
    if (minutes < 60) {
        return `${minutes}分钟前`
    }
    if (hours < 24) {
        return `${hours}小时前`
    }
    if (days < 30) {
        return `${days}天前`
    }
    return ''
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
.admin-sso {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.sso-container {
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
    padding: 1.5rem;
}

.sso-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    .header-content {
        .sso-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--admin-text);
            margin: 0 0 0.5rem;
        }

        .sso-subtitle {
            color: var(--admin-muted);
            margin: 0 0 0.5rem;
            font-size: 0.875rem;
        }

        .text-muted {
            display: block;
            max-width: 600px;
            color: var(--admin-muted);
            font-size: 0.75rem;
        }
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
    }
}

.sso-filters {
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

        .filter-controls {
            display: flex;
            gap: 0.75rem;
            align-items: center;

            .filter-item {
                width: 9rem;
            }
        }
    }
}

.sso-list {
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

.provider-info {
    display: flex;
    flex-direction: column;

    .provider-name {
        margin-bottom: 0.25rem;
        font-weight: 600;
        color: var(--admin-text);
    }

    .provider-description {
        color: var(--admin-muted);
        font-size: 0.75rem;
    }

    .provider-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 0.25rem;
    }

    .provider-domain,
    .provider-issuer {
        display: flex;
        gap: 0.25rem;
        align-items: center;
        font-size: 0.875rem;
        color: var(--admin-muted);
    }
}

.date-info small {
    display: block;
    color: var(--admin-muted);
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
}

// 响应式适配
@media (width <= 768px) {
    .admin-sso {
        padding: 1rem;
    }

    .sso-header {
        flex-direction: column;
        gap: 1rem;

        .header-actions {
            width: 100%;

            .caomei-button {
                width: 100%;
            }
        }
    }

    .sso-filters {
        .filter-row {
            flex-direction: column;
            align-items: stretch;

            .search-wrapper,
            .filter-controls {
                width: 100%;
                min-width: 0;
            }

            .filter-controls {
                overflow-x: auto;
                padding-bottom: 0.5rem;
            }
        }
    }
}
</style>
