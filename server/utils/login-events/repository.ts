import { Between, In, LessThan, LessThanOrEqual, MoreThanOrEqual, type FindOptionsWhere, type Repository } from 'typeorm'
import { LoginEvent } from '@/server/entities/login-event'
import { dataSource } from '@/server/database'
import logger from '@/server/utils/logger'
import { maskEmail } from '@/utils/shared/privacy'
import {
    isLoginEventResult,
    isLoginEventType,
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
    options: { repository?: LoginEventRepository } = {},
): Promise<LoginEvent> {
    if (!isLoginEventType(input.type)) {
        throw new TypeError(`Unknown login event type: ${String(input.type)}`)
    }
    if (!isLoginEventResult(input.result)) {
        throw new TypeError(`Unknown login event result: ${String(input.result)}`)
    }
    const repository = resolveRepository(options.repository)
    const event = repository.create({
        type: input.type,
        result: input.result,
        channel: normalizeLoginEventChannel(input.channel),
        userId: input.userId ?? null,
        ip: input.ip?.trim() || null,
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
    repository?: LoginEventRepository
}): Promise<LoginEventPruneResult> {
    if (!Number.isFinite(options.retentionDays) || options.retentionDays <= 0) {
        throw new RangeError(`Invalid login event retention days: ${String(options.retentionDays)}`)
    }
    const now = options.now ?? new Date()
    const cutoff = new Date(now.getTime() - options.retentionDays * MILLISECONDS_PER_DAY)
    if (!Number.isFinite(now.getTime()) || !Number.isFinite(cutoff.getTime())) {
        throw new RangeError(`Invalid login event cutoff: ${String(now)}`)
    }
    const result = await resolveRepository(options.repository).delete({ createdAt: LessThan(cutoff) })
    return { cutoff, deleted: result.affected ?? 0 }
}
