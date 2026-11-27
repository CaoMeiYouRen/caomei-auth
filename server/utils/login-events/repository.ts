import { Between, In, LessThan, LessThanOrEqual, MoreThanOrEqual, type FindOptionsWhere, type Repository } from 'typeorm'
import { normalizeClientIp } from '@/server/utils/client-ip'
import { LoginEvent } from '@/server/entities/login-event'
import { dataSource } from '@/server/database'
import { getLoginEventBucketExpression, isLoginEventBucketLabel } from '@/server/utils/login-events/dialect'
import logger from '@/server/utils/logger'
import { maskEmail } from '@/utils/shared/privacy'
import type { LoginEventStats } from '@/utils/shared/api-schemas'
import {
    LOGIN_EVENT_RESULTS,
    LOGIN_EVENT_TYPES,
    isLoginEventResult,
    isLoginEventType,
    isSupportedLoginEventCombination,
    isSupportedLoginEventResult,
    normalizeLoginEventChannel,
    type LoginEventChannel,
    type LoginEventResult,
    type LoginEventType,
} from '@/utils/shared/login-events'

/**
 * 登录事件仓储（阶段 12 M1.1 / D18）。
 *
 * 提供写入、查询与清理三类入口；写入失败由调用方（M1.2 插件）降级为
 * `logger.warn`，本模块不吞异常，保证契约测试与脚本能观察到失败。
 * 保留期解析与节流清理在 M1.3 接入，此处 `pruneLoginEvents` 只接收已解析的天数。
 */

export const DEFAULT_LOGIN_EVENT_PAGE_SIZE = 20
export const MAX_LOGIN_EVENT_PAGE_SIZE = 100

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/** metadata 允许键白名单：未知键一律丢弃，避免黑名单被新字段绕过 */
export const LOGIN_EVENT_METADATA_KEYS = [
    'provider',
    'providerId',
    'factor',
    'reason',
    'method',
    'redirect',
    'errorCode',
] as const

const METADATA_MAX_KEYS = 10
const METADATA_MAX_VALUE_LENGTH = 256

/** 自由文本中的邮箱与令牌形态兜底脱敏 */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gu
const TOKEN_PATTERN = /(?:Bearer\s+[A-Za-z0-9._~+/=-]+|eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|\b(?:sk|pk|ghp|gho|xox[baprs])_[A-Za-z0-9]{16,}\b)/gu

function maskSensitiveText(value: string): string {
    return value
        .replace(TOKEN_PATTERN, '[REDACTED]')
        .replace(EMAIL_PATTERN, (email) => maskEmail(email))
        .slice(0, METADATA_MAX_VALUE_LENGTH)
}

/**
 * 只保留白名单键的标量值，并对字符串做邮箱 / 令牌兜底脱敏。
 *
 * 嵌套对象与数组一律丢弃：事件表只承载少量扁平补充字段，
 * 保留结构会让敏感键借由子键（如 `{ email: { address } }`）绕过脱敏。
 */
export function sanitizeLoginEventMetadata(value: unknown): Record<string, unknown> | null {
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
        return null
    }
    const entries: Array<[string, string | number | boolean]> = []
    for (const [key, raw] of Object.entries(value)) {
        if (!(LOGIN_EVENT_METADATA_KEYS as readonly string[]).includes(key)) {
            continue
        }
        if (typeof raw === 'number' && Number.isFinite(raw)) {
            entries.push([key, raw])
        } else if (typeof raw === 'boolean') {
            entries.push([key, raw])
        } else if (typeof raw === 'string') {
            const trimmed = raw.trim()
            if (trimmed) {
                entries.push([key, maskSensitiveText(trimmed)])
            }
        }
        if (entries.length >= METADATA_MAX_KEYS) {
            break
        }
    }
    return entries.length ? Object.fromEntries(entries) : null
}

