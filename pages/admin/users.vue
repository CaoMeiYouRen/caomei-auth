<template>
    <div class="admin-users">
        <div class="users-container">
            <div class="users-header">
                <div class="header-content">
                    <h1 class="users-title">
                        用户管理
                    </h1>
                    <p class="users-subtitle">
                        管理系统中的所有用户，包括查看详情、编辑资料、角色设置等
                    </p>
                </div>
                <div class="header-actions">
                    <Button
                        label="创建用户"
                        icon="mdi mdi-plus"
                        @click="showCreateDialog = true"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="users-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索用户（有效邮箱或姓名，@开头搜索姓名）"
                                @input="debouncedSearch"
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Select
                            v-model="selectedRole"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选角色"
                            show-clear
                            @change="loadUsers"
                        />
                        <Select
                            v-model="selectedStatus"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选状态"
                            show-clear
                            @change="loadUsers"
                        />
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            @click="refreshUsers"
                        />
                    </div>
                </div>
            </div>

            <!-- 用户列表 -->
            <div class="users-list">
                <BaseTable
                    v-model:selection="selectedUsers"
                    :data="users"
                    :loading="loading"
                    :rows="pageSize"
                    :total-records="totalUsers"
                    :sort-field="sortField === 'createdAt' ? 'createdAt' : sortField"
                    :sort-order="sortOrder === 'asc' ? 1 : -1"
                    selection-mode="multiple"
                    :meta-key-selection="false"
                    @page="onPageChange"
                    @sort="onSort"
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                用户列表 ({{ totalUsers }})
                                <small v-if="sortField" class="sort-info">
                                    按{{ getSortFieldLabel(sortField) }}{{ sortOrder === 'asc' ? '升序' : '降序' }}排列
                                </small>
                            </div>
                            <div v-if="selectedUsers.length > 0" class="table-actions">
                                <Button
                                    label="批量操作"
                                    icon="mdi mdi-menu-down"
                                    severity="secondary"
                                    @click="toggleBatchMenu"
                                />
                                <Menu
                                    ref="batchMenu"
                                    :model="batchMenuItems"
                                    :popup="true"
                                />
                            </div>
                        </div>
                    </template>

                    <template #empty>
                        <div class="empty-state">
                            <i class="mdi mdi-account-search-outline" />
                            <p>未找到匹配的用户</p>
                            <Button
                                label="清除筛选"
                                link
                                @click="refreshUsers"
                            />
                        </div>
                    </template>

                    <Column selection-mode="multiple" header-style="width: 3rem" />

                    <Column
                        field="name"
                        header="用户"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="user-cell">
                                <Avatar
                                    :image="data.image"
                                    :label="data.name?.charAt(0)?.toUpperCase() || data.email?.charAt(0)?.toUpperCase()"
                                    shape="circle"
                                    class="user-avatar"
                                />
                                <div class="user-info">
                                    <span class="user-name">{{ data.name || '未设置昵称' }}</span>
                                    <span class="user-email">{{ data.email }}</span>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column
                        field="role"
                        header="角色"
                        sortable
                        style="width: 120px"
                    >
                        <template #body="{data}">
                            <BaseStatusBadge
                                variant="role"
                                :status="data.role"
                            />
                        </template>
                    </Column>

                    <Column
                        field="banned"
                        header="状态"
                        sortable
                        style="width: 100px"
                    >
                        <template #body="{data}">
                            <BaseStatusBadge
                                variant="banned"
                                :status="data.banned"
                            />
                        </template>
                    </Column>

                    <Column
                        field="createdAt"
                        header="注册时间"
                        sortable
                        style="width: 160px"
                    >
                        <template #body="{data}">
                            {{ formatDate(data.createdAt) }}
                        </template>
                    </Column>

                    <Column
                        header="操作"
                        style="width: 180px"
                        align-frozen="right"
                        frozen
                    >
                        <template #body="{data}">
                            <div class="action-buttons">
                                <Button
                                    v-tooltip.top="'编辑详情'"
                                    icon="mdi mdi-pencil"
                                    text
                                    rounded
                                    severity="secondary"
                                    @click="openDetailDialog(data)"
                                />
                                <Button
                                    v-tooltip.top="'会话管理'"
                                    icon="mdi mdi-shield-account"
                                    text
                                    rounded
                                    severity="info"
                                    @click="openSessionsDialog(data)"
                                />
                                <Button
                                    v-if="data.banned"
                                    v-tooltip.top="'解禁用户'"
                                    icon="mdi mdi-check-circle"
                                    text
                                    rounded
                                    severity="success"
                                    @click="unbanUser(data)"
                                />
                                <Button
                                    v-else
                                    v-tooltip.top="'禁用用户'"
                                    icon="mdi mdi-block-helper"
                                    text
                                    rounded
                                    severity="warning"
                                    @click="openBanDialog(data)"
                                />
                                <Button
                                    v-tooltip.top="'删除用户'"
                                    icon="mdi mdi-delete"
                                    text
                                    rounded
                                    severity="danger"
                                    @click="deleteUser(data, isCurrentUser(data.id))"
                                />
                            </div>
                        </template>
                    </Column>
                </BaseTable>
            </div>
        </div>

        <!-- Dialogs -->
        <CreateUserDialog
            v-model:visible="showCreateDialog"
            @created="loadUsers"
        />

        <BanUserDialog
            v-model:visible="showBanDialog"
            :user="currentUser"
            @banned="loadUsers"
        />

        <UserSessionsDialog
            v-model:visible="showSessionsDialog"
            :user="currentUser"
        />

        <UserDetailDialog
            v-model:visible="showDetailDialog"
            :user="currentUser"
            @updated="loadUsers"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserManagement } from '@/composables/admin/use-user-management'
