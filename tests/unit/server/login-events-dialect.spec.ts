// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import loggerMock from '@/tests/mocks/logger'
import { getLoginEventBucketExpression, isLoginEventBucketLabel } from '@/server/utils/login-events/dialect'
import { getLoginEventHeatmap, getLoginEventStats } from '@/server/utils/login-events/repository'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))
vi.mock('@/server/utils/logger', () => ({ default: loggerMock }))

/**
 * 统计 / 热力图的方言聚合契约。
 *
 * 锁定三方言分桶表达式（UTC 口径、占位符无关）与「聚合在数据库侧」的事实：
 * 仓储不再把窗口内事件拉进内存，任何回退到 `repository.find` 的实现都应失败。
 */

type RecordedQueryBuilder = {
    where: (value: unknown) => RecordedQueryBuilder
    select: (expression: string, alias?: string) => RecordedQueryBuilder
    addSelect: (expression: string) => RecordedQueryBuilder
    groupBy: (expression: string) => RecordedQueryBuilder
    addGroupBy: (expression: string) => RecordedQueryBuilder
    getCount: () => Promise<number>
    getRawOne: () => Promise<{ count: number }>
    getRawMany: () => Promise<unknown[]>
}

function createRecordingRepository(rows: unknown[] = []) {
    const selects: string[] = []
    const groupBys: string[] = []
    const wheres: unknown[] = []
    const builder: RecordedQueryBuilder = {
        where: (value) => {
            wheres.push(value)
            return builder
        },
        select: (expression) => {
            selects.push(expression)
            return builder
        },
        addSelect: (expression) => {
            selects.push(expression)
            return builder
        },
        groupBy: (expression) => {
            groupBys.push(expression)
            return builder
        },
        addGroupBy: (expression) => {
            groupBys.push(expression)
            return builder
        },
        getCount: async () => rows.length,
        getRawOne: async () => ({ count: 0 }),
        getRawMany: async () => rows,
    }
    const repository = {
        createQueryBuilder: () => builder,
    }
    return { repository, selects, groupBys, wheres }
}

describe('登录事件方言分桶表达式', () => {
    it('SQLite 直接取 UTC 文本分量', () => {
        expect(getLoginEventBucketExpression('day', { dbType: 'sqlite' }))
            .toBe('strftime(\'%Y-%m-%d\', event.createdAt)')
        expect(getLoginEventBucketExpression('hour', { dbType: 'sqlite' }))
            .toBe('strftime(\'%Y-%m-%d %H:00\', event.createdAt)')
    })

    it('PostgreSQL 用 AT TIME ZONE 还原 UTC 墙钟', () => {
        expect(getLoginEventBucketExpression('day', { dbType: 'postgres' }))
            .toBe('to_char(event.createdAt AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')')
        expect(getLoginEventBucketExpression('hour', { dbType: 'postgres' }))
            .toBe('to_char(event.createdAt AT TIME ZONE \'UTC\', \'YYYY-MM-DD HH24:00\')')
    })

    it('MySQL 经 epoch 整除换算，不依赖时区表', () => {
        const day = getLoginEventBucketExpression('day', { dbType: 'mysql' })
        expect(day).toContain('UNIX_TIMESTAMP(event.createdAt)')
        expect(day).toContain('INTERVAL (FLOOR(UNIX_TIMESTAMP(event.createdAt) / 86400)) DAY')
        expect(day).toContain('\'%Y-%m-%d\'')
        expect(day).not.toContain('CONVERT_TZ')

        const hour = getLoginEventBucketExpression('hour', { dbType: 'mysql' })
        expect(hour).toContain('INTERVAL (FLOOR(UNIX_TIMESTAMP(event.createdAt) / 3600)) HOUR')
        expect(hour).toContain('\'%Y-%m-%d %H:00\'')
    })

    it('未知方言回落 SQLite 表达式，别名可替换', () => {
        expect(getLoginEventBucketExpression('day', { dbType: 'unknown', alias: 'le' }))
            .toBe('strftime(\'%Y-%m-%d\', le.createdAt)')
    })

    it('分桶表达式不含占位符，值一律走查询构造器参数化', () => {
        for (const dbType of ['sqlite', 'mysql', 'postgres']) {
            for (const unit of ['day', 'hour'] as const) {
                const expression = getLoginEventBucketExpression(unit, { dbType })
                expect(expression).not.toMatch(/\$\d|\?/u)
                expect(expression).not.toMatch(/'%[^']*'\s*\+/u)
            }
        }
    })

    it('分桶标签校验丢弃方言异常值', () => {
        expect(isLoginEventBucketLabel('2026-11-21', 'day')).toBe(true)
        expect(isLoginEventBucketLabel('2026-11-21 08:00', 'hour')).toBe(true)
        expect(isLoginEventBucketLabel('2026-11-21', 'hour')).toBe(false)
        expect(isLoginEventBucketLabel('2026-11-21 08:00', 'day')).toBe(false)
        expect(isLoginEventBucketLabel(null, 'day')).toBe(false)
        expect(isLoginEventBucketLabel(20261121, 'day')).toBe(false)
    })
})