export interface LoginEventInput {
    type: LoginEventType
    result: LoginEventResult
    /** 允许传入原始通道字符串，未知值统一回落 `unknown` */
    channel?: string | null
    userId?: string | null
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown> | null
    /** 仅 Demo / 回填使用；默认由数据库写入当前时间 */
    createdAt?: Date
}

export interface LoginEventQuery {
    types?: readonly LoginEventType[]
    results?: readonly LoginEventResult[]
    channels?: readonly LoginEventChannel[]
    userId?: string | null
    ip?: string | null
    /** 起始时间（含） */
    start?: Date | null
    /** 结束时间（含） */
    end?: Date | null
    /** 从 1 开始；越界值回落默认值 */
    page?: number
    pageSize?: number
    sort?: 'asc' | 'desc'
}

export interface LoginEventPage {
    items: LoginEvent[]
    total: number
    page: number
    pageSize: number
}

export interface LoginEventPruneResult {
    /** 删除截止时间（早于该时间的事件被清理） */
    cutoff: Date
    deleted: number
}

type LoginEventRepository = Pick<Repository<LoginEvent>, 'create' | 'save' | 'findAndCount' | 'delete' | 'update'>
type LoginEventWriteRepository = Pick<Repository<LoginEvent>, 'create' | 'save' | 'update'>

function resolveRepository(repository?: LoginEventRepository): LoginEventRepository {
    return repository ?? dataSource.getRepository(LoginEvent)
}

function normalizePage(value: number | undefined): number {
    if (!Number.isInteger(value) || (value as number) < 1) {
        return 1
    }
    return value as number
}

function normalizePageSize(value: number | undefined): number {
    if (!Number.isInteger(value) || (value as number) < 1) {
        return DEFAULT_LOGIN_EVENT_PAGE_SIZE
    }
    return Math.min(value as number, MAX_LOGIN_EVENT_PAGE_SIZE)
}

/** 单条写入；失败向上抛出，由认证链路决定降级策略 */
export async function recordLoginEvent(
    input: LoginEventInput,
    options: { repository?: LoginEventWriteRepository } = {},
): Promise<LoginEvent> {
    if (!isLoginEventType(input.type)) {
        throw new TypeError(`Unknown login event type: ${String(input.type)}`)
    }
    if (!isLoginEventResult(input.result)) {
        throw new TypeError(`Unknown login event result: ${String(input.result)}`)
    }
    if (!isSupportedLoginEventResult(input.type, input.result)) {
        throw new TypeError(`Unsupported login event result: ${input.type} / ${input.result}`)
    }
    let channel = normalizeLoginEventChannel(input.channel)
    if (!isSupportedLoginEventCombination(input.type, channel)) {
        logger.warn('Login event channel is not supported, falling back to unknown', {
            type: input.type,
            channel,
        })
        channel = 'unknown'
    }
    const repository = options.repository ?? dataSource.getRepository(LoginEvent)
    const event = repository.create({
        type: input.type,
        result: input.result,
        channel,
        userId: input.userId ?? null,
        /* 写入契约（阶段 17 D62）：无论调用方给什么，落库前统一校验为合法 IP 或 null，
         * 避免带端口 / 超长值在 MySQL / PostgreSQL 被整行拒绝、在 SQLite 却照存 */
        ip: normalizeClientIp(input.ip),
        userAgent: input.userAgent?.trim() || null,
        metadata: sanitizeLoginEventMetadata(input.metadata),
    })
    const saved = await repository.save(event)
    if (input.createdAt && Number.isFinite(input.createdAt.getTime())) {
        /* CreateDateColumn 的默认值由数据库接管，回填历史时间需显式更新一次 */
        await repository.update(saved.id, { createdAt: input.createdAt })
        saved.createdAt = input.createdAt
    }
    return saved
}

/** 单条事件写入的超时上限：认证可用性优先，不因事件表写入挂起登录 */
const LOGIN_EVENT_WRITE_TIMEOUT_MS = 2000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`login event write timed out after ${timeoutMs}ms`)), timeoutMs)
    })
    return Promise.race([promise, timeout]).finally(() => {
        if (timer) {
            clearTimeout(timer)
        }
    })
}

