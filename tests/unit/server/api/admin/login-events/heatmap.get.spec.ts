/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/login-events/heatmap.get'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError } from '@/server/utils/i18n'
import { getLoginEventHeatmap } from '@/server/utils/login-events/repository'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'

vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: vi.fn() }))
vi.mock('@/server/utils/validation', () => ({ validateQuery: vi.fn() }))
vi.mock('@/server/utils/login-events/repository', () => ({ getLoginEventHeatmap: vi.fn() }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: vi.fn(async () => ({ t: (key: string) => key })),
    createLocalizedError: vi.fn(async (_event: unknown, options: { statusCode: number, key: string }) => {
        const error = new Error(options.key)
        Object.assign(error, { statusCode: options.statusCode })
        return error
    }),
}))

describe('server/api/admin/login-events/heatmap.get', () => {
    const event = {} as never
    const heatmap = {
        days: 7,
        timezone: 'UTC',
        bucketUnit: 'hour',
        buckets: ['2026-11-22 12:00'],
        rows: [{ type: 'sign_in_success', values: [1] }],
        max: 1,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as never)
        vi.mocked(validateQuery).mockResolvedValue({
            days: 7,
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: 'user-1',
            ip: '203.0.113.9',
            startDate: '2026-11-16T00:00:00.000Z',
            endDate: '2026-11-22T00:00:00.000Z',
        } as never)
        vi.mocked(getLoginEventHeatmap).mockResolvedValue(heatmap as never)
    })

    it('把天数与筛选传给聚合并返回矩阵', async () => {
        const response = await handler(event)

        expect(getLoginEventHeatmap).toHaveBeenCalledWith({
            types: ['sign_in_success'],
            results: ['success'],
            channels: ['email'],
            userId: 'user-1',
            ip: '203.0.113.9',
            start: new Date('2026-11-16T00:00:00.000Z'),
            end: new Date('2026-11-22T00:00:00.000Z'),
        }, { days: 7 })
        expect(response).toEqual({ success: true, data: heatmap })
    })

    it('未通过管理员校验时直接拒绝', async () => {
        vi.mocked(checkAdmin).mockRejectedValueOnce(Object.assign(new Error('forbidden'), { statusCode: 403 }))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(getLoginEventHeatmap).not.toHaveBeenCalled()
    })

    it('聚合失败时写错误日志并返回本地化 500', async () => {
        vi.mocked(getLoginEventHeatmap).mockRejectedValueOnce(new Error('db down'))
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 500 })
        expect(logger.error).toHaveBeenCalledWith('Failed to get login event heatmap', expect.objectContaining({
            adminId: 'admin-1',
            error: 'db down',
        }))
        expect(createLocalizedError).toHaveBeenCalledWith(event, { statusCode: 500, key: 'errors.admin.logsStatsFailed' })
    })
})
