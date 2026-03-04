import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUserManagement } from '@/composables/admin/use-user-management'
import { authClient } from '@/lib/auth-client'
import { syncAdminRole } from '@/utils/web/admin-role-client'

// Mock dependencies
const toast = { add: vi.fn() }
const confirm = { require: vi.fn() }

vi.mock('primevue/usetoast', () => ({
    useToast: () => toast,
}))

vi.mock('primevue/useconfirm', () => ({
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

            const { unbanUser, loadUsers } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

            await unbanUser(mockUser)

            expect(authClient.admin.unbanUser).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
                summary: '解禁成功',
            }))
        })

        it('should handle unban user error', async () => {
            ;(authClient.admin.unbanUser as any).mockRejectedValue(new Error('Unban failed'))

            const { unbanUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

            await unbanUser(mockUser)

            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: '解禁失败',
            }))
        })

        it('should prevent deleting current user', async () => {
            const { deleteUser } = useUserManagement()
            const mockUser = { id: 'admin-id', name: 'Admin', email: 'admin@example.com' }

            await deleteUser(mockUser, true)

            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warn',
                summary: '操作不允许',
            }))
            expect(confirm.require).not.toHaveBeenCalled()
        })

        it('should show confirmation dialog for delete user', async () => {
            const { deleteUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

            await deleteUser(mockUser, false)

            expect(confirm.require).toHaveBeenCalledWith(expect.objectContaining({
                header: '确认删除',
            }))
        })

        it('should delete user after confirmation', async () => {
            ;(authClient.admin.removeUser as any).mockResolvedValue({ data: { success: true } })

            const { deleteUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

            await deleteUser(mockUser, false)

            // Get the accept callback from the confirmation
            const confirmCall = confirm.require.mock.calls[0]![0]!
            await confirmCall.accept()

            expect(authClient.admin.removeUser).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
                summary: '删除成功',
            }))
        })
    })

    describe('Admin Role Sync', () => {
        it('should sync admin role successfully', async () => {
            ;(syncAdminRole as any).mockResolvedValue({ success: true, message: 'Synced' })

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User' }

            await syncUserAdminRoleAction(mockUser)

            expect(syncAdminRole).toHaveBeenCalledWith('user-1')
            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
                summary: '同步成功',
            }))
        })

        it('should handle sync admin role warning', async () => {
            ;(syncAdminRole as any).mockResolvedValue({ success: false, message: 'Already synced' })

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User' }

            await syncUserAdminRoleAction(mockUser)

            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warning',
                summary: '同步完成',
            }))
        })

        it('should handle sync admin role error', async () => {
            ;(syncAdminRole as any).mockRejectedValue(new Error('Sync failed'))

            const { syncUserAdminRoleAction } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test User' }

            await syncUserAdminRoleAction(mockUser)

            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: '同步失败',
            }))
        })
    })

    describe('Batch Operations', () => {
        it('should not batch ban users when none selected', async () => {
            const { batchBanUsers } = useUserManagement()

            await batchBanUsers()

            expect(confirm.require).not.toHaveBeenCalled()
        })

        it('should show confirmation for batch ban', async () => {
            const { batchBanUsers, selectedUsers } = useUserManagement()
            selectedUsers.value = [{ id: 'user-1' }, { id: 'user-2' }]

            await batchBanUsers()

            expect(confirm.require).toHaveBeenCalledWith(expect.objectContaining({
                header: '确认批量禁用',
            }))
        })

        it('should batch ban users after confirmation', async () => {
            ;(authClient.admin.banUser as any).mockResolvedValue({ data: { success: true } })

            const { batchBanUsers, selectedUsers } = useUserManagement()
            selectedUsers.value = [{ id: 'user-1' }, { id: 'user-2' }]

            await batchBanUsers()

            const confirmCall = confirm.require.mock.calls[0]![0]!
            await confirmCall.accept()

            expect(authClient.admin.banUser).toHaveBeenCalledTimes(2)
            expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
                summary: '禁用成功',
            }))
        })

        it('should not batch unban users when none selected', async () => {
            const { batchUnbanUsers } = useUserManagement()

            await batchUnbanUsers()

            expect(confirm.require).not.toHaveBeenCalled()
        })

        it('should not batch delete users when none selected', async () => {
            const { batchDeleteUsers } = useUserManagement()

            await batchDeleteUsers()

            expect(confirm.require).not.toHaveBeenCalled()
        })
    })

    describe('Dialog Operations', () => {
        it('should open ban dialog', () => {
            const { openBanDialog, showBanDialog, currentUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test' }

            openBanDialog(mockUser)

            expect(showBanDialog.value).toBe(true)
            expect(currentUser.value).toEqual(mockUser)
        })

        it('should open sessions dialog', () => {
            const { openSessionsDialog, showSessionsDialog, currentUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test' }

            openSessionsDialog(mockUser)

            expect(showSessionsDialog.value).toBe(true)
            expect(currentUser.value).toEqual(mockUser)
        })

        it('should open detail dialog', () => {
            const { openDetailDialog, showDetailDialog, currentUser } = useUserManagement()
            const mockUser = { id: 'user-1', name: 'Test' }

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
