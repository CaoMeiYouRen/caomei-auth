<template>
    <div class="admin-clients">
        <div class="clients-container">
            <div class="clients-header">
                <div class="header-content">
                    <h1 class="clients-title">
                        应用管理
                    </h1>
                    <p class="clients-subtitle">
                        管理您的 OAuth 2.0 应用，应用由管理员在此创建并下发给接入方
                    </p>
                    <span class="text-muted">
                        <strong>注意：</strong>当前 OIDC 实现基于 Better Auth，仅支持标准 OpenID Connect 核心功能。
                        不支持隐式流程、密码流程、客户端流程等非标准模式。
                    </span>
                </div>
                <div class="header-actions">
                    <Button
                        label="API 文档"
                        icon="mdi mdi-book-open-variant"
                        severity="secondary"
                        outlined
                        @click="showApiDocsDialog = true"
                    />
                    <Button
                        label="创建应用"
                        icon="mdi mdi-plus"
                        @click="openCreateDialog"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="clients-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                :model-value="searchQuery"
                                placeholder="搜索应用（名称、描述、Client ID）"
                                @update:model-value="onSearchInput"
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            @click="handleRefreshApplications"
                        />
                    </div>
                </div>
            </div>

            <!-- 应用列表 -->
            <div class="clients-list">
                <BaseTable
                    :data="applications"
                    :total-records="total"
                    :loading="loading"
                    :rows="pageSize"
                    :first="page * pageSize"
                    :sort-field="sortField"
                    :sort-order="sortOrder === 'asc' ? 1 : -1"
                    @page="onPage"
                    @sort="onSort"
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                应用列表 ({{ total }})
                            </div>
                        </div>
                    </template>
                    <template #empty>
                        <div class="empty-state">
                            <i class="mdi mdi-application-brackets-outline" />
                            <p>暂无应用</p>
                            <Button
                                label="创建第一个应用"
                                link
                                @click="openCreateDialog"
                            />
                        </div>
                    </template>
                    <Column
                        field="name"
                        header="应用名称"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="application-info">
                                <img
                                    v-if="data.logoUri"
                                    :src="data.logoUri"
                                    :alt="data.name"
                                    class="application-logo"
                                >
                                <Avatar
                                    v-else
                                    :label="data.name?.charAt(0)?.toUpperCase()"
                                    shape="circle"
                                    class="application-logo-placeholder"
                                />
                                <div class="application-details">
                                    <span class="application-name">{{ data.name }}</span>
                                    <small
                                        v-if="data.description"
                                        class="application-description"
                                    >{{ data.description }}</small>
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column
                        field="clientId"
                        header="Client ID"
                    >
                        <template #body="{data}">
                            <code class="client-id">{{ data.clientId }}</code>
                        </template>
                    </Column>
                    <Column
                        field="scope"
                        header="授权范围"
                    >
                        <template #body="{data}">
                            <div class="scope-tags">
                                <Tag
                                    v-for="scope in (data.scope || '').split(' ').filter((s: string) => s)"
                                    :key="scope"
                                    :value="scope"
                                    severity="secondary"
                                    class="scope-tag"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column
                        field="disabled"
                        header="状态"
                        sortable
                    >
                        <template #body="{data}">
                            <BaseStatusBadge
                                variant="disabled"
                                :status="data.disabled"
                            />
                        </template>
                    </Column>
                    <Column
                        field="createdAt"
                        header="创建时间"
                        sortable
                    >
                        <template #body="{data}">
                            {{ new Date(data.createdAt).toLocaleString() }}
                        </template>
                    </Column>
                    <Column header="操作">
                        <template #body="{data}">
                            <div class="action-buttons">
                                <Button
                                    v-tooltip.top="'编辑'"
                                    icon="mdi mdi-pencil"
                                    text
                                    rounded
                                    severity="secondary"
                                    @click="editApplication(data)"
                                />
                                <Button
                                    v-tooltip.top="data.disabled ? '启用应用' : '禁用应用'"
                                    :icon="data.disabled ? 'mdi mdi-play' : 'mdi mdi-pause'"
                                    text
                                    rounded
                                    :severity="data.disabled ? 'success' : 'warning'"
                                    @click="toggleApplicationStatus(data)"
                                />
                                <Button
                                    v-tooltip.top="'删除'"
                                    icon="mdi mdi-delete"
                                    text
                                    rounded
                                    severity="danger"
                                    @click="confirmDelete(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </BaseTable>
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
import { useApplicationManagement } from '@/composables/admin/use-application-management'
import CreateApplicationDialog from '@/components/admin/oauth/create-application-dialog.vue'
import ApplicationSecretDialog from '@/components/admin/oauth/application-secret-dialog.vue'
import ApiDocsDialog from '@/components/admin/oauth/api-docs-dialog.vue'

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
    :deep(.p-datatable) {
        .p-datatable-header {
            background: transparent;
            border: none;
            padding: 0 0 1rem;
        }

        .p-datatable-thead > tr > th {
            background: var(--admin-surface-muted);
            color: var(--admin-text);
            font-weight: 600;
            border-bottom: 1px solid var(--admin-border);
        }

        .p-datatable-tbody > tr {
            background: var(--admin-surface);
            color: var(--admin-text);
            transition: background-color 0.2s;

            > td {
                color: var(--admin-text);
                border-color: var(--admin-border);
            }

            &:hover {
                background-color: var(--admin-surface-muted);
            }
        }

        .p-paginator {
            background: var(--admin-surface);
            color: var(--admin-text);
            border-color: var(--admin-border);
        }
    }
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

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
        width: 40px;
        height: 40px;
        border-radius: 8px;
        object-fit: cover;
    }

    .application-logo-placeholder {
        width: 40px;
        height: 40px;
        background-color: var(--primary-100);
        color: var(--primary-700);
        font-size: 1.2rem;
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

    .scope-tag {
        font-size: 0.75rem;
    }
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
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

            .p-button {
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
