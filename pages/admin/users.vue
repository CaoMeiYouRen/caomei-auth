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
                    <CaomeiButton @click="showCreateDialog = true">
                        <template #icon>
                            <i class="mdi mdi-plus" />
                        </template>
                        创建用户
                    </CaomeiButton>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="users-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <CaomeiInput
                            v-model="searchQuery"
                            placeholder="搜索用户（有效邮箱或姓名，@开头搜索姓名）"
                            aria-label="搜索用户"
                            @update:model-value="debouncedSearch"
                        >
                            <template #prefix>
                                <i class="mdi mdi-magnify" aria-hidden="true" />
                            </template>
                        </CaomeiInput>
                    </div>
                    <div class="filter-controls">
                        <div class="filter-item">
                            <CaomeiSelect
                                v-model="selectedRole"
                                :options="roleOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="筛选角色"
                                aria-label="筛选角色"
                                show-clear
                            />
                        </div>
                        <div class="filter-item">
                            <CaomeiSelect
                                v-model="selectedStatus"
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
                            @click="refreshUsers"
                        >
                            <template #icon>
                                <i class="mdi mdi-refresh" />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>
            </div>

            <!-- 用户列表 -->
            <div class="users-list">
                <div class="table-header">
                    <div class="table-title">
                        用户列表 ({{ totalUsers }})
                        <small v-if="sortField" class="sort-info">
                            按{{ getSortFieldLabel(sortField) }}{{ sortOrder === 'asc' ? '升序' : '降序' }}排列
                        </small>
                    </div>
                    <div v-if="selectedUsers.length > 0" class="table-actions">
                        <CaomeiDropdownMenu>
                            <CaomeiDropdownMenuTrigger
                                as-child
                                unstyled
                            >
                                <CaomeiButton variant="secondary">
                                    <template #icon>
                                        <i class="mdi mdi-menu-down" />
                                    </template>
                                    批量操作
                                </CaomeiButton>
                            </CaomeiDropdownMenuTrigger>
                            <CaomeiDropdownMenuContent align="end">
                                <CaomeiDropdownMenuItem
                                    v-for="item in batchMenuItems"
                                    :key="item.label"
                                    @select="item.command?.()"
                                >
                                    <i :class="item.icon" aria-hidden="true" />
                                    {{ item.label }}
                                </CaomeiDropdownMenuItem>
                            </CaomeiDropdownMenuContent>
                        </CaomeiDropdownMenu>
                    </div>
                </div>

                <CaomeiDataTable
                    :data="userRows"
                    :columns="columns"
                    row-key="id"
                    :loading="loading"
                    :selection="visibleSelection"
                    selection-mode="multiple"
                    paginator
                    lazy
                    :rows="pageSize"
                    :rows-per-page-options="[10, 25, 50]"
                    :total-records="totalUsers"
                    :page="currentPage + 1"
                    :sort-field="sortField"
                    :sort-order="sortOrder"
                    @page="onTablePage"
                    @update:rows="onRowsChange"
                    @sort="onTableSort"
                    @update:selection="onSelectionChange"
                >
                    <template #cell-name="{row}">
                        <div class="user-cell">
                            <CaomeiAvatar
                                :src="row.image || undefined"
                                :fallback="row.name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase()"
                                shape="circle"
                                size="sm"
                                class="user-avatar"
                            />
                            <div class="user-info">
                                <span class="user-name">{{ row.name || '未设置昵称' }}</span>
                                <span class="user-email">{{ row.email }}</span>
                            </div>
                        </div>
                    </template>

                    <template #cell-role="{row}">
                        <BaseStatusBadge
                            variant="role"
                            :status="row.role"
                        />
                    </template>

                    <template #cell-banned="{row}">
                        <BaseStatusBadge
                            variant="banned"
                            :status="row.banned"
                        />
                    </template>

                    <template #cell-actions="{row}">
                        <div class="action-buttons">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                label="编辑详情"
                                @click="openDetailDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-pencil" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="primary"
                                label="会话管理"
                                @click="openSessionsDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-shield-account" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                v-if="row.banned"
                                icon-only
                                variant="ghost"
                                tone="success"
                                label="解禁用户"
                                @click="unbanUser(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-check-circle" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                v-else
                                icon-only
                                variant="ghost"
                                tone="warning"
                                label="禁用用户"
                                @click="openBanDialog(row)"
                            >
                                <template #icon>
                                    <i class="mdi mdi-block-helper" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="danger"
                                label="删除用户"
                                @click="deleteUser(row, isCurrentUser(row.id))"
                            >
                                <template #icon>
                                    <i class="mdi mdi-delete" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </template>

                    <template #empty>
                        <div class="empty-state">
                            <i class="mdi mdi-account-search-outline" />
                            <p>未找到匹配的用户</p>
                            <CaomeiButton
                                variant="ghost"
                                @click="refreshUsers"
                            >
                                清除筛选
                            </CaomeiButton>
                        </div>
                    </template>
                </CaomeiDataTable>
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
            :current-user-id="currentUserId"
            @updated="loadUsers"
            @view-sessions="openSessionsDialog"
            @ban="openBanDialog"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataTableColumn, DataTablePageEvent, DataTableSortEvent } from 'caomei-ui'
