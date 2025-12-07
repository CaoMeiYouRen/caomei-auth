import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAndSyncAdminRoleWithUser, isUserAdmin } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'
import type { User } from '@/server/entities/user'

const { adminUserIds, getRepositoryMock, saveMock } = vi.hoisted(() => ({
    adminUserIds: ['admin-user'],
    getRepositoryMock: vi.fn(),
    saveMock: vi.fn(),
}))

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

type MockUser = {
    id: string
    email: string
    role?: string | null
}

const buildUser = (overrides: Partial<MockUser> = {}): MockUser => ({
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    ...overrides,
})

beforeEach(() => {
    saveMock.mockReset()
    getRepositoryMock.mockReturnValue({ save: saveMock })
})

describe('server/utils/admin-role-sync', () => {
    it('promotes users listed in ADMIN_USER_IDS even if role is missing', async () => {
        const user = buildUser({ id: 'admin-user', role: 'user' })

        const result = await checkAndSyncAdminRoleWithUser(user as unknown as User)

        expect(result).toBe(true)
        expect(user.role?.split(',')).toContain('admin')
        expect(saveMock).toHaveBeenCalledWith(user)
        expect(logger.business.userRegistered).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'admin-user',
            provider: 'auto-admin-sync',
        }))
    })

    it('returns true when user already carries admin role without extra persistence', async () => {
        const user = buildUser({ id: 'other-user', role: 'user,admin' })

        const result = await checkAndSyncAdminRoleWithUser(user as unknown as User)

        expect(result).toBe(true)
        expect(saveMock).not.toHaveBeenCalled()
    })

    it('returns false when user is not admin by id or role', async () => {
        const user = buildUser({ id: 'regular-user', role: 'user' })

        const result = await checkAndSyncAdminRoleWithUser(user as unknown as User)

        expect(result).toBe(false)
        expect(saveMock).not.toHaveBeenCalled()
    })

    it('isUserAdmin mirrors both env whitelist and assigned roles', () => {
        expect(isUserAdmin({ role: null }, 'admin-user')).toBe(true)
        expect(isUserAdmin({ role: 'member,admin' }, 'someone')).toBe(true)
        expect(isUserAdmin({ role: 'member' }, 'guest')).toBe(false)
    })
})
