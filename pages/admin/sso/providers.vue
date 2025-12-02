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
                    <Button
                        label="创建提供商"
                        icon="mdi mdi-plus"
                        @click="openCreateDialog"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="sso-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索提供商名称、域名或 Provider ID..."
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Dropdown
                            v-model="typeFilter"
                            :options="typeOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选类型"
                            show-clear
                        />
                        <Dropdown
                            v-model="statusFilter"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选状态"
                            show-clear
                        />
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            :loading="loading"
                            @click="handleRefreshProviders"
                        />
                    </div>
                </div>
            </div>

            <!-- SSO 提供商列表 -->
            <div class="sso-list">
                <DataTable
                    :key="providers.length"
                    :value="filteredProviders"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                    :rows-per-page-options="[10, 25, 50]"
                    sortable
                    empty-message="暂无 SSO 提供商"
                    responsive-layout="scroll"
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                SSO 提供商列表 ({{ filteredProviders.length }})
                            </div>
                        </div>
                    </template>
                    <Column field="name" header="提供商信息">
                        <template #body="{data}">
                            <div class="provider-info">
                                <div class="provider-details">
                                    <span class="provider-name">{{ data.name || data.providerId }}</span>
                                    <small
                                        v-if="data.description"
                                        class="provider-description"
                                    >{{ data.description }}</small>
                                    <div class="provider-meta">
                                        <small class="provider-domain">
                                            <i class="mdi mdi-domain" />
                                            {{ data.domain }}
                                        </small>
                                        <small class="provider-issuer">
                                            <i class="mdi mdi-link" />
                                            {{ data.issuer }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column field="type" header="协议类型">
                        <template #body="{data}">
                            <Badge
                                :value="data.type?.toUpperCase() || 'OIDC'"
                                :severity="data.type === 'saml' ? 'warning' : 'info'"
                            />
                        </template>
                    </Column>

                    <Column
                        field="enabled"
                        header="状态"
                        sortable
                    >
                        <template #body="{data}">
                            <Tag :value="data.enabled ? '启用' : '禁用'" :severity="data.enabled ? 'success' : 'danger'" />
                        </template>
                    </Column>

                    <Column
                        field="createdAt"
                        header="创建时间"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="date-info">
                                <div>{{ formatDateLocale(data.createdAt) }}</div>
                                <small class="text-muted">{{ formatRelativeTime(data.createdAt) }}</small>
                            </div>
                        </template>
                    </Column>

                    <Column header="操作">
                        <template #body="{data}">
                            <div class="action-buttons">
                                <Button
                                    v-tooltip="'查看详情'"
                                    icon="mdi mdi-eye"
                                    size="small"
                                    severity="info"
                                    @click="openViewDialog(data)"
                                />
                                <Button
                                    v-tooltip="'编辑'"
                                    icon="mdi mdi-pencil"
                                    size="small"
                                    severity="warning"
                                    @click="openEditDialog(data)"
                                />
                                <Button
                                    :icon="data.enabled ? 'mdi mdi-pause' : 'mdi mdi-play'"
                                    size="small"
                                    :severity="data.enabled ? 'warning' : 'success'"
                                    :v-tooltip="data.enabled ? '禁用' : '启用'"
                                    :loading="togglingId === data.id"
                                    @click="handleToggleStatus(data)"
                                />
                                <Button
                                    v-tooltip="'删除'"
                                    icon="mdi mdi-delete"
                                    size="small"
                                    severity="danger"
                                    @click="openDeleteDialog(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
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

        <!-- 确认删除对话框 -->
        <AdminSsoDeleteProviderDialog
            v-model:visible="showDeleteDialog"
            :provider="selectedProvider"
            :loading="deleting"
            @confirm="handleDelete"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { formatDateLocale } from '@/utils/date'
import { useSsoProviders } from '@/composables/admin/use-sso-providers'

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

const toast = useToast()
const {
    providers,
    loading,
    searchQuery,
    refreshProviders,
    deleteProvider,
    toggleProviderStatus,
} = useSsoProviders()

// 筛选状态
const typeFilter = ref('')
const statusFilter = ref<boolean | ''>('')

// 筛选选项
const typeOptions = [
    { label: 'OIDC/OAuth2', value: 'oidc' },
    { label: 'SAML 2.0', value: 'saml' },
]

const statusOptions = [
    { label: '启用', value: true },
    { label: '禁用', value: false },
]

// 对话框状态
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedProvider = ref<any>(null)
const deleting = ref(false)
const togglingId = ref<string | null>(null)

// 计算属性：过滤后的提供商列表
const filteredProviders = computed(() => {
    let result = [...providers.value]

    // 搜索过滤
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter((provider: any) => provider.name?.toLowerCase().includes(query)
            || provider.providerId?.toLowerCase().includes(query)
            || provider.domain?.toLowerCase().includes(query)
            || provider.issuer?.toLowerCase().includes(query),
        )
    }

    // 类型过滤
    if (typeFilter.value) {
        result = result.filter((provider: any) => provider.type === typeFilter.value)
    }

    // 状态过滤
    if (statusFilter.value !== '' && statusFilter.value !== null) {
        result = result.filter((provider: any) => provider.enabled === statusFilter.value)
    }

    return result
})