import { useUserTable } from '@/composables/admin/use-user-table'
import { authClient } from '@/lib/auth-client'
import CreateUserDialog from '@/components/admin/users/create-user-dialog.vue'
import BanUserDialog from '@/components/admin/users/ban-user-dialog.vue'
import UserSessionsDialog from '@/components/admin/users/user-sessions-dialog.vue'
import UserDetailDialog from '@/components/admin/users/user-detail-dialog.vue'

definePageMeta({
    layout: 'admin',
})

const sessionState = authClient.useSession()
const session = computed(() => sessionState.value?.data)

// 使用 Composables
const {
    loading,
    users,
    totalUsers,
    pageSize,
    currentPage,
    searchQuery,
    selectedRole,
    selectedStatus,
    selectedUsers,
    sortField,
    sortOrder,
    loadUsers,
    debouncedSearch,
    refreshUsers,
    onPageChange,
    onSort,
    unbanUser,
    deleteUser,
    batchBanUsers,
    batchUnbanUsers,
    batchDeleteUsers,
} = useUserManagement()

const {
    roleOptions,
    statusOptions,
    formatDate,
    getSortFieldLabel,
} = useUserTable()

// Dialog 状态
const showCreateDialog = ref(false)
const showBanDialog = ref(false)
const showSessionsDialog = ref(false)
const showDetailDialog = ref(false)
const currentUser = ref<any>(null)

// 批量操作菜单
const batchMenu = ref()
const batchMenuItems = [
    {
        label: '禁用选中用户',
        icon: 'mdi mdi-block-helper',
        command: () => batchBanUsers(),
    },
    {
        label: '解禁选中用户',
        icon: 'mdi mdi-check-circle',
        command: () => batchUnbanUsers(),
    },
    {
        label: '删除选中用户',
        icon: 'mdi mdi-delete',
        command: () => batchDeleteUsers(),
    },
]

const toggleBatchMenu = (event: any) => {
    batchMenu.value.toggle(event)
}

// Dialog 操作
const openBanDialog = (user: any) => {
    currentUser.value = user
    showBanDialog.value = true
}

const openSessionsDialog = (user: any) => {
    currentUser.value = user
    showSessionsDialog.value = true
}

const openDetailDialog = (user: any) => {
    currentUser.value = user
    showDetailDialog.value = true
}

const isCurrentUser = (userId: string) => session.value?.user?.id === userId

// 初始化
onMounted(() => {
    loadUsers()
})
</script>

<style lang="scss" scoped>
.admin-users {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.users-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    padding: 1.5rem;
}

.users-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    .header-content {
        .users-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a202c;
            margin: 0 0 0.5rem;
        }

        .users-subtitle {
            color: #718096;
            margin: 0;
            font-size: 0.875rem;
        }
    }
}

.users-filters {
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
        }
    }
}

.users-list {
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
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .sort-info {
            font-weight: normal;
            color: #718096;
            font-size: 0.875rem;
        }
    }
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .user-avatar {
        width: 32px;
        height: 32px;
        font-size: 0.875rem;
        background-color: var(--primary-100);
        color: var(--primary-700);
    }

    .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
            font-weight: 500;
            color: #2d3748;
            font-size: 0.875rem;
        }

        .user-email {
            color: #718096;
            font-size: 0.75rem;
        }
    }
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
    .admin-users {
        padding: 1rem;
    }

    .users-header {
        flex-direction: column;
        gap: 1rem;

        .header-actions {
            width: 100%;

            .p-button {
                width: 100%;
            }
        }
    }

    .users-filters {
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
