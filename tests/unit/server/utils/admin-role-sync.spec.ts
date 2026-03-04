import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkAndSyncAdminRole, checkAndSyncAdminRoleWithUser, isUserAdmin, setUserAdminRole, removeUserAdminRole } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'
import type { User } from '@/server/entities/user'

// Hoist mocks
const { adminUserIds, getRepositoryMock, findOneMock, saveMock } = vi.hoisted(() => ({
    adminUserIds: ['admin-user'],
    getRepositoryMock: vi.fn(),
    findOneMock: vi.fn(),
    saveMock: vi.fn(),
}))

// Mock dependencies
vi.mock('@/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/shared/env')>()
    return {
        ...actual,
        ADMIN_USER_IDS: adminUserIds,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: getRepositoryMock,
    },
}))

// Unmock logger to use global mock
// vi.unmock('@/server/utils/logger') // Not needed if setup mocks it globally and we want to use that mock

describe('Server Utils: Admin Role Sync', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getRepositoryMock.mockReturnValue({
            findOne: findOneMock,
            save: saveMock,
        })
    })

    describe('checkAndSyncAdminRole', () => {
        it('should return false if user does not exist', async () => {
            findOneMock.mockResolvedValue(null)

            const result = await checkAndSyncAdminRole('non-existent-user')

            expect(result).toBe(false)
            expect(findOneMock).toHaveBeenCalledWith({ where: { id: 'non-existent-user' } })
        })

        it('should sync admin role if user exists', async () => {
            const user = { id: 'admin-user', role: 'user', email: 'admin@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await checkAndSyncAdminRole('admin-user')

            expect(result).toBe(true)
            expect(user.role).toContain('admin')
            expect(saveMock).toHaveBeenCalledWith(user)
        })

        it('should handle errors gracefully', async () => {
            findOneMock.mockRejectedValue(new Error('DB Error'))

            const result = await checkAndSyncAdminRole('user-1')

            expect(result).toBe(false)
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('检查和同步管理员角色失败'),
                expect.any(Object),
            )
        })
    })

    describe('checkAndSyncAdminRoleWithUser', () => {
        it('promotes users listed in ADMIN_USER_IDS even if role is missing', async () => {
            const user = { id: 'admin-user', role: 'user', email: 'admin@example.com' } as User

            const result = await checkAndSyncAdminRoleWithUser(user)

            expect(result).toBe(true)
            expect(user.role?.split(',')).toContain('admin')
            expect(saveMock).toHaveBeenCalledWith(user)
            expect(logger.business.userRegistered).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'admin-user',
                provider: 'auto-admin-sync',
            }))
        })

        it('returns true when user already carries admin role without extra persistence', async () => {
            const user = { id: 'other-user', role: 'user,admin', email: 'other@example.com' } as User

            const result = await checkAndSyncAdminRoleWithUser(user)

            expect(result).toBe(true)
            expect(saveMock).not.toHaveBeenCalled()
        })

        it('returns false when user is not admin by id or role', async () => {
            const user = { id: 'regular-user', role: 'user', email: 'regular@example.com' } as User

            const result = await checkAndSyncAdminRoleWithUser(user)

            expect(result).toBe(false)
            expect(saveMock).not.toHaveBeenCalled()
        })
    })

    describe('isUserAdmin', () => {
        it('mirrors both env whitelist and assigned roles', () => {
            expect(isUserAdmin({ role: null }, 'admin-user')).toBe(true)
            expect(isUserAdmin({ role: 'member,admin' }, 'someone')).toBe(true)
            expect(isUserAdmin({ role: 'member' }, 'guest')).toBe(false)
        })
    })

    describe('setUserAdminRole', () => {
        it('should return false if user does not exist', async () => {
            findOneMock.mockResolvedValue(null)

            const result = await setUserAdminRole('non-existent-user')

            expect(result).toBe(false)
        })

        it('should add admin role to user without roles', async () => {
            const user = { id: 'user-1', role: null, email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await setUserAdminRole('user-1')

            expect(result).toBe(true)
            expect(user.role).toContain('admin')
            expect(saveMock).toHaveBeenCalledWith(user)
        })

        it('should add admin role to user with existing roles', async () => {
            const user = { id: 'user-1', role: 'user', email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await setUserAdminRole('user-1')

            expect(result).toBe(true)
            expect(user.role).toContain('admin')
            expect(user.role).toContain('user')
        })

        it('should not duplicate admin role if already present', async () => {
            const user = { id: 'user-1', role: 'user,admin', email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await setUserAdminRole('user-1')

            expect(result).toBe(true)
            // Should not call save since role already exists
            expect(saveMock).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            findOneMock.mockRejectedValue(new Error('DB Error'))

            const result = await setUserAdminRole('user-1')

            expect(result).toBe(false)
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('设置管理员角色失败'),
                expect.any(Object),
            )
        })
    })

    describe('removeUserAdminRole', () => {
        it('should return false if user does not exist', async () => {
            findOneMock.mockResolvedValue(null)

            const result = await removeUserAdminRole('non-existent-user')

            expect(result).toBe(false)
        })

        it('should prevent user from removing their own admin role', async () => {
            const result = await removeUserAdminRole('user-1', 'user-1')

            expect(result).toBe(false)
            expect(logger.security.permissionDenied).toHaveBeenCalledWith({
                userId: 'user-1',
                resource: 'admin_role',
                action: 'remove_self',
            })
        })

        it('should remove admin role and keep other roles', async () => {
            const user = { id: 'user-1', role: 'user,admin,moderator', email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await removeUserAdminRole('user-1', 'admin-1')

            expect(result).toBe(true)
            expect(user.role).not.toContain('admin')
            expect(user.role).toContain('user')
            expect(user.role).toContain('moderator')
            expect(saveMock).toHaveBeenCalledWith(user)
        })

        it('should set user role if no other roles remain', async () => {
            const user = { id: 'user-1', role: 'admin', email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await removeUserAdminRole('user-1', 'admin-1')

            expect(result).toBe(true)
            expect(user.role).toBe('user')
        })

        it('should handle null role by setting user role', async () => {
            const user = { id: 'user-1', role: null, email: 'user@example.com' }
            findOneMock.mockResolvedValue(user)
            saveMock.mockResolvedValue(user)

            const result = await removeUserAdminRole('user-1', 'admin-1')

            expect(result).toBe(true)
            expect(user.role).toBe('user')
        })

        it('should handle errors gracefully', async () => {
            findOneMock.mockRejectedValue(new Error('DB Error'))

            const result = await removeUserAdminRole('user-1', 'admin-1')

            expect(result).toBe(false)
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('移除管理员角色失败'),
                expect.any(Object),
            )
        })
    })
})