/** 认证链路使用的 fail-open 写入：失败 / 超时只 warn，绝不阻断登录 */
export async function recordLoginEventSafely(input: LoginEventInput): Promise<void> {
    try {
        await withTimeout(recordLoginEvent(input), LOGIN_EVENT_WRITE_TIMEOUT_MS)
    } catch (error) {
        logger.warn('Failed to write login event, skipped', {
            type: input.type,
            channel: normalizeLoginEventChannel(input.channel),
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/** 查询条件构造与查询共用，供 M2.1 / M2.2 / M3.1 复用 */
export function buildLoginEventWhere(query: LoginEventQuery): FindOptionsWhere<LoginEvent> {
    const where: FindOptionsWhere<LoginEvent> = {}
    if (query.types?.length) {
        where.type = In([...query.types])
    }
    if (query.results?.length) {
        where.result = In([...query.results])
    }
    if (query.channels?.length) {
        where.channel = In([...query.channels])
    }
    if (query.userId) {
        where.userId = query.userId
    }
    if (query.ip) {
        where.ip = query.ip
    }
    if (query.start && query.end) {
        where.createdAt = Between(query.start, query.end)
    } else if (query.start) {
        where.createdAt = MoreThanOrEqual(query.start)
    } else if (query.end) {
        where.createdAt = LessThanOrEqual(query.end)
    }
    return where
}

export async function queryLoginEvents(
    query: LoginEventQuery = {},
    options: { repository?: LoginEventRepository } = {},
): Promise<LoginEventPage> {
    const repository = resolveRepository(options.repository)
    const page = normalizePage(query.page)
    const pageSize = normalizePageSize(query.pageSize)
    const [items, total] = await repository.findAndCount({
        where: buildLoginEventWhere(query),
        order: {
            createdAt: query.sort === 'asc' ? 'ASC' : 'DESC',
            id: query.sort === 'asc' ? 'ASC' : 'DESC',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
    })
    return { items, total, page, pageSize }
}

/**
 * 清理早于保留期的事件。
 *
 * 只接收已解析的保留天数（M1.3 负责 env 解析与节流）；非法天数直接抛错，
 * 避免把 `NaN` 当成「清空整表」。
 */
export async function pruneLoginEvents(options: {
    retentionDays: number
    now?: Date
    repository?: Pick<Repository<LoginEvent>, 'delete'>
}): Promise<LoginEventPruneResult> {
    if (!Number.isFinite(options.retentionDays) || options.retentionDays <= 0) {
        throw new RangeError(`Invalid login event retention days: ${String(options.retentionDays)}`)
    }
    const now = options.now ?? new Date()
    const cutoff = new Date(now.getTime() - options.retentionDays * MILLISECONDS_PER_DAY)
    if (!Number.isFinite(now.getTime()) || !Number.isFinite(cutoff.getTime())) {
        throw new RangeError(`Invalid login event cutoff: ${String(now)}`)
    }
    const repository = options.repository ?? dataSource.getRepository(LoginEvent)
    const result = await repository.delete({ createdAt: LessThan(cutoff) })
    return { cutoff, deleted: result.affected ?? 0 }
}

const DEFAULT_TREND_DAYS = 30

function applyLoginEventWhere(
    queryBuilder: ReturnType<Repository<LoginEvent>['createQueryBuilder']>,
    where: FindOptionsWhere<LoginEvent>,
) {
    if (Object.keys(where).length) {
        queryBuilder.where(where)
    }
    return queryBuilder
}


/**
 * 统计查询与列表共用 `buildLoginEventWhere`，保证筛选口径一致。
 * 未指定时间范围时，每日趋势默认只取最近 30 天，避免大时间窗全表聚合。
 * 每日趋势在数据库侧按 UTC 天 `GROUP BY`，JS 只做排序与形状收敛；热力图复用同一分桶表达式。
 */
export async function getLoginEventStats(
    query: LoginEventQuery = {},
    options: { repository?: Pick<Repository<LoginEvent>, 'createQueryBuilder'>, now?: Date } = {},
): Promise<LoginEventStats> {
    const repository = options.repository ?? dataSource.getRepository(LoginEvent)
    const where = buildLoginEventWhere(query)
    const base = () => applyLoginEventWhere(repository.createQueryBuilder('event'), where)

    const [total, rawByType, rawByResult, userRow, ipRow] = await Promise.all([
        base().getCount(),
        base().select('event.type', 'type').addSelect('COUNT(*)', 'count').groupBy('event.type').getRawMany(),
        base().select('event.result', 'result').addSelect('COUNT(*)', 'count').groupBy('event.result').getRawMany(),
        base().select('COUNT(DISTINCT event.userId)', 'count').getRawOne(),
        base().select('COUNT(DISTINCT event.ip)', 'count').getRawOne(),
    ])

    const typeCounts = new Map<string, number>(
        (rawByType as Array<{ type: string, count: string | number }>).map((row) => [row.type, Number(row.count)]),
    )
    const resultCounts = new Map<string, number>(
        (rawByResult as Array<{ result: string, count: string | number }>).map((row) => [row.result, Number(row.count)]),
    )

    const now = options.now ?? new Date()
    const trendStart = query.start ?? new Date(now.getTime() - DEFAULT_TREND_DAYS * MILLISECONDS_PER_DAY)
    const trendWhere: FindOptionsWhere<LoginEvent> = { ...where }
    if (!trendWhere.createdAt) {
        trendWhere.createdAt = MoreThanOrEqual(trendStart)
    }
    const trendEnd = query.end ?? now
    const trendDays = Math.max(1, Math.ceil((trendEnd.getTime() - trendStart.getTime()) / MILLISECONDS_PER_DAY))
    /* 与热力图共用同一分桶表达式，避免 DATE() / DATE_FORMAT() 随数据库会话时区漂移 */
    const trendBucket = getLoginEventBucketExpression('day')
    const trendRows = await applyLoginEventWhere(repository.createQueryBuilder('event'), trendWhere)
        .select(trendBucket, 'bucket')
        .addSelect('COUNT(*)', 'count')
        .groupBy(trendBucket)
        .getRawMany()
    const trendCounts = new Map<string, number>()
    let droppedTrendBuckets = 0
    for (const row of trendRows as Array<{ bucket: unknown, count: string | number }>) {
        if (!isLoginEventBucketLabel(row.bucket, 'day')) {
            droppedTrendBuckets += 1
            continue
        }
        trendCounts.set(row.bucket, Number(row.count))
    }
    if (droppedTrendBuckets > 0) {
        logger.warn('Dropped login event trend buckets with unexpected labels', { droppedTrendBuckets })
    }

    return {
        total,
        timezone: 'UTC',
        byType: LOGIN_EVENT_TYPES.map((type) => ({ type, count: typeCounts.get(type) ?? 0 })),
        byResult: LOGIN_EVENT_RESULTS.map((result) => ({ result, count: resultCounts.get(result) ?? 0 })),
        distinctUsers: Number(userRow?.count ?? 0),
        distinctIps: Number(ipRow?.count ?? 0),
        trendDays,
        dailyTrend: [...trendCounts.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([date, count]) => ({ date, count })),
    }
}

export interface LoginEventHeatmap {
    days: number
    timezone: 'UTC'
    bucketUnit: 'hour' | 'day'
    /** 按时间升序的时间桶标签：小时 `YYYY-MM-DD HH:00`，天 `YYYY-MM-DD`（UTC） */
    buckets: string[]
    rows: Array<{ type: LoginEventType, values: number[] }>
    /** 最大桶计数，供前端色阶使用；空数据为 0 */
    max: number
}

const HOUR_MS = 60 * 60 * 1000

function floorToHour(date: Date): Date {
    const result = new Date(date)
    result.setUTCMinutes(0, 0, 0)
    return result
}

function floorToDay(date: Date): Date {
    const result = new Date(date)
    result.setUTCHours(0, 0, 0, 0)
    return result
}

function formatBucket(date: Date, unit: 'hour' | 'day'): string {
    const iso = date.toISOString()
    return unit === 'hour' ? `${iso.slice(0, 10)} ${iso.slice(11, 13)}:00` : iso.slice(0, 10)
}

/**
 * 时间 × 事件类型热力图聚合。
 *
 * `type × bucket` 计数在数据库侧 `GROUP BY`，JS 只补零桶与排序；窗口上限 30 天。
 */
export async function getLoginEventHeatmap(
    query: LoginEventQuery,
    options: {
        days: 7 | 30
        now?: Date
        repository?: Pick<Repository<LoginEvent>, 'createQueryBuilder'>
    },
): Promise<LoginEventHeatmap> {
    const { days } = options
    const unit: 'hour' | 'day' = days === 7 ? 'hour' : 'day'
    const now = options.now ?? new Date()
    const bucketCount = unit === 'hour' ? 7 * 24 : 30
    const windowEnd = unit === 'hour' ? floorToHour(now) : floorToDay(now)
    const windowStart = unit === 'hour'
        ? new Date(windowEnd.getTime() - (bucketCount - 1) * HOUR_MS)
        : new Date(windowEnd.getTime() - (bucketCount - 1) * MILLISECONDS_PER_DAY)

    const start = query.start && query.start > windowStart ? query.start : windowStart
    /* 当前小时 / 当前天只含已过去片段，右边界必须取 now，否则最新一列恒为 0 */
    const end = query.end && query.end < now ? query.end : now
    const where = { ...buildLoginEventWhere(query) }
    where.createdAt = Between(start, end)

    const repository = options.repository ?? dataSource.getRepository(LoginEvent)
    const bucketExpression = getLoginEventBucketExpression(unit)
    const rawRows = await repository.createQueryBuilder('event')
        .where(where)
        .select('event.type', 'type')
        .addSelect(bucketExpression, 'bucket')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.type')
        .addGroupBy(bucketExpression)
        .getRawMany()

    const buckets = Array.from({ length: bucketCount }, (_, index) => formatBucket(
        unit === 'hour'
            ? new Date(windowStart.getTime() + index * HOUR_MS)
            : new Date(windowStart.getTime() + index * MILLISECONDS_PER_DAY),
        unit,
    ))
    const indexByBucket = new Map(buckets.map((bucket, index) => [bucket, index]))
    const rowValues = new Map<LoginEventType, number[]>(
        LOGIN_EVENT_TYPES.map((type) => [type, Array.from({ length: bucketCount }, () => 0)]),
    )
    let droppedBuckets = 0

    for (const row of rawRows as Array<{ type: unknown, bucket: unknown, count: string | number }>) {
        if (!isLoginEventType(row.type) || !isLoginEventBucketLabel(row.bucket, unit)) {
            droppedBuckets += 1
            continue
        }
        const index = indexByBucket.get(row.bucket)
        if (index === undefined) {
            droppedBuckets += 1
            continue
        }
        const values = rowValues.get(row.type)
        if (values) {
            values[index] = Number(row.count)
        }
    }
    if (droppedBuckets > 0) {
        logger.warn('Dropped login event heatmap buckets with unexpected labels', { droppedBuckets, unit })
    }

    let max = 0
    for (const values of rowValues.values()) {
        for (const value of values) {
            max = Math.max(max, value)
        }
    }

    return {
        days,
        timezone: 'UTC',
        bucketUnit: unit,
        buckets,
        rows: LOGIN_EVENT_TYPES.map((type) => ({ type, values: rowValues.get(type) ?? [] })),
        max,
    }
}