// 刷新提供商列表
const handleRefreshProviders = async () => {
    try {
        await refreshProviders()
        toast.add({
            severity: 'success',
            summary: '刷新成功',
            detail: 'SSO提供商列表已刷新',
            life: 2000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '刷新失败',
            detail: '无法刷新提供商列表',
            life: 3000,
        })
    }
}

// 打开创建对话框
function openCreateDialog() {
    selectedProvider.value = null
    showCreateDialog.value = true
}

// 打开编辑对话框
function openEditDialog(provider: any) {
    selectedProvider.value = provider
    showCreateDialog.value = true
}

// 打开查看对话框
function openViewDialog(provider: any) {
    selectedProvider.value = provider
    showViewDialog.value = true
}

// 打开删除对话框
function openDeleteDialog(provider: any) {
    selectedProvider.value = provider
    showDeleteDialog.value = true
}

// 处理创建成功
function handleCreated() {
    refreshProviders()
}

// 处理更新成功
function handleUpdated() {
    refreshProviders()
}

// 处理删除
async function handleDelete(provider: any) {
    try {
        deleting.value = true
        const success = await deleteProvider(provider.id)
        if (success) {
            showDeleteDialog.value = false
            selectedProvider.value = null
        }
    } finally {
        deleting.value = false
    }
}

// 处理状态切换
async function handleToggleStatus(provider: any) {
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
</script>

<style lang="scss" scoped>
.admin-sso {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
}

.sso-container {
    max-width: 1400px;
    margin: 0 auto;
}

.sso-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

    @media (width <= 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .sso-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin: 0 0 0.5rem;
    }

    .sso-subtitle {
        color: #718096;
        margin: 0;
        font-size: 1.1rem;
    }
}

.header-actions {
    display: flex;
    gap: 1rem;

    @media (width <= 768px) {
        width: 100%;

        :deep(.p-button) {
            flex: 1;
        }
    }
}

.sso-filters {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 1.5rem;

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
            min-width: auto;
        }
    }

    .filter-controls {
        display: flex;
        gap: 1rem;

        @media (width <= 768px) {
            flex-direction: column;
        }
    }
}

.sso-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    overflow: hidden;

    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;

        .table-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #4a5568;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }

    :deep(.p-datatable) {
        .p-datatable-header {
            display: none;
        }

        .p-datatable-thead>tr>th {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #4a5568;
            font-weight: 600;
            padding: 1rem;
        }

        .p-datatable-tbody>tr>td {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .p-datatable-tbody>tr:hover {
            background: #f8fafc;
        }
    }

    .provider-info {
        .provider-name {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.25rem;
        }

        .provider-domain,
        .provider-issuer {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: #718096;
            margin-bottom: 0.125rem;

            i {
                width: 16px;
            }
        }
    }

    .date-info {
        small {
            display: block;
            color: #718096;
        }
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;

        :deep(.p-button) {
            width: 32px;
            height: 32px;
        }
    }
}

// 响应式优化
@media (width <= 768px) {
    .admin-sso {
        padding: 1rem;
    }

    :deep(.p-datatable-wrapper) {
        overflow-x: auto;
    }
}

.text-muted {
    color: #718096;
    font-size: 0.875rem;
    margin-top: 0.5rem;
}
</style>
