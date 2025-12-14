import { describe, it, expect, vi, beforeEach } from 'vitest'
import statsHandler from '@/server/api/admin/logs/stats.get'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { User } from '@/server/entities/user'
import { Session } from '@/server/entities/session'
import { Account } from '@/server/entities/account'

// Mock dependencies
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/check-admin', () => ({
    checkAdmin: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        business: {
            oauthAppListFailed: vi.fn(), // Note: stats.get.ts doesn't seem to use this, but good to have generic mock
        },
        error: vi.fn(),
    },
}))

describe('server/api/admin/logs/stats.get', () => {
    let mockUserRepo: any
    let mockSessionRepo: any
    let mockAccountRepo: any
    let mockQueryBuilder: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Setup Mock QueryBuilder
        mockQueryBuilder = {
            where: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            addSelect: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getCount: vi.fn(),
            getRawOne: vi.fn(),
            getRawMany: vi.fn(),
        }

        // Setup Repos
        mockUserRepo = {
            count: vi.fn(),
        }
        mockSessionRepo = {
            count: vi.fn(),
            createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        mockAccountRepo = {
            createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
        }

        // Setup dataSource.getRepository behavior
        vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
            if (entity === User) {
                return mockUserRepo
            }
            if (entity === Session) {
                return mockSessionRepo
            }
            if (entity === Account) {
                return mockAccountRepo
            }
            return {} as any
        })
    })

    it('should return stats data successfully for admin', async () => {
        // Mock Admin Check
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)

        // Mock Data Returns
        mockUserRepo.count.mockResolvedValue(100) // totalUsers
        mockSessionRepo.count.mockResolvedValue(500) // totalSessions

        // Sequence for Session Repo QueryBuilder calls:
        // 1. activeSessions (getCount)
        // 2. todaySessions (getCount)
        // 3. yesterdaySessions (getCount)
        // 4. weekSessions (getCount)
        // 5. monthSessions (getCount)
        // 6. activeUsers (getRawOne)
        // 7. dailyTrend (getRawMany)
        mockQueryBuilder.getCount
            .mockResolvedValueOnce(50) // activeSessions
            .mockResolvedValueOnce(10) // todaySessions
            .mockResolvedValueOnce(8) // yesterdaySessions
            .mockResolvedValueOnce(60) // weekSessions
            .mockResolvedValueOnce(200) // monthSessions

        mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '30' }) // activeUsers

        const mockDailyTrend = [{ date: '2023-01-01', count: '5' }]
        mockQueryBuilder.getRawMany
            .mockResolvedValueOnce([{ provider: 'github', count: '10' }]) // providerStats (Account Repo)
            .mockResolvedValueOnce(mockDailyTrend) // dailyTrend (Session Repo)

        // Note: Account repo is called before activeUsers/dailyTrend in the code?
        // Let's check the code order:
        // 1. User.count
        // 2. Session.count
        // 3. Session.activeSessions (QB)
        // 4. Session.todaySessions (QB)
        // 5. Session.yesterdaySessions (QB)
        // 6. Session.weekSessions (QB)
        // 7. Session.monthSessions (QB)
        // 8. Account.providerStats (QB) -> getRawMany
        // 9. Session.activeUsers (QB) -> getRawOne
        // 10. Session.dailyTrend (QB) -> getRawMany

        // So getRawMany is called twice. Once for Account, once for Session.
        // Since we use the SAME mockQueryBuilder object for both repos, the sequence matters across repos.
        // Order:
        // ... getCount x 5 ...
        // Account.getRawMany (providerStats)
        // Session.getRawOne (activeUsers)
        // Session.getRawMany (dailyTrend)

        // Re-setup getRawMany to match this order
        mockQueryBuilder.getRawMany = vi.fn()
            .mockResolvedValueOnce([{ provider: 'github', count: '10' }]) // First call: providerStats
            .mockResolvedValueOnce(mockDailyTrend) // Second call: dailyTrend

        const event = {} as any
        const result = await statsHandler(event)

        expect(result).toEqual({
            success: true,
            data: {
                overview: {
                    totalUsers: 100,
                    totalSessions: 500,
                    activeSessions: 50,
                    activeUsers: 30,
                },
                periods: {
                    today: 10,
                    yesterday: 8,
                    week: 60,
                    month: 200,
                },
                providers: [{ provider: 'github', count: 10 }],
                trend: [{ date: '2023-01-01', count: 5 }],
            },
        })

        expect(checkAdmin).toHaveBeenCalledWith(event)
        expect(mockUserRepo.count).toHaveBeenCalled()
        expect(mockSessionRepo.count).toHaveBeenCalled()
        expect(mockQueryBuilder.where).toHaveBeenCalledTimes(7) // 5 sessions + 1 activeUsers + 1 dailyTrend
    })

    it('should handle errors gracefully', async () => {
        const error = new Error('Database connection failed')
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)
        mockUserRepo.count.mockRejectedValue(error)

        const event = {} as any

        await expect(statsHandler(event)).rejects.toThrow('获取登录统计失败')

        // Verify logger was called
        // Note: The logger mock structure needs to match what's imported.
        // In the file: import logger from '@/server/utils/logger'
        // Usage: logger.error(...)
        // In mock: default: { error: vi.fn() }
        // So we check the mock.
        const loggerModule = await import('@/server/utils/logger')
        expect(loggerModule.default.error).toHaveBeenCalledWith('Failed to get login stats', expect.objectContaining({
            error: 'Database connection failed',
        }))
    })
})
