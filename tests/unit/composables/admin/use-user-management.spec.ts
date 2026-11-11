import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUserManagement } from '@/composables/admin/use-user-management'
import { authClient } from '@/lib/auth-client'
import { syncAdminRole } from '@/utils/web/admin-role-client'
import type { AdminUserProfile } from '@/types/admin'

/** 用户夹具：省略字段时补齐列表接口必返的 `email` / `createdAt` */
const buildUser = (overrides: Partial<AdminUserProfile> & { id: string }): AdminUserProfile => ({
    email: 'test@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
})

// Mock dependencies
const toast = {
    success: vi.fn(),
    danger: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    show: vi.fn(),
}
const confirm = { open: vi.fn() }

vi.mock('caomei-ui', () => ({
    useToast: () => toast,
    useConfirm: () => confirm,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => ref({ data: { user: { id: 'admin-id' } } })),
        admin: {
            listUsers: vi.fn(),
            unbanUser: vi.fn(),
            removeUser: vi.fn(),
            banUser: vi.fn(),
        },
    },
}))

vi.mock('@/utils/web/admin-role-client', () => ({
    syncAdminRole: vi.fn(),
}))

// Mock Vue onMounted to execute immediately
vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>()
    return {
        ...actual,
        onMounted: (fn: () => void) => fn(),
    }
})

