import type { Repository } from 'typeorm'
import { pruneLoginEvents, type LoginEventPruneResult } from './repository'
import type { LoginEvent } from '@/server/entities/login-event'
import logger from '@/server/utils/logger'
import {
    LOGIN_EVENT_RETENTION_DEFAULT_DAYS,
    LOGIN_EVENT_RETENTION_MAX_DAYS,
    LOGIN_EVENT_RETENTION_MIN_DAYS,
    resolveLoginEventRetentionDays,
} from '@/utils/shared/login-event-retention'

/**
 * 登录事件保留期与惰性清理（阶段 12 M1.3 / D19）。
 *
 * 默认保留 90 天，`LOGIN_EVENT_RETENTION_DAYS` 可配置（1–3650）；
 * 管理端统计查询触发清理，进程内 1 小时节流，不引入常驻调度器。
 */
export {
    LOGIN_EVENT_RETENTION_DEFAULT_DAYS,
    LOGIN_EVENT_RETENTION_MAX_DAYS,
    LOGIN_EVENT_RETENTION_MIN_DAYS,
    resolveLoginEventRetentionDays,
}
export const LOGIN_EVENT_PRUNE_THROTTLE_MS = 60 * 60 * 1000

/** 从环境变量读取保留天数（服务端与脚本共用同一解析规则） */
export function getLoginEventRetentionDays(env: Record<string, string | undefined> = process.env): number {
    return resolveLoginEventRetentionDays(env.LOGIN_EVENT_RETENTION_DAYS)
}

type PruneRepository = Pick<Repository<LoginEvent>, 'delete'>

let lastPruneAt = Number.NEGATIVE_INFINITY
let pruneInFlight: Promise<LoginEventPruneResult> | null = null

/**
 * 按进程内节流触发清理；未到期时返回 null。
 *
 * 并发调用复用同一个 in-flight 任务，避免统计查询并发时重复删除；
 * 失败会重置节流时间，允许下次查询重试。
 */
export async function pruneLoginEventsIfDue(options: {
    now?: number
    force?: boolean
    retentionDays?: number
    repository?: PruneRepository
} = {}): Promise<LoginEventPruneResult | null> {
    const now = options.now ?? Date.now()
    if (pruneInFlight) {
        return pruneInFlight
    }
    if (!options.force && now - lastPruneAt < LOGIN_EVENT_PRUNE_THROTTLE_MS) {
        return null
    }
    lastPruneAt = now
    pruneInFlight = pruneLoginEvents({
        retentionDays: options.retentionDays ?? getLoginEventRetentionDays(),
        now: new Date(now),
        repository: options.repository,
    }).then((result) => {
        if (result.deleted > 0) {
            logger.info('Login events pruned by retention policy', {
                deleted: result.deleted,
                cutoff: result.cutoff.toISOString(),
            })
        }
        return result
    }).catch((error) => {
        logger.warn('Failed to prune login events', {
            error: error instanceof Error ? error.message : String(error),
        })
        lastPruneAt = Number.NEGATIVE_INFINITY
        throw error
    }).finally(() => {
        pruneInFlight = null
    })
    return pruneInFlight
}

/** 仅测试使用：清除节流状态，避免用例之间互相影响 */
export function resetLoginEventPruneThrottle(): void {
    lastPruneAt = Number.NEGATIVE_INFINITY
    pruneInFlight = null
}
