import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataSource, type FindOperator, type Repository } from 'typeorm'
import { LoginEvent } from '@/server/entities/login-event'
import { SnakeCaseNamingStrategy } from '@/server/database/naming-strategy'
import { getLoginEventBucketExpression } from '@/server/utils/login-events/dialect'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    DEFAULT_LOGIN_EVENT_PAGE_SIZE,
    MAX_LOGIN_EVENT_PAGE_SIZE,
    buildLoginEventWhere,
    getLoginEventHeatmap,
    getLoginEventStats,
    pruneLoginEvents,
    queryLoginEvents,
    recordLoginEvent,
    sanitizeLoginEventMetadata,
} = await import('@/server/utils/login-events/repository')

/**
 * 阶段 12 M1.1：登录事件仓储。
 *
 * 用内存 SQLite 验证真实查询语义（筛选、分页、排序、清理），
 * 仅 mock 全局 `dataSource` 以避免触发项目数据库初始化。
 */
describe('登录事件仓储', () => {
    let dataSource: DataSource
    let repository: Repository<LoginEvent>

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [LoginEvent],
            synchronize: true,
            logging: false,
            entityPrefix: 'caomei_auth_',
            namingStrategy: new SnakeCaseNamingStrategy(),
        })
        await dataSource.initialize()
    })

    afterAll(async () => {
        await dataSource.destroy()
    })

    beforeEach(async () => {
        repository = dataSource.getRepository(LoginEvent)
        await repository.clear()
    })

    it('写入后可读取，匿名事件 userId 为空', async () => {
        const event = await recordLoginEvent({
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'email',
            ip: '203.0.113.10',
            userAgent: 'Mozilla/5.0',
        }, { repository })

        expect(event.id).toBeTruthy()
        expect(event.userId).toBeNull()
        expect(event.channel).toBe('email')
        expect(event.metadata).toBeNull()

        const page = await queryLoginEvents({}, { repository })
        expect(page.total).toBe(1)
        expect(page.items[0]?.id).toBe(event.id)
    })

    it('写入前归一化来源 IP：带端口剥离、非法与超长回落 null（varchar(45) 契约）', async () => {
        const withPort = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            ip: '203.0.113.10:8080',
        }, { repository })
        expect(withPort.ip).toBe('203.0.113.10')

        const invalid = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            ip: 'not-an-ip',
        }, { repository })
        expect(invalid.ip).toBeNull()

        const tooLong = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            ip: 'x'.repeat(60),
        }, { repository })
        expect(tooLong.ip).toBeNull()

        /* 39 字符的完整 IPv6 文本是合法值，必须原样保留（不能被 45 上限误杀） */
        const fullIpv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        const ipv6Event = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            ip: fullIpv6,
        }, { repository })
        expect(ipv6Event.ip).toBe(fullIpv6)
    })

    it('未知通道回落 unknown', async () => {
        const event = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'saml',
            userId: 'user-1',
        }, { repository })
        expect(event.channel).toBe('unknown')
    })

    it('拒绝非法事件类型与结果', async () => {
        await expect(recordLoginEvent({
            type: 'sign_in' as never,
            result: 'success',
        }, { repository })).rejects.toThrow(TypeError)
        await expect(recordLoginEvent({
            type: 'sign_in_success',
            result: 'partial' as never,
        }, { repository })).rejects.toThrow(TypeError)
    })

    it('metadata 只保留白名单标量键，敏感键与嵌套结构一律丢弃', () => {
        expect(sanitizeLoginEventMetadata(null)).toBeNull()
        expect(sanitizeLoginEventMetadata('text')).toBeNull()
        expect(sanitizeLoginEventMetadata(['a'])).toBeNull()

        const sanitized = sanitizeLoginEventMetadata({
            provider: 'github',
            reason: 'user tester@example.com failed 2fa',
            method: 'sso',
            factor: 'totp',
            errorCode: 'invalid_code',
            email: 'tester@example.com',
            password: 'secret',
            tokens: ['token-value'],
            passwords: ['secret'],
            secrets: 'secret',
            passwordConfirm: 'secret',
            tokenValue: 'token-value',
            authorization: 'Bearer abc',
            apiKey: 'key',
            nested: { email: { address: 'nested@example.com' } },
        })
        expect(sanitized).toEqual({
            provider: 'github',
            reason: 'user t****r@example.com failed 2fa',
            method: 'sso',
            factor: 'totp',
            errorCode: 'invalid_code',
        })
        // 未知键即使值是对象也不进入结果，避免子键绕过脱敏
        expect(sanitized).not.toHaveProperty('email')
        expect(sanitized).not.toHaveProperty('nested')
    })

    it('自由文本中的令牌与邮箱兜底脱敏，长文本截断', () => {
        const sanitized = sanitizeLoginEventMetadata({
            reason: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
            errorCode: `mail admin@example.com ${'x'.repeat(400)}`,
        })
        expect(sanitized?.reason).toBe('[REDACTED]')
        expect(sanitized?.errorCode).toBe(`mail a***n@example.com ${'x'.repeat(400)}`.slice(0, 256))
    })

    it('metadata 落库为脱敏后的对象', async () => {
        const event = await recordLoginEvent({
            type: 'two_factor_failure',
            result: 'failure',
            channel: 'sso',
            metadata: { provider: 'okta', token: 'abc', reason: 'invalid_code' },
        }, { repository })
        expect(event.metadata).toEqual({ provider: 'okta', reason: 'invalid_code' })
        const stored = await repository.findOneByOrFail({ id: event.id })
        expect(stored.metadata).toEqual({ provider: 'okta', reason: 'invalid_code' })
    })

    it('按类型 / 结果 / 通道 / 用户 / IP 与时间筛选', async () => {
        const base = Date.UTC(2026, 10, 20, 0, 0, 0)
        const events = [
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '198.51.100.1' },
            { type: 'sign_in_failure', result: 'failure', channel: 'username', userId: 'user-1', ip: '198.51.100.2' },
            { type: 'two_factor_challenge', result: 'success', channel: 'sso', userId: 'user-2', ip: '198.51.100.1' },
            { type: 'sign_out', result: 'success', channel: 'unknown', userId: null, ip: null },
        ] as const
        for (const [index, item] of events.entries()) {
            const event = await recordLoginEvent(item, { repository })
            await repository.update(event.id, { createdAt: new Date(base + index * 60_000) })
        }

        const byType = await queryLoginEvents({ types: ['sign_in_failure'] }, { repository })
        expect(byType.items.map((item) => item.type)).toEqual(['sign_in_failure'])

        const byResult = await queryLoginEvents({ results: ['failure'] }, { repository })
        expect(byResult.total).toBe(1)

        const byChannel = await queryLoginEvents({ channels: ['sso', 'unknown'] }, { repository })
        expect(byChannel.total).toBe(2)

        const byUser = await queryLoginEvents({ userId: 'user-1' }, { repository })
        expect(byUser.total).toBe(2)

        const byIp = await queryLoginEvents({ ip: '198.51.100.1' }, { repository })
        expect(byIp.total).toBe(2)

        const byRange = await queryLoginEvents({
            start: new Date(base + 60_000),
            end: new Date(base + 120_000),
        }, { repository })
        expect(byRange.items.map((item) => item.channel)).toEqual(['sso', 'username'])
    })

    it('默认倒序、分页稳定且页大小受上限约束', async () => {
        for (let index = 0; index < 25; index += 1) {
            const event = await recordLoginEvent({
                type: 'sign_in_success',
                result: 'success',
                channel: 'email',
                userId: `user-${index}`,
            }, { repository })
            await repository.update(event.id, { createdAt: new Date(Date.UTC(2026, 10, 20, 0, 0, index)) })
        }

        const firstPage = await queryLoginEvents({}, { repository })
        expect(firstPage.pageSize).toBe(DEFAULT_LOGIN_EVENT_PAGE_SIZE)
        expect(firstPage.total).toBe(25)
        expect(firstPage.items).toHaveLength(DEFAULT_LOGIN_EVENT_PAGE_SIZE)
        expect(firstPage.items[0]?.userId).toBe('user-24')

        const thirdPage = await queryLoginEvents({ page: 3, pageSize: 10 }, { repository })
        expect(thirdPage.items).toHaveLength(5)
        expect(thirdPage.items[0]?.userId).toBe('user-4')

        const ascending = await queryLoginEvents({ sort: 'asc', pageSize: 1 }, { repository })
        expect(ascending.items[0]?.userId).toBe('user-0')

        const oversized = await queryLoginEvents({ pageSize: 10_000 }, { repository })
        expect(oversized.pageSize).toBe(MAX_LOGIN_EVENT_PAGE_SIZE)

        const invalidPage = await queryLoginEvents({ page: 0, pageSize: 0 }, { repository })
        expect(invalidPage.page).toBe(1)
        expect(invalidPage.pageSize).toBe(DEFAULT_LOGIN_EVENT_PAGE_SIZE)
    })

    it('同一 createdAt 下按 id 稳定排序，方向跟随 sort', async () => {
        const sameTime = new Date(Date.UTC(2026, 10, 20, 0, 0, 0))
        const first = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
        }, { repository })
        const second = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
        }, { repository })
        await repository.update(first.id, { createdAt: sameTime })
        await repository.update(second.id, { createdAt: sameTime })

        const descending = await queryLoginEvents({}, { repository })
        expect(descending.items.map((item) => item.id)).toEqual([first.id, second.id].sort().reverse())
        const ascending = await queryLoginEvents({ sort: 'asc' }, { repository })
        expect(ascending.items.map((item) => item.id)).toEqual([first.id, second.id].sort())
    })

    it('支持显式回填 createdAt（Demo 与历史数据）', async () => {
        const createdAt = new Date(Date.UTC(2026, 10, 20, 8, 30, 0))
        const event = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: 'user-1',
            createdAt,
        }, { repository })
        const stored = await repository.findOneByOrFail({ id: event.id })
        expect(stored.createdAt.getTime()).toBe(createdAt.getTime())
    })

    it('查询条件构造只包含已提供的筛选', () => {
        expect(buildLoginEventWhere({})).toEqual({})
        const where = buildLoginEventWhere({ types: ['sign_out'] })
        expect(Object.keys(where)).toEqual(['type'])
    })

    it('IP 条件不追加隐式时间窗，只有显式 start / end 才生成时间谓词', async () => {
        const ipOnly = buildLoginEventWhere({ ip: '198.51.100.9' })
        expect(ipOnly).toEqual({ ip: '198.51.100.9' })

        const start = new Date(Date.UTC(2026, 9, 1, 0, 0, 0))
        const end = new Date(Date.UTC(2026, 10, 1, 0, 0, 0))
        const startOnly = buildLoginEventWhere({ ip: '198.51.100.9', start })
        expect(Object.keys(startOnly).sort()).toEqual(['createdAt', 'ip'])
        expect((startOnly.createdAt as FindOperator<Date>).type).toBe('moreThanOrEqual')
        const endOnly = buildLoginEventWhere({ ip: '198.51.100.9', end })
        expect(Object.keys(endOnly).sort()).toEqual(['createdAt', 'ip'])
        expect((endOnly.createdAt as FindOperator<Date>).type).toBe('lessThanOrEqual')
        const range = buildLoginEventWhere({ start, end })
        expect(Object.keys(range)).toEqual(['createdAt'])
        expect((range.createdAt as FindOperator<Date>).type).toBe('between')

        // 行为锁定：IP-only 查询不受任何默认窗口裁剪，返回字段仍为仓储分页契约
        const oldEvent = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: 'user-1',
            ip: '198.51.100.9',
        }, { repository })
        await repository.update(oldEvent.id, { createdAt: new Date(Date.UTC(2026, 6, 1, 0, 0, 0)) })
        const page = await queryLoginEvents({ ip: '198.51.100.9' }, { repository })
        expect(page.total).toBe(1)
        expect(Object.keys(page).sort()).toEqual(['items', 'page', 'pageSize', 'total'])
        expect(page.items[0]?.ip).toBe('198.51.100.9')
    })

    it('清理只删除保留期之前的事件，cutoff 等值保留', async () => {
        const now = new Date(Date.UTC(2026, 10, 22, 0, 0, 0))
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        const oldEvent = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
        }, { repository })
        const boundaryEvent = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
        }, { repository })
        const newEvent = await recordLoginEvent({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
        }, { repository })
        await repository.update(oldEvent.id, { createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000) })
        await repository.update(boundaryEvent.id, { createdAt: cutoff })
        await repository.update(newEvent.id, { createdAt: new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000) })

        const result = await pruneLoginEvents({ retentionDays: 90, now, repository })
        expect(result.deleted).toBe(1)
        expect(result.cutoff).toEqual(cutoff)

        const remaining = await queryLoginEvents({}, { repository })
        expect(remaining.items.map((item) => item.id).sort()).toEqual([boundaryEvent.id, newEvent.id].sort())
    })

    it('非法保留天数或非法 now 抛错而不是清空整表', async () => {
        await expect(pruneLoginEvents({ retentionDays: 0, repository })).rejects.toThrow(RangeError)
        await expect(pruneLoginEvents({ retentionDays: Number.NaN, repository })).rejects.toThrow(RangeError)
        await expect(pruneLoginEvents({ retentionDays: 90, now: new Date(Number.NaN), repository })).rejects.toThrow(RangeError)
    })

    it('统计空数据返回零值并补齐全部枚举', async () => {
        const stats = await getLoginEventStats({}, { repository, now: new Date('2026-11-22T12:00:00.000Z') })
        expect(stats.total).toBe(0)
        expect(stats.byType).toHaveLength(7)
        expect(stats.byType.every((item) => item.count === 0)).toBe(true)
        expect(stats.byResult).toEqual([
            { result: 'success', count: 0 },
            { result: 'failure', count: 0 },
        ])
        expect(stats.distinctUsers).toBe(0)
        expect(stats.distinctIps).toBe(0)
        expect(stats.dailyTrend).toEqual([])
        expect(stats.trendDays).toBe(30)
    })

    it('统计与列表共用筛选并返回类型 / 结果 / 独立用户与 IP / 每日趋势', async () => {
        const seeds = [
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '203.0.113.1', at: '2026-11-20T08:00:00.000Z' },
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '203.0.113.2', at: '2026-11-20T09:00:00.000Z' },
            { type: 'sign_in_failure', result: 'failure', channel: 'username', userId: 'user-2', ip: '203.0.113.1', at: '2026-11-21T10:00:00.000Z' },
            { type: 'two_factor_success', result: 'success', channel: 'unknown', userId: 'user-2', ip: '203.0.113.2', at: '2026-11-21T11:00:00.000Z' },
        ] as const
        for (const seed of seeds) {
            await recordLoginEvent({ ...seed, createdAt: new Date(seed.at) }, { repository })
        }

        const stats = await getLoginEventStats({}, { repository, now: new Date('2026-11-22T12:00:00.000Z') })
        expect(stats.total).toBe(4)
        expect(stats.timezone).toBe('UTC')
        expect(stats.byType.find((item) => item.type === 'sign_in_success')?.count).toBe(2)
        expect(stats.byType.find((item) => item.type === 'sign_in_failure')?.count).toBe(1)
        expect(stats.byType.find((item) => item.type === 'two_factor_success')?.count).toBe(1)
        expect(stats.byResult).toEqual([
            { result: 'success', count: 3 },
            { result: 'failure', count: 1 },
        ])
        expect(stats.distinctUsers).toBe(2)
        expect(stats.distinctIps).toBe(2)
        expect(stats.dailyTrend).toEqual([
            { date: '2026-11-20', count: 2 },
            { date: '2026-11-21', count: 2 },
        ])

        const filtered = await getLoginEventStats({ types: ['sign_in_failure'] }, { repository, now: new Date('2026-11-22T12:00:00.000Z') })
        expect(filtered.total).toBe(1)
        expect(filtered.byType.find((item) => item.type === 'sign_in_failure')?.count).toBe(1)
    })

    it('每日趋势按 UTC 天在数据库侧聚合，跨日事件不并桶且不再全量拉取', async () => {
        const seeds = [
            '2026-11-20T23:59:59.000Z',
            '2026-11-21T00:00:00.000Z',
            '2026-11-21T23:59:59.000Z',
            '2026-09-01T00:00:00.000Z',
        ]
        for (const at of seeds) {
            await recordLoginEvent({
                type: 'sign_in_success',
                result: 'success',
                channel: 'email',
                createdAt: new Date(at),
            }, { repository })
        }

        const findSpy = vi.spyOn(repository, 'find')
        const stats = await getLoginEventStats({}, { repository, now: new Date('2026-11-22T00:00:00.000Z') })
        expect(findSpy).not.toHaveBeenCalled()
        findSpy.mockRestore()

        expect(stats.timezone).toBe('UTC')
        // 默认 30 天窗口：2026-10-23 起，9 月的事件不计入趋势
        expect(stats.dailyTrend).toEqual([
            { date: '2026-11-20', count: 1 },
            { date: '2026-11-21', count: 2 },
        ])

        const windowed = await getLoginEventStats({
            start: new Date('2026-09-01T00:00:00.000Z'),
            end: new Date('2026-09-02T00:00:00.000Z'),
        }, { repository, now: new Date('2026-11-22T00:00:00.000Z') })
        expect(windowed.dailyTrend).toEqual([{ date: '2026-09-01', count: 1 }])
    })

    it('热力图按小时 / 天分桶并补零，窗口边界闭区间', async () => {
        const now = new Date('2026-11-22T12:34:56.000Z')
        /* 7 天窗口：2026-11-15 13:00 ~ 2026-11-22 12:00（UTC） */
        const windowStart = new Date('2026-11-15T13:00:00.000Z')
        const windowEnd = new Date('2026-11-22T12:00:00.000Z')
        const seeds = [
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '203.0.113.1', at: '2026-11-15T12:59:59.000Z' },
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '203.0.113.1', at: windowStart.toISOString() },
            { type: 'sign_in_success', result: 'success', channel: 'email', userId: 'user-1', ip: '203.0.113.1', at: '2026-11-22T11:30:00.000Z' },
            { type: 'sign_in_failure', result: 'failure', channel: 'email', userId: null, ip: '203.0.113.2', at: windowEnd.toISOString() },
            { type: 'sign_in_failure', result: 'failure', channel: 'email', userId: null, ip: '203.0.113.2', at: '2026-11-22T12:00:01.000Z' },
        ] as const
        for (const seed of seeds) {
            await recordLoginEvent({ ...seed, createdAt: new Date(seed.at) }, { repository })
        }

        const hourly = await getLoginEventHeatmap({}, { days: 7, now, repository })
        expect(hourly.timezone).toBe('UTC')
        expect(hourly.bucketUnit).toBe('hour')
        expect(hourly.buckets).toHaveLength(168)
        expect(hourly.buckets[0]).toBe('2026-11-15 13:00')
        expect(hourly.buckets.at(-1)).toBe('2026-11-22 12:00')
        expect(hourly.rows).toHaveLength(7)
        expect(hourly.rows.every((row) => row.values.length === 168)).toBe(true)
        const success = hourly.rows.find((row) => row.type === 'sign_in_success')
        const failure = hourly.rows.find((row) => row.type === 'sign_in_failure')
        expect(success?.values.reduce((sum, value) => sum + value, 0)).toBe(2)
        expect(success?.values[0]).toBe(1)
        expect(failure?.values.reduce((sum, value) => sum + value, 0)).toBe(2)
        expect(failure?.values.at(-1)).toBe(2)
        expect(hourly.max).toBe(2)

        const daily = await getLoginEventHeatmap({}, { days: 30, now, repository })
        expect(daily.bucketUnit).toBe('day')
        expect(daily.buckets).toHaveLength(30)
        expect(daily.buckets.at(-1)).toBe('2026-11-22')

        const filtered = await getLoginEventHeatmap({ types: ['sign_in_failure'] }, { days: 7, now, repository })
        expect(filtered.rows.find((row) => row.type === 'sign_in_failure')?.values.at(-1)).toBe(2)
        expect(filtered.rows.find((row) => row.type === 'sign_in_success')?.values.every((value) => value === 0)).toBe(true)
    })

    it('热力图空数据返回全零矩阵', async () => {
        const heatmap = await getLoginEventHeatmap({}, { days: 7, now: new Date('2026-11-22T12:00:00.000Z'), repository })
        expect(heatmap.max).toBe(0)
        expect(heatmap.rows).toHaveLength(7)
        expect(heatmap.rows.every((row) => row.values.every((value) => value === 0))).toBe(true)
        expect(heatmap.buckets).toHaveLength(168)
    })

    it('统计与热力图生成的 SQL 含 GROUP BY 分桶，且不再全量拉取事件', async () => {
        const querySpy = vi.spyOn(repository, 'createQueryBuilder')
        const findSpy = vi.spyOn(repository, 'find')
        try {
            await getLoginEventStats({}, { repository, now: new Date('2026-11-22T00:00:00.000Z') })
            await getLoginEventHeatmap({}, { days: 7, now: new Date('2026-11-22T12:34:56.000Z'), repository })

            const sqls = querySpy.mock.results
                .map((result) => (result.value as { getQuery?: () => string }).getQuery?.() ?? '')
                .filter((sql) => sql.length > 0)
            const bucketExpression = getLoginEventBucketExpression('day')
            const bucketMarker = /strftime|UNIX_TIMESTAMP|AT TIME ZONE/iu.exec(bucketExpression)?.[0]
            expect(bucketMarker).toBeDefined()
            expect(sqls.some((sql) => /GROUP BY/iu.test(sql) && new RegExp(bucketMarker!, 'iu').test(sql))).toBe(true)
            expect(findSpy).not.toHaveBeenCalled()
        } finally {
            querySpy.mockRestore()
            findSpy.mockRestore()
        }
    })
})
