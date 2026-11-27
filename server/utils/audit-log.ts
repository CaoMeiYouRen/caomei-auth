import type { H3Event } from 'h3'
import { resolveClientIp } from './client-ip'
import logger from './logger'
import { maskEmail, maskPhone } from './privacy'

/**
 * 账号恢复路径的结构化审计。
 *
 * 设计约束（阶段 9 M1）：
 * - 复用 `logger` 的 audit 文件通道，不新建审计表；
 * - 只记录状态差异，邮箱 / 手机号脱敏，验证码、密码、令牌一律不落盘；
 * - `writeAuditEvent` 永不抛错，避免审计失败影响用户可见行为。
 *
 * 事实源：docs/design/governance/2026-11-19-phase9-registration.md §5.1。
 */
export const AUDIT_ACTIONS = [
    'channel.change.request',
    'channel.change.confirm',
    'channel.change.notify',
    'twoFactor.enable',
    'twoFactor.disable',
    'backupCodes.regenerate',
    'password.reset',
    'password.reset.request',
    'password.reset.forced',
    'social.bind',
    'phone.bind',
    'recoveryCodes.generate',
    'recoveryCodes.regenerate',
    'recoveryCodes.consume',
    'recoveryCodes.delete',
    'proof.verify',
    'proof.otp.send',
    'email.change.request',
    'email.change.confirm',
    'email.change.cancel',
    'email.change.apply',
    'password.set.selfService',
    'twoFactor.challenge',
    'twoFactor.verify',
    'session.revokeAll',
    'trustedDevice.create',
    'trustedDevice.revoke',
] as const

export type AuditAction = typeof AUDIT_ACTIONS[number]

export type AuditSource = 'web' | 'admin' | 'system'

export interface AuditEventInput {
    /** 事件类型（固定枚举） */
    action: AuditAction
    /** 操作人；匿名请求为 null */
    actorId?: string | null
    /** 被操作的用户 */
    targetUserId?: string | null
    /** 变更前状态（仅差异字段，已脱敏） */
    before?: Record<string, unknown> | null
    /** 变更后状态（仅差异字段，已脱敏） */
    after?: Record<string, unknown> | null
    result?: 'success' | 'failure'
    /** 失败原因或管理员填写的原因 */
    reason?: string | null
    source?: AuditSource
    ip?: string | null
    userAgent?: string | null
}

export interface AuditEntry extends Required<Omit<AuditEventInput, 'before' | 'after' | 'reason' | 'ip' | 'userAgent'>> {
    timestamp: string
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
    reason: string | null
    ip: string | null
    userAgent: string | null
}

const SENSITIVE_KEY_PATTERN = /(password|passcode|token|secret|otp|code|codes|hash)$/iu
const EMAIL_KEY_PATTERN = /email|mail/iu
const PHONE_KEY_PATTERN = /phone|mobile|tel/iu

/** 递归脱敏：敏感键完全隐藏，邮箱 / 手机号按统一口径掩码 */
export function sanitizeAuditValue(value: unknown, key = ''): unknown {
    if (value === null || value === undefined) {
        return null
    }
    if (SENSITIVE_KEY_PATTERN.test(key)) {
        return '[REDACTED]'
    }
    if (typeof value === 'string') {
        if (EMAIL_KEY_PATTERN.test(key)) {
            return maskEmail(value)
        }
        if (PHONE_KEY_PATTERN.test(key)) {
            return maskPhone(value)
        }
        return value
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeAuditValue(item, key))
    }
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .map(([childKey, childValue]) => [childKey, sanitizeAuditValue(childValue, childKey)]),
        )
    }
    return String(value)
}

/** 生成可写入日志的审计条目（纯函数，便于单测） */
export function buildAuditEntry(input: AuditEventInput): AuditEntry {
    return {
        timestamp: new Date().toISOString(),
        action: input.action,
        actorId: input.actorId ?? null,
        targetUserId: input.targetUserId ?? null,
        before: input.before ? sanitizeAuditValue(input.before) as Record<string, unknown> : null,
        after: input.after ? sanitizeAuditValue(input.after) as Record<string, unknown> : null,
        result: input.result ?? 'success',
        reason: input.reason ?? null,
        source: input.source ?? 'web',
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
    }
}

/** 写入审计通道；任何异常只告警，不影响主流程 */
export function writeAuditEvent(input: AuditEventInput): void {
    try {
        logger.audit.record({ ...buildAuditEntry(input) })
    } catch (error) {
        logger.warn('Failed to write audit event', {
            action: input.action,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

/** 从 Web Request 提取来源信息（兼容测试中的最小对象） */
export function requestAuditMeta(request?: RequestLike | null): { ip: string | null, userAgent: string | null } {
    const headers = request?.headers
    if (!headers || typeof headers.get !== 'function') {
        return { ip: null, userAgent: null }
    }
    return {
        ip: resolveClientIp(headers.get('x-forwarded-for'), headers.get('x-real-ip')),
        userAgent: headers.get('user-agent') || null,
    }
}

/** 从 H3 请求提取来源信息与操作人（由日志中间件写入上下文） */
export function eventAuditMeta(event: H3Event): {
    ip: string | null
    userAgent: string | null
    actorId: string | null
} {
    const headers = event.node?.req?.headers
    const forwarded = typeof headers?.['x-forwarded-for'] === 'string' ? headers['x-forwarded-for'] : undefined
    const realIp = typeof headers?.['x-real-ip'] === 'string' ? headers['x-real-ip'] : undefined
    const userAgent = typeof headers?.['user-agent'] === 'string' ? headers['user-agent'] : null
    return {
        ip: resolveClientIp(forwarded, realIp),
        userAgent,
        actorId: (event.context?.authUserId as string | undefined) ?? null,
    }
}

/** 带请求上下文的审计写入（供 API Handler 使用） */
export function auditFromEvent(event: H3Event, input: Omit<AuditEventInput, 'ip' | 'userAgent' | 'actorId'> & {
    actorId?: string | null
}): void {
    const meta = eventAuditMeta(event)
    writeAuditEvent({
        ...input,
        actorId: input.actorId ?? meta.actorId,
        ip: meta.ip,
        userAgent: meta.userAgent,
    })
}