describe('统计与热力图的聚合下推', () => {
    it('仓储替身不含 find，聚合结果只依赖 GROUP BY 行', async () => {
        const { repository, groupBys } = createRecordingRepository([
            { bucket: '2026-11-20', count: '1' },
        ])
        expect('find' in repository).toBe(false)

        await getLoginEventStats({}, { repository: repository as never, now: new Date('2026-11-22T00:00:00.000Z') })
        expect(groupBys).toContain(getLoginEventBucketExpression('day'))
    })

    it('每日趋势按分桶表达式 GROUP BY，且不调用 repository.find', async () => {
        loggerMock.warn.mockReset()
        const { repository, groupBys } = createRecordingRepository([
            { bucket: '2026-11-20', count: '2' },
            { bucket: '2026-11-21', count: '1' },
            { bucket: 'not-a-day', count: '9' },
        ])

        const stats = await getLoginEventStats({}, { repository: repository as never, now: new Date('2026-11-22T00:00:00.000Z') })

        expect(groupBys).toContain(getLoginEventBucketExpression('day'))
        expect(loggerMock.warn).toHaveBeenCalledWith(
            'Dropped login event trend buckets with unexpected labels',
            expect.objectContaining({ droppedTrendBuckets: 1 }),
        )
        expect(stats.dailyTrend).toEqual([
            { date: '2026-11-20', count: 2 },
            { date: '2026-11-21', count: 1 },
        ])
    })

    it('热力图按 type × 分桶 GROUP BY，两种粒度都不拉取原始事件', async () => {
        loggerMock.warn.mockReset()
        const rows = [
            { type: 'sign_in_success', bucket: '2026-11-22 11:00', count: '2' },
            { type: 'sign_in_failure', bucket: '2026-11-22 11:00', count: '1' },
            { type: 'unknown-type', bucket: '2026-11-22 11:00', count: '5' },
            { type: 'sign_in_success', bucket: '2026-11-22T11:00:00Z', count: '9' },
        ]

        const hourly = createRecordingRepository(rows)
        const hourHeatmap = await getLoginEventHeatmap({}, {
            days: 7,
            now: new Date('2026-11-22T12:34:56.000Z'),
            repository: hourly.repository as never,
        })
        expect(hourly.groupBys).toContain('event.type')
        expect(hourly.groupBys).toContain(getLoginEventBucketExpression('hour'))
        expect(hourHeatmap.bucketUnit).toBe('hour')
        expect(hourHeatmap.buckets).toHaveLength(168)
        expect(hourHeatmap.buckets.at(-1)).toBe('2026-11-22 12:00')
        expect(hourHeatmap.rows.find((row) => row.type === 'sign_in_success')?.values.at(-2)).toBe(2)
        expect(hourHeatmap.rows.find((row) => row.type === 'sign_in_failure')?.values.at(-2)).toBe(1)
        expect(hourHeatmap.max).toBe(2)
        // 两行被丢弃：未知事件类型 1 行 + 非法桶标签 1 行
        expect(loggerMock.warn).toHaveBeenCalledWith(
            'Dropped login event heatmap buckets with unexpected labels',
            expect.objectContaining({ unit: 'hour', droppedBuckets: 2 }),
        )

        const daily = createRecordingRepository([
            { type: 'sign_in_success', bucket: '2026-11-22', count: '3' },
        ])
        const dayHeatmap = await getLoginEventHeatmap({}, {
            days: 30,
            now: new Date('2026-11-22T12:34:56.000Z'),
            repository: daily.repository as never,
        })
        expect(daily.groupBys).toContain('event.type')
        expect(daily.groupBys).toContain(getLoginEventBucketExpression('day'))
        expect(dayHeatmap.bucketUnit).toBe('day')
        expect(dayHeatmap.buckets).toHaveLength(30)
        expect(dayHeatmap.rows.find((row) => row.type === 'sign_in_success')?.values.at(-1)).toBe(3)
        expect(dayHeatmap.max).toBe(3)
    })
})
