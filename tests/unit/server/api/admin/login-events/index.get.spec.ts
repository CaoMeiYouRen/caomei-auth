/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/login-events/index.get'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError } from '@/server/utils/i18n'
import { queryLoginEvents } from '@/server/utils/login-events/repository'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'

vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: vi.fn() }))
vi.mock('@/server/utils/validation', () => ({ validateQuery: vi.fn() }))
vi.mock('@/server/utils/login-events/repository', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/login-events/repository')>()
    return { ...actual, queryLoginEvents: vi.fn() }
})
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: vi.fn(async () => ({ t: (key: string) => key })),
    createLocalizedError: vi.fn(async (_event: unknown, options: { statusCode: number, key: string }) => {
        const error = new Error(options.key)
        Object.assign(error, { statusCode: options.statusCode })
        return error
    }),
}))

describe('server/api/admin/login-events/index.get', () => {
    const event = {} as never

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as never)
        vi.mocked(validateQuery).mockResolvedValue({
            page: 2,
            limit: 30,
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'email',
            userId: 'user-1',
            ip: '203.0.113.9',
            startDate: '2026-11-01T00:00:00.000Z',
            endDate: '2026-11-22T00:00:00.000Z',
            sort: 'asc',
        } as never)
        vi.mocked(queryLoginEvents).mockResolvedValue({
            items: [{
                id: 'event-1',
                type: 'sign_in_failure',
                result: 'failure',
                channel: 'email',
                userId: 'user-1',
                ip: '203.0.113.9',
                userAgent: 'vitest-UA',
                metadata: { reason: 'INVALID_EMAIL_OR_PASSWORD' },
                createdAt: new Date('2026-11-20T08:00:00.000Z'),
            }],
            total: 1,
            page: 2,
            pageSize: 30,
        } as never)
    })

    it('把查询参数映射为仓储筛选并返回分页结果', async () => {
        const response = await handler(event)

        expect(queryLoginEvents).toHaveBeenCalledWith({
            types: ['sign_in_failure'],
            results: ['failure'],
            channels: ['email'],
            userId: 'user-1',
            ip: '203.0.113.9',
            start: new Date('2026-11-01T00:00:00.000Z'),
            end: new Date('2026-11-22T00:00:00.000Z'),
            page: 2,
            pageSize: 30,
            sort: 'asc',
        })
        expect(response).toEqual({
            success: true,
            data: {
                events: [{
                    id: 'event-1',
                    type: 'sign_in_failure',
                    result: 'failure',
                    channel: 'email',
                    userId: 'user-1',
                    ip: '203.0.113.9',
                    userAgent: 'vitest-UA',
                    metadata: { reason: 'INVALID_EMAIL_OR_PASSWORD' },
                    createdAt: '2026-11-20T08:00:00.000Z',
                }],
                pagination: { page: 2, limit: 30, total: 1, totalPages: 1 },
            },
        })
        // 响应只包含展示字段，不泄漏实体时间戳 / 关联对象
        expect(Object.keys(response.data.events[0] as object).sort()).toEqual([
            'channel',
            'createdAt',
            'id',
            'ip',
            'metadata',
            'result',
            'type',
            'userAgent',
            'userId',
        ])
    })

    it('未通过管理员校验时直接拒绝', async () => {
        vi.mocked(checkAdmin).mockRejectedValueOnce(Object.assign(new Error('forbidden'), { statusCode: 403 }))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(queryLoginEvents).not.toHaveBeenCalled()
    })

    it('查询失败时写错误日志并返回本地化 500', async () => {
        vi.mocked(queryLoginEvents).mockRejectedValueOnce(new Error('db down'))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 500 })
        expect(logger.error).toHaveBeenCalledWith('Failed to query login events', expect.objectContaining({
            adminId: 'admin-1',
            error: 'db down',
        }))
        expect(createLocalizedError).toHaveBeenCalledWith(event, {
            statusCode: 500,
            key: 'errors.server.internal',
        })
    })
})
