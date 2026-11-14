import { ref, watch, computed, onMounted } from 'vue'
import { useConfirm, useToast } from 'caomei-ui'
import { debounce } from 'lodash-es'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import { useUserTable } from './use-user-table'
import { authClient } from '@/lib/auth-client'
import { validateEmail } from '@/utils/shared/validate'
import { syncAdminRole } from '@/utils/web/admin-role-client'
import type { AdminUserProfile, AdminUserRow } from '@/types/admin'

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

export function useUserManagement() {
    const toast = useToast()
    const confirm = useConfirm()
    const { getSortField } = useUserTable()

    const sessionState = authClient.useSession()
    const session = computed(() => sessionState.value?.data)

    // 筛选状态 (Specific to this view)
    const selectedRole = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)
    const selectedUsers = ref<AdminUserRow[]>([])

    const fetcher = async (params: DataTableFetchParams) => {
        const query: Record<string, unknown> = {
            limit: params.limit,
            offset: params.page * params.limit,
        }

        // 添加搜索条件 - 智能搜索多个字段
        if (params.searchQuery) {
            const query_value = params.searchQuery.trim()
            // 如果以@开头，搜索用户名（由于API限制，用email字段代替）
            if (query_value.startsWith('@')) {
                // 注意：API不支持username搜索，这里使用name字段搜索
                query.searchField = 'name'
                query.searchValue = query_value.substring(1) // 移除@符号
            } else if (validateEmail(query_value)) {
                // 如果是有效的邮箱格式，搜索邮箱
                query.searchField = 'email'
                query.searchValue = query_value
            } else {
                // 否则搜索姓名
                query.searchField = 'name'
                query.searchValue = query_value
            }
            query.searchOperator = 'contains'
        }

        // 添加筛选条件
        const filters: { field: string, operator: string, value: unknown }[] = []

        // 添加角色筛选
        if (selectedRole.value) {
            filters.push({
                field: 'role',
                operator: 'eq',
                value: selectedRole.value,
            })
        }

        // 添加状态筛选
        if (selectedStatus.value) {
            filters.push({
                field: 'banned',
                operator: 'eq',
                value: selectedStatus.value === 'banned',
            })
        }

        // 如果有多个筛选条件，使用数组；否则使用单个条件
        if (filters.length > 1) {
            query.filters = filters
        } else if (filters.length === 1) {
            query.filterField = filters[0]!.field
            query.filterOperator = filters[0]!.operator
            query.filterValue = filters[0]!.value
        }

        // 添加排序参数
        if (params.sortField) {
            query.sortBy = getSortField(params.sortField)
            query.sortDirection = params.sortOrder
        }

        const response = await authClient.admin.listUsers({ query })

        return {
            data: response.data?.users || [],
            total: response.data?.total || 0,
        }
    }

    const {
        loading,
        data: users,
        total: totalUsers,
        page: currentPage,
        pageSize,
        sortField,
        sortOrder,
        searchQuery,
        load: loadUsers,
        onPage: onPageChange,
        onRowsChange,
        onSort,
        onFilter,
        onSearch,
    } = useDataTable({
        fetcher,
        defaultPageSize: 10,
        defaultSortField: 'createdAt',
        defaultSortOrder: 'desc',
        immediate: true,
    })

    // Watchers for external filters
    watch([selectedRole, selectedStatus], () => {
        onFilter()
    })

    const debouncedSearch = debounce(() => {
        onSearch()
    }, 500)

    const refreshUsers = () => {
        searchQuery.value = ''
        selectedRole.value = null
        selectedStatus.value = null
        sortField.value = 'createdAt'
        sortOrder.value = 'desc'
        currentPage.value = 0
        loadUsers()
    }

    // 单个用户操作
    const unbanUser = async (user: AdminUserProfile) => {
        try {
            const response = await authClient.admin.unbanUser({
                userId: user.id,
            })

            if (response.data) {
                toast.success({
                    title: '解禁成功',
                    description: '用户已解除禁用',
                    duration: 3000,
                })
                loadUsers()
            }
        } catch (error: unknown) {
            console.error('解禁用户失败:', error)
            toast.danger({
                title: '解禁失败',
                description: errorMessage(error, '解禁用户失败'),
                duration: 3000,
            })
        }
    }

    const deleteUser = async (user: AdminUserProfile, isSelf: boolean) => {
        // 防止删除自己
        if (isSelf) {
            toast.warning({
                title: '操作不允许',
                description: '不能删除自己的账户',
                duration: 3000,
            })
            return
        }

        const confirmed = await confirm.open({
            title: '确认删除',
            description: `确定要删除用户 ${user.name || user.email} 吗？此操作不可恢复！`,
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            const response = await authClient.admin.removeUser({
                userId: user.id,
            })

            if (response.data) {
                toast.success({
                    title: '删除成功',
                    description: '用户已被删除',
                    duration: 3000,
                })
                loadUsers()
            }
        } catch (error: unknown) {
            console.error('删除用户失败:', error)
            toast.danger({
                title: '删除失败',
                description: errorMessage(error, '删除用户失败'),
                duration: 3000,
            })
        }
    }

    const syncUserAdminRoleAction = async (user: AdminUserProfile) => {
        try {
            loading.value = true
            const result = await syncAdminRole(user.id)

            if (result.success) {
                toast.success({
                    title: '同步成功',
                    description: result.message,
                    duration: 3000,
                })
                // 重新加载用户列表以更新显示
                await loadUsers()
                return
            }

            toast.warning({
                title: '同步完成',
                description: result.message,
                duration: 3000,
            })
        } catch (error: unknown) {
            console.error('同步管理员角色失败:', error)
            toast.danger({
                title: '同步失败',
                description: errorMessage(error, '同步管理员角色失败'),
                duration: 3000,
            })
        } finally {
            loading.value = false
        }
    }

    // 批量操作
    const batchBanUsers = async () => {
        if (selectedUsers.value.length === 0) {
            return
        }

        const confirmed = await confirm.open({
            title: '确认批量禁用',
            description: `确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`,
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                await authClient.admin.banUser({
                    userId: user.id,
                    banReason: '批量禁用操作',
                })
            }

            toast.success({
                title: '禁用成功',
                description: `已禁用 ${selectedUsers.value.length} 个用户`,
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('批量禁用失败:', error)
            toast.danger({
                title: '批量禁用失败',
                description: errorMessage(error, '批量禁用用户失败'),
                duration: 3000,
            })
        }
    }

    const batchUnbanUsers = async () => {
        if (selectedUsers.value.length === 0) {
            return
        }

        const confirmed = await confirm.open({
            title: '确认批量解禁',
            description: `确定要解禁选中的 ${selectedUsers.value.length} 个用户吗？`,
            tone: 'neutral',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                await authClient.admin.unbanUser({
                    userId: user.id,
                })
            }

            toast.success({
                title: '解禁成功',
                description: `已解禁 ${selectedUsers.value.length} 个用户`,
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('批量解禁失败:', error)
            toast.danger({
                title: '批量解禁失败',
                description: errorMessage(error, '批量解禁用户失败'),
                duration: 3000,
            })
        }
    }

    const batchDeleteUsers = async () => {
        if (selectedUsers.value.length === 0) {
            return
        }

        const confirmed = await confirm.open({
            title: '确认批量删除',
            description: `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`,
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                await authClient.admin.removeUser({
                    userId: user.id,
                })
            }

            toast.success({
                title: '删除成功',
                description: `已删除 ${selectedUsers.value.length} 个用户`,
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('批量删除失败:', error)
            toast.danger({
                title: '批量删除失败',
                description: errorMessage(error, '批量删除用户失败'),
                duration: 3000,
            })
        }
    }

    // Dialog 状态
    const showCreateDialog = ref(false)
    const showBanDialog = ref(false)
    const showSessionsDialog = ref(false)
    const showDetailDialog = ref(false)
    const currentUser = ref<AdminUserProfile | null>(null)

    // 批量操作菜单
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

    // Dialog 操作
    const openBanDialog = (user: AdminUserProfile) => {
        currentUser.value = user
        showBanDialog.value = true
    }

    const openSessionsDialog = (user: AdminUserProfile) => {
        currentUser.value = user
        showSessionsDialog.value = true
    }

    const openDetailDialog = (user: AdminUserProfile) => {
        currentUser.value = user
        showDetailDialog.value = true
    }

    const isCurrentUser = (userId: string) => session.value?.user?.id === userId

    /** 当前会话用户 id：详情对话框据此禁用「移除自己的管理员」等自操作 */
    const currentUserId = computed(() => session.value?.user?.id)

    // 初始化
    onMounted(() => {
        loadUsers()
    })

    return {
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
        syncUserAdminRoleAction,
        batchBanUsers,
        batchUnbanUsers,
        batchDeleteUsers,
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
    }
}
