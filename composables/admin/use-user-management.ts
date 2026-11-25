import { ref, watch, computed, onMounted } from 'vue'
import { useConfirm, useToast } from 'caomei-ui'
import { debounce } from 'lodash-es'
import { useDataTable, type DataTableFetchParams } from '../core/use-data-table'
import { useUserTable } from './use-user-table'
import { authClient } from '@/lib/auth-client'
import { syncAdminRole } from '@/utils/web/admin-role-client'
import type { AdminUserProfile, AdminUserRow } from '@/types/admin'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { getApiErrorMessage, throwIfAuthError } from '@/utils/shared/api-error'
import { buildAdminUserSearchQuery } from '@/utils/web/user-search'

export function useUserManagement() {
    const toast = useToast()
    const t = useI18nText()
    const confirm = useConfirm()
    const route = useRoute()
    const { getSortField } = useUserTable()

    const sessionState = authClient.useSession()
    const session = computed(() => sessionState.value?.data)

    // 筛选状态 (Specific to this view)
    const selectedRole = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)
    const selectedUsers = ref<AdminUserRow[]>([])
    /** 从 /admin/users?userId=<id> 进入时的固定用户过滤 */
    const initialUserId = ref('')

    const fetcher = async (params: DataTableFetchParams) => {
        const query: Record<string, unknown> = {
            limit: params.limit,
            offset: params.page * params.limit,
        }

        // 搜索条件：普通姓名 / 邮箱 / @用户名；从登录事件跳转时按显式 userId 等值过滤
        Object.assign(query, buildAdminUserSearchQuery(params.searchQuery, initialUserId.value))

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
        } else if (filters.length === 1 && !query.filterField) {
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
    } = useDataTable<AdminUserRow>({
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

            throwIfAuthError(response, t('admin.users.flow.unbanFailed'))

            if (response.data) {
                toast.success({
                    title: t('admin.users.flow.unbanSuccessTitle'),
                    description: t('admin.users.flow.unbanSuccess'),
                    duration: 3000,
                })
                loadUsers()
            }
        } catch (error: unknown) {
            console.error('Failed to unban user:', error)
            toast.danger({
                title: t('admin.users.flow.unbanFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.unbanFailed')),
                duration: 3000,
            })
        }
    }

    const deleteUser = async (user: AdminUserProfile, isSelf: boolean) => {
        // 防止删除自己
        if (isSelf) {
            toast.warning({
                title: t('admin.users.flow.cannotDeleteSelfTitle'),
                description: t('admin.users.flow.cannotDeleteSelf'),
                duration: 3000,
            })
            return
        }

        const confirmed = await confirm.open({
            title: t('admin.users.flow.confirmDeleteTitle'),
            description: t('admin.users.flow.confirmDelete', { name: user.name || user.email }),
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            const response = await authClient.admin.removeUser({
                userId: user.id,
            })

            throwIfAuthError(response, t('admin.users.flow.deleteFailed'))

            if (response.data) {
                toast.success({
                    title: t('admin.users.flow.deleteSuccessTitle'),
                    description: t('admin.users.flow.deleteSuccess'),
                    duration: 3000,
                })
                loadUsers()
            }
        } catch (error: unknown) {
            console.error('Failed to delete user:', error)
            toast.danger({
                title: t('admin.users.flow.deleteFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.deleteFailed')),
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
                    title: t('admin.users.flow.syncSuccessTitle'),
                    description: result.message,
                    duration: 3000,
                })
                // 重新加载用户列表以更新显示
                await loadUsers()
                return
            }

            toast.warning({
                title: t('admin.users.flow.syncDoneTitle'),
                description: result.message,
                duration: 3000,
            })
        } catch (error: unknown) {
            console.error('Failed to sync admin role:', error)
            toast.danger({
                title: t('admin.users.flow.syncFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.syncFailed')),
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
            title: t('admin.users.flow.batchBanTitle'),
            description: t('admin.users.flow.batchBan', { count: selectedUsers.value.length }),
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                const response = await authClient.admin.banUser({
                    userId: user.id,
                    banReason: t('admin.users.flow.batchBanReason'),
                })
                throwIfAuthError(response, t('admin.users.flow.batchBanFailed'))
            }

            toast.success({
                title: t('admin.users.flow.batchBanSuccessTitle'),
                description: t('admin.users.flow.batchBanSuccess', { count: selectedUsers.value.length }),
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('Failed to ban selected users:', error)
            toast.danger({
                title: t('admin.users.flow.batchBanFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.batchBanFailed')),
                duration: 3000,
            })
            /* 批量可能部分成功：刷新列表并清空选择，避免重复操作 */
            selectedUsers.value = []
            loadUsers()
        }
    }

    const batchUnbanUsers = async () => {
        if (selectedUsers.value.length === 0) {
            return
        }

        const confirmed = await confirm.open({
            title: t('admin.users.flow.batchUnbanTitle'),
            description: t('admin.users.flow.batchUnban', { count: selectedUsers.value.length }),
            tone: 'neutral',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                const response = await authClient.admin.unbanUser({
                    userId: user.id,
                })
                throwIfAuthError(response, t('admin.users.flow.batchUnbanFailed'))
            }

            toast.success({
                title: t('admin.users.flow.batchUnbanSuccessTitle'),
                description: t('admin.users.flow.batchUnbanSuccess', { count: selectedUsers.value.length }),
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('Failed to unban selected users:', error)
            toast.danger({
                title: t('admin.users.flow.batchUnbanFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.batchUnbanFailed')),
                duration: 3000,
            })
            selectedUsers.value = []
            loadUsers()
        }
    }

    const batchDeleteUsers = async () => {
        if (selectedUsers.value.length === 0) {
            return
        }

        const confirmed = await confirm.open({
            title: t('admin.users.flow.batchDeleteTitle'),
            description: t('admin.users.flow.batchDelete', { count: selectedUsers.value.length }),
            tone: 'danger',
        })
        if (!confirmed) {
            return
        }

        try {
            for (const user of selectedUsers.value) {
                const response = await authClient.admin.removeUser({
                    userId: user.id,
                })
                throwIfAuthError(response, t('admin.users.flow.batchDeleteFailed'))
            }

            toast.success({
                title: t('admin.users.flow.batchDeleteSuccessTitle'),
                description: t('admin.users.flow.batchDeleteSuccess', { count: selectedUsers.value.length }),
                duration: 3000,
            })

            selectedUsers.value = []
            loadUsers()
        } catch (error: unknown) {
            console.error('Failed to delete selected users:', error)
            toast.danger({
                title: t('admin.users.flow.batchDeleteFailedTitle'),
                description: getApiErrorMessage(error, t('admin.users.flow.batchDeleteFailed')),
                duration: 3000,
            })
            selectedUsers.value = []
            loadUsers()
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
            label: t('admin.users.flow.menu.ban'),
            icon: 'mdi mdi-block-helper',
            command: () => batchBanUsers(),
        },
        {
            label: t('admin.users.flow.menu.unban'),
            icon: 'mdi mdi-check-circle',
            command: () => batchUnbanUsers(),
        },
        {
            label: t('admin.users.flow.menu.delete'),
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
        /* 支持从登录事件的用户链接 /admin/users?userId=<id> 直达 */
        const userId = route.query.userId
        if (typeof userId === 'string' && userId.trim()) {
            initialUserId.value = userId.trim()
            searchQuery.value = initialUserId.value
        }
        loadUsers()
    })

    /* 选择角色 / 状态即退出单用户深链，避免两种筛选互相覆盖 */
    watch([selectedRole, selectedStatus], () => {
        if (!initialUserId.value) {
            return
        }
        initialUserId.value = ''
        searchQuery.value = ''
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
