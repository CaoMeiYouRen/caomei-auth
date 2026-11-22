import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    LOGIN_EVENT_RETENTION_DEFAULT_DAYS,
    LOGIN_EVENT_PRUNE_THROTTLE_MS,
    getLoginEventRetentionDays,
    pruneLoginEventsIfDue,
    resetLoginEventPruneThrottle,
    resolveLoginEventRetentionDays,
} = await import('@/server/utils/login-events/retention')

/**
 * 阶段 12 M1.3：保留期解析与进程内节流清理。
 */
describe('登录事件保留期解析', () => {
    it('缺省 / 非法 / 越界统一回落 90 天', () => {
        expect(LOGIN_EVENT_RETENTION_DEFAULT_DAYS).toBe(90)
        for (const value of [undefined, null, '', 'abc', Number.NaN, 0, -1, 1.5, 3651, '3651']) {
            expect(resolveLoginEventRetentionDays(value)).toBe(90)
        }
    })

    it('接受 1–3650 的整数与数字字符串', () => {
        expect(resolveLoginEventRetentionDays(1)).toBe(1)
        expect(resolveLoginEventRetentionDays('30')).toBe(30)
        expect(resolveLoginEventRetentionDays(3650)).toBe(3650)
    })

    it('环境变量缺失时回落默认值', () => {
        expect(getLoginEventRetentionDays({})).toBe(90)
        expect(getLoginEventRetentionDays({ LOGIN_EVENT_RETENTION_DAYS: '180' })).toBe(180)
        expect(getLoginEventRetentionDays({ LOGIN_EVENT_RETENTION_DAYS: '0' })).toBe(90)
    })
})

describe('登录事件惰性清理节流', () => {
    beforeEach(() => {
        resetLoginEventPruneThrottle()
    })

    it('节流窗口内不重复删除，force 可绕过', async () => {
        const repository = { delete: vi.fn(async () => ({ affected: 3, raw: [] })) }
        const first = await pruneLoginEventsIfDue({ now: 1_000_000, retentionDays: 30, repository })
        expect(first?.deleted).toBe(3)
        expect(repository.delete).toHaveBeenCalledTimes(1)

        const throttled = await pruneLoginEventsIfDue({
            now: 1_000_000 + LOGIN_EVENT_PRUNE_THROTTLE_MS - 1,
            retentionDays: 30,
            repository,
        })
        expect(throttled).toBeNull()
        expect(repository.delete).toHaveBeenCalledTimes(1)

        const forced = await pruneLoginEventsIfDue({
            now: 1_000_001,
            retentionDays: 30,
            repository,
            force: true,
        })
        expect(forced?.deleted).toBe(3)
        expect(repository.delete).toHaveBeenCalledTimes(2)
    })

    it('失败会重置节流，允许下一次查询重试', async () => {
        const repository = {
            delete: vi.fn()
                .mockRejectedValueOnce(new Error('db down'))
                .mockResolvedValueOnce({ affected: 1, raw: [] }),
        }
        await expect(pruneLoginEventsIfDue({ now: 2_000_000, retentionDays: 30, repository })).rejects.toThrow('db down')
        const retried = await pruneLoginEventsIfDue({ now: 2_000_001, retentionDays: 30, repository })
        expect(retried?.deleted).toBe(1)
        expect(repository.delete).toHaveBeenCalledTimes(2)
    })

    it('并发调用复用同一个 in-flight 任务', async () => {
        let resolveDelete: ((value: { affected: number, raw: never[] }) => void) | undefined
        const repository = {
            delete: vi.fn(() => new Promise<{ affected: number, raw: never[] }>((resolve) => {
                resolveDelete = resolve
            })),
        }
        const first = pruneLoginEventsIfDue({ now: 3_000_000, retentionDays: 30, repository })
        const second = pruneLoginEventsIfDue({ now: 3_000_000, retentionDays: 30, repository })
        expect(repository.delete).toHaveBeenCalledTimes(1)
        resolveDelete?.({ affected: 2, raw: [] })
        await expect(first).resolves.toMatchObject({ deleted: 2 })
        await expect(second).resolves.toMatchObject({ deleted: 2 })
    })
})
