/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/sso/audit.get'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { isUserAdmin } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/check-admin', () => ({
    checkAdmin: vi.fn(),
}))

vi.mock('@/server/utils/admin-role-sync', () => ({
    isUserAdmin: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

describe('server/api/admin/sso/audit.get', () => {
    const providerRepo = { find: vi.fn() }
    const userRepo = { find: vi.fn() }
    const accountRepo = { find: vi.fn() }

    const adminOwnedProvider = {
        id: 'p-admin',
        providerId: 'corp-idp',
        name: 'Corp',
        domain: 'corp.example',
        issuer: 'https://corp.example',
        userId: 'admin-1',
        enabled: true,
        createdAt: new Date('2026-01-01'),
    }

    const attackerOwnedProvider = {
        id: 'p-evil',
        providerId: 'evil-idp',
        name: 'Evil',
        domain: 'victim.example',
        issuer: 'https://evil.example',
        userId: 'user-1',
        enabled: true,
        createdAt: new Date('2026-10-01'),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
            const name = typeof entity === 'string' ? entity : entity?.name
            if (name === 'Account') {
                return accountRepo as any
            }
            if (name === 'User') {
                return userRepo as any
            }
            return providerRepo as any
        })
        vi.mocked(checkAdmin).mockResolvedValue({ success: true } as any)
        vi.mocked(isUserAdmin).mockImplementation((user: any) => user?.role === 'admin')
    })

    it('只把非管理员所有者的提供商与相关账号链接标记为可疑', async () => {
        providerRepo.find.mockResolvedValue([adminOwnedProvider, attackerOwnedProvider])
        userRepo.find.mockResolvedValue([
            { id: 'admin-1', role: 'admin' },
            { id: 'user-1', role: 'user' },
        ])
        accountRepo.find.mockResolvedValue([
            { id: 'a1', userId: 'victim-1', providerId: 'evil-idp', accountId: 'attacker-sub', createdAt: new Date() },
        ])

        const result = await handler({} as any) as any

        expect(result.success).toBe(true)
        expect(result.data.totalProviders).toBe(2)
        expect(result.data.suspiciousProviders).toEqual([attackerOwnedProvider])
        expect(result.data.suspiciousAccounts).toHaveLength(1)
        expect(providerRepo.find).toHaveBeenCalledWith({
            select: expect.not.arrayContaining(['clientSecret', 'oidcConfig', 'samlConfig']),
        })
        expect(accountRepo.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { providerId: expect.anything() },
            select: expect.not.arrayContaining(['accessToken', 'refreshToken', 'idToken']),
        }))
    })

    it('所有提供商都属于管理员时不查询账号链接', async () => {
        providerRepo.find.mockResolvedValue([adminOwnedProvider])
        userRepo.find.mockResolvedValue([{ id: 'admin-1', role: 'admin' }])

        const result = await handler({} as any) as any

        expect(result.data.suspiciousProviders).toEqual([])
        expect(result.data.suspiciousAccounts).toEqual([])
        expect(accountRepo.find).not.toHaveBeenCalled()
    })

    it('所有者缺失的提供商同样视为可疑', async () => {
        providerRepo.find.mockResolvedValue([{ ...attackerOwnedProvider, userId: 'deleted-user' }])
        userRepo.find.mockResolvedValue([])
        accountRepo.find.mockResolvedValue([])

        const result = await handler({} as any) as any

        expect(result.data.suspiciousProviders).toHaveLength(1)
    })

    it('查询失败时返回 500 并记录日志', async () => {
        providerRepo.find.mockRejectedValue(new Error('db down'))

        await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
        expect(logger.error).toHaveBeenCalled()
    })
})
