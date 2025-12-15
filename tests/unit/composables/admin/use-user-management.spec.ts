import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUserManagement } from '@/composables/admin/use-user-management'
import { authClient } from '@/lib/auth-client'

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
        },
    },
}))

vi.mock('@/utils/web/admin-role-client', () => ({
    syncAdminRole: vi.fn(),
}))

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
})
