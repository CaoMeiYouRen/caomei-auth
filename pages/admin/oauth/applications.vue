<template>
    <div class="admin-clients">
        <div class="clients-container">
            <div class="clients-header">
                <div class="header-content">
                    <h1 class="clients-title">
                        应用管理
                    </h1>
                    <p class="clients-subtitle">
                        管理您的 OAuth 2.0 应用，支持 RFC7591 动态客户端注册
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
                                v-model="searchQuery"
                                placeholder="搜索应用（名称、描述、Client ID）"
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
                <DataTable
                    :value="filteredApplications"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                    :rows-per-page-options="[10, 25, 50]"
                    sortable
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                应用列表 ({{ filteredApplications.length }})
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
                </DataTable>
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

        <DeleteApplicationDialog
            v-model:visible="showDeleteDialog"
            :application="deletingApplication"
            @deleted="onApplicationDeleted"
        />

        <ApiDocsDialog
            v-model:visible="showApiDocsDialog"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApplicationManagement } from '@/composables/admin/use-application-management'
import CreateApplicationDialog from '@/components/admin/oauth/create-application-dialog.vue'
import ApplicationSecretDialog from '@/components/admin/oauth/application-secret-dialog.vue'
import DeleteApplicationDialog from '@/components/admin/oauth/delete-application-dialog.vue'
import ApiDocsDialog from '@/components/admin/oauth/api-docs-dialog.vue'

definePageMeta({
    layout: 'admin',
})

const {
    loading,
    filteredApplications,
    searchQuery,
    refreshApplications,
    handleRefreshApplications,
    toggleApplicationStatus,
} = useApplicationManagement()

// Dialog states
const showCreateDialog = ref(false)
const showSecretDialog = ref(false)
const showDeleteDialog = ref(false)
const showApiDocsDialog = ref(false)

const editingApplication = ref<any>(null)
const newApplication = ref<any>(null)
const deletingApplication = ref<any>(null)

// Actions
const openCreateDialog = () => {
    editingApplication.value = null
    showCreateDialog.value = true
}

const editApplication = (app: any) => {
    editingApplication.value = app
    showCreateDialog.value = true
}

const confirmDelete = (app: any) => {
    deletingApplication.value = app
    showDeleteDialog.value = true
}

// Event handlers
const onApplicationCreated = (app: any) => {
    newApplication.value = app
    showSecretDialog.value = true
    refreshApplications()
}

const onApplicationUpdated = () => {
    refreshApplications()
}

const onApplicationDeleted = () => {
    refreshApplications()
}
</script>

<style lang="scss" scoped>
.admin-clients {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.clients-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
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
            color: #1a202c;
            margin: 0 0 0.5rem;
        }

        .clients-subtitle {
            color: #718096;
            margin: 0 0 0.5rem;
            font-size: 0.875rem;
        }

        .text-muted {
            font-size: 0.75rem;
            color: #a0aec0;
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
            background: #f8fafc;
            color: #4a5568;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
        }

        .p-datatable-tbody > tr {
            transition: background-color 0.2s;

            &:hover {
                background-color: #f8fafc;
            }
        }
    }
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .table-title {
        font-weight: 600;
        color: #4a5568;
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
            color: #2d3748;
        }

        .application-description {
            color: #718096;
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
    background: #edf2f7;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #4a5568;
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
    color: #718096;
    gap: 1rem;

    i {
        font-size: 3rem;
        color: #cbd5e0;
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
