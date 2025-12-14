import { describe, it, expect, vi, beforeEach } from 'vitest'
import { H3Event } from 'h3'
import handler from '@/server/api/admin/sync-admin-role.post'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import * as adminRoleSync from '@/server/utils/admin-role-sync'
import { adminRoleSyncSchema } from '@/utils/shared/schemas'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/admin-role-sync', () => ({
    checkAndSyncAdminRole: vi.fn(),
    checkAndSyncAdminRoleWithUser: vi.fn(),
    setUserAdminRole: vi.fn(),
    removeUserAdminRole: vi.fn(),
}))

vi.mock('@/server/utils/logger')

describe('server/api/admin/sync-admin-role.post', () => {
    let mockEvent: Partial<H3Event>
    let mockUserRepo: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockEvent = {
            headers: new Headers(),
        } as any

        mockUserRepo = {
            findOne: vi.fn(),
        }
        vi.mocked(dataSource.getRepository).mockReturnValue(mockUserRepo)
    })

    it('should throw 401 if user is not logged in', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(null)

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 401,
            message: '用户未登录',
        })
    })

    it('should throw 404 if current user not found in db', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'user-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue(null)

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 404,
            message: '当前用户不存在',
        })
    })

    it('should throw 403 if current user is not admin', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'user-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'user-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(false)

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 403,
            message: '仅管理员可以执行此操作',
        })
    })

    it('should throw 400 if body is invalid', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        // Mock readBody
        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            // missing action
        })

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Bad Request',
        })
    })

    it('should use default error message if validation fails without specific message', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({})
        // Mock safeParse to return failure but with weird error structure to trigger fallback
        vi.spyOn(adminRoleSyncSchema, 'safeParse').mockReturnValueOnce({
            success: false,
            error: { issues: [] } as any,
        })

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 400,
            message: '参数验证失败',
        })
    })

    it('should handle sync action', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.checkAndSyncAdminRole).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'sync',
        })

        const result = await handler(mockEvent as H3Event)

        expect(adminRoleSync.checkAndSyncAdminRole).toHaveBeenCalledWith('target-user')
        expect(result).toEqual({
            success: true,
            message: '管理员角色同步成功',
            data: {
                userId: 'target-user',
                action: 'sync',
            },
        })
    })

    it('should handle add action', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.setUserAdminRole).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'add',
        })

        const result = await handler(mockEvent as H3Event)

        expect(adminRoleSync.setUserAdminRole).toHaveBeenCalledWith('target-user')
        expect(result).toEqual({
            success: true,
            message: '管理员角色添加成功',
            data: {
                userId: 'target-user',
                action: 'add',
            },
        })
    })

    it('should handle remove action', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.removeUserAdminRole).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'remove',
        })

        const result = await handler(mockEvent as H3Event)

        expect(adminRoleSync.removeUserAdminRole).toHaveBeenCalledWith('target-user', 'admin-1')
        expect(result).toEqual({
            success: true,
            message: '管理员角色移除成功',
            data: {
                userId: 'target-user',
                action: 'remove',
            },
        })
    })

    it('should prevent removing self admin role', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'admin-1',
            action: 'remove',
        })

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 400,
            message: '不能移除自己的管理员权限',
        })
    })

    it('should handle sync action for self', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'admin-1',
            action: 'sync',
        })

        const result = await handler(mockEvent as H3Event)

        expect(adminRoleSync.checkAndSyncAdminRoleWithUser).toHaveBeenCalled()
        expect(result).toEqual({
            success: true,
            message: '管理员角色同步成功',
            data: {
                userId: 'admin-1',
                action: 'sync',
            },
        })
    })

    it('should throw error for invalid action (default case)', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'invalid-action',
        })

        // Mock schema validation to pass even for invalid action, to reach the default switch case
        const schemaSpy = vi.spyOn(adminRoleSyncSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { userId: 'target-user', action: 'invalid-action' },
        } as any)

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 500,
            message: '管理员角色操作失败',
        })

        schemaSpy.mockRestore()
    })

    it('should throw 500 if an unknown error occurs', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'sync',
        })

        vi.mocked(adminRoleSync.checkAndSyncAdminRole).mockRejectedValue(new Error('Database error'))

        await expect(handler(mockEvent as H3Event)).rejects.toMatchObject({
            statusCode: 500,
            message: '管理员角色操作失败',
        })
    })

    it('should handle sync failure', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.checkAndSyncAdminRole).mockResolvedValue(false)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'sync',
        })

        const result = await handler(mockEvent as H3Event)

        expect(result).toEqual({
            success: false,
            message: '同步失败，用户不存在或非管理员',
            data: {
                userId: 'target-user',
                action: 'sync',
            },
        })
    })

    it('should handle add failure', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.setUserAdminRole).mockResolvedValue(false)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'add',
        })

        const result = await handler(mockEvent as H3Event)

        expect(result).toEqual({
            success: false,
            message: '添加失败，用户不存在',
            data: {
                userId: 'target-user',
                action: 'add',
            },
        })
    })

    it('should handle remove failure', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'admin-1' },
        } as any)
        mockUserRepo.findOne.mockResolvedValue({ id: 'admin-1' })
        vi.mocked(adminRoleSync.checkAndSyncAdminRoleWithUser).mockResolvedValue(true)
        vi.mocked(adminRoleSync.removeUserAdminRole).mockResolvedValue(false)

        vi.spyOn(global as any, 'readBody').mockResolvedValue({
            userId: 'target-user',
            action: 'remove',
        })

        const result = await handler(mockEvent as H3Event)

        expect(result).toEqual({
            success: false,
            message: '移除失败，用户不存在或操作被拒绝',
            data: {
                userId: 'target-user',
                action: 'remove',
            },
        })
    })
})