import { useUserManagement } from '@/composables/admin/use-user-management'
import { useUserTable } from '@/composables/admin/use-user-table'
import CreateUserDialog from '@/components/admin/users/create-user-dialog.vue'
import BanUserDialog from '@/components/admin/users/ban-user-dialog.vue'
import UserSessionsDialog from '@/components/admin/users/user-sessions-dialog.vue'
import UserDetailDialog from '@/components/admin/users/user-detail-dialog.vue'
import type { AdminUserRow as AdminUser } from '@/types/admin'

definePageMeta({
    layout: 'admin',
})

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
    onRowsChange,
    onSort,
    unbanUser,
    deleteUser,
    // Dialogs & Actions
    showCreateDialog,
    showBanDialog,
    showSessionsDialog,
    showDetailDialog,
    currentUser,
    batchMenuItems,
    openBanDialog,
    openSessionsDialog,
    openDetailDialog,
    isCurrentUser,
    currentUserId,
} = useUserManagement()

const {
    roleOptions,
    statusOptions,
    formatDate,
    getSortFieldLabel,
} = useUserTable()

const userRows = computed<AdminUser[]>(() => users.value as AdminUser[])

/* 操作列只通过 `#cell-actions` 插槽渲染；`createdAt` 用 accessor 统一格式化，避免大小写插槽名 */
const columns: DataTableColumn<AdminUser>[] = [
    { key: 'name', header: '用户', sortable: true },
    { key: 'role', header: '角色', sortable: true, width: '120px' },
    { key: 'banned', header: '状态', sortable: true, width: '100px' },
    {
        key: 'createdAt',
        header: '注册时间',
        sortable: true,
        width: '160px',
        accessor: (row) => formatDate(row.createdAt),
    },
    { key: 'actions', header: '操作', width: '180px', align: 'right', frozen: 'right' },
]

/** 当前页可见的选中行：`CaomeiDataTable` 按对象身份匹配勾选态，必须重新绑定到当前页的行对象 */
const visibleSelection = computed<AdminUser[]>(() => {
    const selectedIds = new Set(selectedUsers.value.map((user: AdminUser) => user.id))
    return userRows.value.filter((user) => selectedIds.has(user.id))
})

/** 分页：`CaomeiDataTable` 的 `first` 为 0 基偏移，页面状态保持 0 基页码 */
function onTablePage(event: DataTablePageEvent) {
    onPageChange({ page: event.first / event.rows, rows: event.rows })
}

/** 排序：`asc` / `desc` 换算为页面状态的 1 / -1 */
function onTableSort(event: DataTableSortEvent) {
    if (!event.sortField || !event.sortOrder) {
        return
    }
    onSort({ sortField: event.sortField, sortOrder: event.sortOrder === 'asc' ? 1 : -1 })
}

/** 选择：组件只回传当前页的选中行，跨页选择按 id 与其它页的历史选择合并 */
function onSelectionChange(selection: AdminUser | AdminUser[] | null) {
    const pageIds = new Set(userRows.value.map((user) => user.id))
    const currentPageSelection = Array.isArray(selection) ? selection : []
    const otherPagesSelection = selectedUsers.value.filter((user: AdminUser) => !pageIds.has(user.id))
    selectedUsers.value = [...otherPagesSelection, ...currentPageSelection]
}
</script>

<style lang="scss" scoped>
.admin-users {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.users-container {
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
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
            color: var(--admin-text);
            margin: 0 0 0.5rem;
        }

        .users-subtitle {
            color: var(--admin-muted);
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

            .filter-item {
                width: 9rem;
            }
        }
    }
}

.users-list {
    /* 表格表面改用 Admin 语义 token，暗色下与卡片保持一致 */
    --caomei-color-text: var(--admin-text);
    --caomei-data-table-head-bg: var(--admin-surface-muted);
    --caomei-data-table-border: var(--admin-border);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;

    .table-title {
        font-weight: 600;
        color: var(--admin-text);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .sort-info {
            font-weight: normal;
            color: var(--admin-muted);
            font-size: 0.875rem;
        }
    }
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .user-avatar {
        flex-shrink: 0;
    }

    .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
            font-weight: 500;
            color: var(--admin-text);
            font-size: 0.875rem;
        }

        .user-email {
            color: var(--admin-muted);
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
    .admin-users {
        padding: 1rem;
    }

    .users-header {
        flex-direction: column;
        gap: 1rem;

        .header-actions {
            width: 100%;

            .caomei-button {
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
