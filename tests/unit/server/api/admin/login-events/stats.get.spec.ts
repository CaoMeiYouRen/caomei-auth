/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/login-events/stats.get'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError } from '@/server/utils/i18n'
import { getLoginEventStats } from '@/server/utils/login-events/repository'
import { pruneLoginEventsIfDue } from '@/server/utils/login-events/retention'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'

vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: vi.fn() }))
vi.mock('@/server/utils/validation', () => ({ validateQuery: vi.fn() }))
vi.mock('@/server/utils/login-events/repository', () => ({ getLoginEventStats: vi.fn() }))
vi.mock('@/server/utils/login-events/retention', () => ({ pruneLoginEventsIfDue: vi.fn(async () => null) }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: vi.fn(async () => ({ t: (key: string) => key })),
    createLocalizedError: vi.fn(async (_event: unknown, options: { statusCode: number, key: string }) => {
        const error = new Error(options.key)
        Object.assign(error, { statusCode: options.statusCode })
        return error
    }),
}))

describe('server/api/admin/login-events/stats.get', () => {
    const event = {} as never
    const stats = {
        total: 4,
        byType: [{ type: 'sign_in_failure', count: 1 }],
        byResult: [{ result: 'failure', count: 1 }],
        distinctUsers: 2,
        distinctIps: 2,
        trendDays: 30,
        dailyTrend: [{ date: '2026-11-20', count: 2 }],
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as never)
        vi.mocked(validateQuery).mockResolvedValue({
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'email',
            userId: 'user-1',
            ip: '203.0.113.9',
            startDate: '2026-11-01T00:00:00.000Z',
            endDate: '2026-11-22T00:00:00.000Z',
        } as never)
        vi.mocked(getLoginEventStats).mockResolvedValue(stats as never)
    })

    it('把筛选条件传给统计并返回零值补齐后的结果', async () => {
        const response = await handler(event)

        expect(getLoginEventStats).toHaveBeenCalledWith({
            types: ['sign_in_failure'],
            results: ['failure'],
            channels: ['email'],
            userId: 'user-1',
            ip: '203.0.113.9',
            start: new Date('2026-11-01T00:00:00.000Z'),
            end: new Date('2026-11-22T00:00:00.000Z'),
        })
        expect(pruneLoginEventsIfDue).toHaveBeenCalled()
        expect(response).toEqual({ success: true, data: stats })
    })

    it('未通过管理员校验时直接拒绝且不触发清理', async () => {
        vi.mocked(checkAdmin).mockRejectedValueOnce(Object.assign(new Error('forbidden'), { statusCode: 403 }))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(pruneLoginEventsIfDue).not.toHaveBeenCalled()
        expect(getLoginEventStats).not.toHaveBeenCalled()
    })

    it('统计失败时写错误日志并返回本地化 500', async () => {
        vi.mocked(getLoginEventStats).mockRejectedValueOnce(new Error('db down'))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 500 })
        expect(logger.error).toHaveBeenCalledWith('Failed to get login event stats', expect.objectContaining({
            adminId: 'admin-1',
            error: 'db down',
        }))
        expect(createLocalizedError).toHaveBeenCalledWith(event, { statusCode: 500, key: 'errors.admin.logsStatsFailed' })
    })
})
