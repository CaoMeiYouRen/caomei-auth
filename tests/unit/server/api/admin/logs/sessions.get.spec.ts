import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getQuery } from 'h3'
import handler from '@/server/api/admin/logs/sessions.get'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { isDemoMode, generateDemoSessions } from '@/server/utils/demo-data-generator'
import logger from '@/server/utils/logger'
import { parseUserAgent } from '@/utils/shared/useragent'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        getQuery: vi.fn(),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/check-admin', () => ({
    checkAdmin: vi.fn(),
}))

vi.mock('@/server/utils/demo-data-generator', () => ({
    isDemoMode: vi.fn(),
    generateDemoSessions: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        business: {
            sessionLogQueryFailed: vi.fn(),
        },
        error: vi.fn(),
    },
}))

vi.mock('@/utils/shared/useragent', () => ({
    parseUserAgent: vi.fn(),
}))

describe('server/api/admin/logs/sessions.get', () => {
    const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getCount: vi.fn(),
        getMany: vi.fn(),
    }

    const mockRepo = {
        createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Setup default mocks
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(checkAdmin).mockResolvedValue({
            success: true,
            message: 'Authorized',
            data: { userId: 'admin-123' },
        } as any)
        vi.mocked(isDemoMode).mockReturnValue(false)
        vi.mocked(parseUserAgent).mockReturnValue({ browser: 'Chrome', os: 'Windows' })
        vi.mocked(getQuery).mockReturnValue({})
    })

    describe('Demo Mode', () => {
        beforeEach(() => {
            vi.mocked(isDemoMode).mockReturnValue(true)
        })

        it('should return generated demo sessions', async () => {
            const mockSessions = [
                {
                    id: 'session-1',
                    userId: 'user-1',
                    user: { name: 'User 1', email: 'user1@example.com' },
                    loginTime: new Date(),
                    isActive: true,
                    ipAddress: '127.0.0.1',
                },
            ]
            vi.mocked(generateDemoSessions).mockReturnValue(mockSessions as any)
            vi.mocked(getQuery).mockReturnValue({ page: 1, limit: 10 })

            const event = {
                context: {},
            }

            const result = await handler(event as any)

            expect(result.success).toBe(true)
            expect(result.data.sessions).toEqual(mockSessions)
            expect(result.data.pagination.total).toBe(1)
        })

        it('should filter demo sessions by userId', async () => {
            const mockSessions = [
                { id: 's1', userId: 'u1', user: { name: 'U1' } },
                { id: 's2', userId: 'u2', user: { name: 'U2' } },
            ]
            vi.mocked(generateDemoSessions).mockReturnValue(mockSessions as any)
            vi.mocked(getQuery).mockReturnValue({ userId: 'u1' })

            const event = {
                context: {},
            }

            const result = await handler(event as any)

            expect(result.data?.sessions).toHaveLength(1)
            expect(result.data?.sessions[0]?.userId).toBe('u1')
        })
    })

    describe('Real Mode', () => {
        it('should fetch sessions from database', async () => {
            const mockSessions = [
                {
                    id: 'session-1',
                    userId: 'user-1',
                    user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 3600000),
                    userAgent: 'Mozilla/5.0',
                    ipAddress: '127.0.0.1',
                    token: 'token-123',
                },
            ]

            mockQueryBuilder.getCount.mockResolvedValue(1)
            mockQueryBuilder.getMany.mockResolvedValue(mockSessions)
            vi.mocked(getQuery).mockReturnValue({ page: 1, limit: 10 })

            const event = {
                context: {},
            }

            const result = await handler(event as any)

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('session')
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('session.user', 'user')
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('session.createdAt', 'DESC')
            expect(result.success).toBe(true)
            expect(result.data!.sessions).toHaveLength(1)
            expect(result.data!.sessions[0]!.id).toBe('session-1')
        })

        it('should apply filters correctly', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0)
            mockQueryBuilder.getMany.mockResolvedValue([])
            vi.mocked(getQuery).mockReturnValue({
                userId: 'u1',
                search: 'test',
                status: 'active',
                startDate: '2023-01-01',
                endDate: '2023-01-31',
            })

            const event = {
                context: {},
            }

            await handler(event as any)

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.userId = :userId', { userId: 'u1' })
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(user.name LIKE :search OR user.email LIKE :search OR session.ipAddress LIKE :search)',
                { search: '%test%' },
            )
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.expiresAt > :now', expect.any(Object))
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.createdAt >= :startDate', expect.any(Object))
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.createdAt <= :endDate', expect.any(Object))
        })

        it('should handle database errors', async () => {
            const error = new Error('Database error')
            mockQueryBuilder.getCount.mockRejectedValue(error)

            const event = {
                context: {},
            }

            await expect(handler(event as any)).rejects.toThrow('获取登录日志失败')

            expect(logger.business.sessionLogQueryFailed).toHaveBeenCalled()
        })
    })
})