describe('useUserManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mock implementation for listUsers
        ;(authClient.admin.listUsers as any).mockResolvedValue({
            data: { users: [], total: 0 },
        })
        // 确认框默认「确认」
        confirm.open.mockResolvedValue(true)
    })

    it('initializes correctly', () => {
        const { loading, users, totalUsers } = useUserManagement()
        expect(loading.value).toBe(true) // Starts loading immediately
        expect(users.value).toEqual([])
        expect(totalUsers.value).toBe(0)
    })

    it('fetches users with correct params', async () => {
        const { loadUsers } = useUserManagement()

        await loadUsers()

        expect(authClient.admin.listUsers).toHaveBeenCalledWith({
            query: expect.objectContaining({
                limit: 10,
                offset: 0,
            }),
        })
    })

    it('handles search query correctly (email)', async () => {
        const { searchQuery, loadUsers } = useUserManagement()

        searchQuery.value = 'test@example.com'
        await loadUsers()

        expect(authClient.admin.listUsers).toHaveBeenCalledWith({
            query: expect.objectContaining({
                searchField: 'email',
                searchValue: 'test@example.com',
                searchOperator: 'contains',
            }),
        })
    })

    it('handles search query correctly (username with @)', async () => {
        const { searchQuery, loadUsers } = useUserManagement()

        searchQuery.value = '@testuser'
        await loadUsers()

        expect(authClient.admin.listUsers).toHaveBeenCalledWith({
            query: expect.objectContaining({
                searchField: 'name',
                searchValue: 'testuser',
                searchOperator: 'contains',
            }),
        })
    })

    it('handles filters correctly', async () => {
        const { selectedRole, loadUsers } = useUserManagement()

        selectedRole.value = 'admin'
        await loadUsers()

        expect(authClient.admin.listUsers).toHaveBeenCalledWith({
            query: expect.objectContaining({
                filterField: 'role',
                filterOperator: 'eq',
                filterValue: 'admin',
            }),
        })
    })

    it('handles multiple filters correctly', async () => {
        const { selectedRole, selectedStatus, loadUsers } = useUserManagement()

        selectedRole.value = 'admin'
        selectedStatus.value = 'banned'
        await loadUsers()

        expect(authClient.admin.listUsers).toHaveBeenCalledWith({
            query: expect.objectContaining({
                filters: expect.arrayContaining([
                    { field: 'role', operator: 'eq', value: 'admin' },
                    { field: 'banned', operator: 'eq', value: true },
                ]),
            }),
        })
    })

    describe('User Operations', () => {
        it('should unban user successfully', async () => {
            ;(authClient.admin.unbanUser as any).mockResolvedValue({ data: { success: true } })

            const { unbanUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await unbanUser(mockUser)

            expect(authClient.admin.unbanUser).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
                title: '解禁成功',
            }))
        })

        it('should handle unban user error', async () => {
            ;(authClient.admin.unbanUser as any).mockRejectedValue(new Error('Unban failed'))

            const { unbanUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await unbanUser(mockUser)

            expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({
                title: '解禁失败',
                description: 'Unban failed',
            }))
        })

        it('should prevent deleting current user', async () => {
            const { deleteUser } = useUserManagement()
            const mockUser = buildUser({ id: 'admin-id', name: 'Admin', email: 'admin@example.com' })

            await deleteUser(mockUser, true)

            expect(toast.warning).toHaveBeenCalledWith(expect.objectContaining({
                title: '操作不允许',
            }))
            expect(confirm.open).not.toHaveBeenCalled()
        })

        it('should show confirmation dialog for delete user', async () => {
            const { deleteUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await deleteUser(mockUser, false)

            expect(confirm.open).toHaveBeenCalledWith(expect.objectContaining({
                title: '确认删除',
                tone: 'danger',
            }))
        })

        it('should delete user after confirmation', async () => {
            ;(authClient.admin.removeUser as any).mockResolvedValue({ data: { success: true } })

            const { deleteUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await deleteUser(mockUser, false)

            expect(authClient.admin.removeUser).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
                title: '删除成功',
            }))
        })

        it('should not delete user when confirmation is rejected', async () => {
            confirm.open.mockResolvedValue(false)

            const { deleteUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await deleteUser(mockUser, false)

            expect(authClient.admin.removeUser).not.toHaveBeenCalled()
            expect(toast.success).not.toHaveBeenCalled()
        })

        it('should handle delete user error', async () => {
            ;(authClient.admin.removeUser as any).mockRejectedValue(new Error('Remove failed'))

            const { deleteUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await deleteUser(mockUser, false)

            expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({
                title: '删除失败',
                description: 'Remove failed',
            }))
        })
    })

    describe('Admin Role Sync', () => {
        it('should sync admin role successfully', async () => {
            ;(syncAdminRole as any).mockResolvedValue({ success: true, message: 'Synced' })

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await syncUserAdminRoleAction(mockUser)

            expect(syncAdminRole).toHaveBeenCalledWith('user-1')
            expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
                title: '同步成功',
            }))
        })

        it('should handle sync admin role warning', async () => {
            ;(syncAdminRole as any).mockResolvedValue({ success: false, message: 'Already synced' })

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await syncUserAdminRoleAction(mockUser)

            expect(toast.warning).toHaveBeenCalledWith(expect.objectContaining({
                title: '同步完成',
            }))
        })

        it('should handle sync admin role error', async () => {
            ;(syncAdminRole as any).mockRejectedValue(new Error('Sync failed'))

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test User' })

            await syncUserAdminRoleAction(mockUser)

            expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({
                title: '同步失败',
            }))
        })
    })

    describe('Batch Operations', () => {
        it('should not batch ban users when none selected', async () => {
            const { batchBanUsers } = useUserManagement()

            await batchBanUsers()

            expect(confirm.open).not.toHaveBeenCalled()
        })

        it('should show confirmation for batch ban', async () => {
            const { batchBanUsers, selectedUsers } = useUserManagement()
            selectedUsers.value = [buildUser({ id: 'user-1', email: 'a@example.com' }), buildUser({ id: 'user-2', email: 'b@example.com' })]

            await batchBanUsers()

            expect(confirm.open).toHaveBeenCalledWith(expect.objectContaining({
                title: '确认批量禁用',
                tone: 'danger',
            }))
        })

        it('should batch ban users after confirmation', async () => {
            ;(authClient.admin.banUser as any).mockResolvedValue({ data: { success: true } })

            const { batchBanUsers, selectedUsers } = useUserManagement()
            selectedUsers.value = [buildUser({ id: 'user-1', email: 'a@example.com' }), buildUser({ id: 'user-2', email: 'b@example.com' })]

            await batchBanUsers()

            expect(authClient.admin.banUser).toHaveBeenCalledTimes(2)
            expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
                title: '禁用成功',
            }))
        })

        it('should not batch unban users when none selected', async () => {
            const { batchUnbanUsers } = useUserManagement()

            await batchUnbanUsers()

            expect(confirm.open).not.toHaveBeenCalled()
        })

        it('should not batch delete users when none selected', async () => {
            const { batchDeleteUsers } = useUserManagement()

            await batchDeleteUsers()

            expect(confirm.open).not.toHaveBeenCalled()
        })
    })

    describe('Dialog Operations', () => {
        it('should open ban dialog', () => {
            const { openBanDialog, showBanDialog, currentUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test' })

            openBanDialog(mockUser)

            expect(showBanDialog.value).toBe(true)
            expect(currentUser.value).toEqual(mockUser)
        })

        it('should open sessions dialog', () => {
            const { openSessionsDialog, showSessionsDialog, currentUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test' })

            openSessionsDialog(mockUser)

            expect(showSessionsDialog.value).toBe(true)
            expect(currentUser.value).toEqual(mockUser)
        })

        it('should open detail dialog', () => {
            const { openDetailDialog, showDetailDialog, currentUser } = useUserManagement()
            const mockUser = buildUser({ id: 'user-1', name: 'Test' })

            openDetailDialog(mockUser)

            expect(showDetailDialog.value).toBe(true)
            expect(currentUser.value).toEqual(mockUser)
        })
    })

    describe('Utility Functions', () => {
        it('should identify current user correctly', () => {
            const { isCurrentUser } = useUserManagement()

            expect(isCurrentUser('admin-id')).toBe(true)
            expect(isCurrentUser('other-user')).toBe(false)
        })

        it('should refresh users and reset filters', async () => {
            const { refreshUsers, searchQuery, selectedRole, selectedStatus, sortField, sortOrder, currentPage } = useUserManagement()

            searchQuery.value = 'test'
            selectedRole.value = 'admin'
            selectedStatus.value = 'banned'
            sortField.value = 'name'
            sortOrder.value = 'asc'
            currentPage.value = 5

            refreshUsers()

            expect(searchQuery.value).toBe('')
            expect(selectedRole.value).toBe(null)
            expect(selectedStatus.value).toBe(null)
            expect(sortField.value).toBe('createdAt')
            expect(sortOrder.value).toBe('desc')
            expect(currentPage.value).toBe(0)
        })
    })

    describe('Search by name', () => {
        it('handles search query correctly (name)', async () => {
            const { searchQuery, loadUsers } = useUserManagement()

            searchQuery.value = 'John Doe'
            await loadUsers()

            expect(authClient.admin.listUsers).toHaveBeenCalledWith({
                query: expect.objectContaining({
                    searchField: 'name',
                    searchValue: 'John Doe',
                    searchOperator: 'contains',
                }),
            })
        })
    })
})
