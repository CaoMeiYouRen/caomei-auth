import { APIError } from 'better-auth/api'
import { LessThanOrEqual, type EntityManager, type Repository } from 'typeorm'
import { writeAuditEvent } from './audit-log'
import { emailService } from './email/service'
import { maskEmail } from './privacy'
import { evaluateRegistration } from './registration-policy'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { dataSource } from '@/server/database'

/**
 * 冷静期到期生效（阶段 10 M3.1）。
 *
 * 约束：
 * - 单事务内完成「状态推进 + 邮箱覆写 + emailVerified + DB 会话删除 + confirmedAt」；
 * - 生效前复查目标占用与注册策略，冲突则取消请求并通知，不落库；
 * - 审计与通知在事务外写入，不随回滚消失；
 * - 没有后台调度器：登录（任意通道）与状态查询读路径调用本函数，惰性生效。
 */

export type ChannelChangeApplyFailure =
    | 'NOT_FOUND'
    | 'NOT_DUE'
    | 'ALREADY_HANDLED'
    | 'USER_NOT_FOUND'
    | 'RACE_LOST'
    | 'TARGET_TAKEN'
    | 'REGISTRATION_NOT_ALLOWED'

export type ChannelChangeApplyResult =
    | {
        applied: true
        requestId: string
        userId: string
        oldEmail: string | null
        newEmail: string
        scheduledAt: Date
    }
    | { applied: false, reason: ChannelChangeApplyFailure, requestId?: string }

interface ApplyTransactionOutcome {
    applied: boolean
    reason?: ChannelChangeApplyFailure
    request?: ChannelChangeRequest
    oldEmail?: string | null
    scheduledTokens?: string[]
    userId?: string
}

function toTime(value: Date | string | null | undefined): number {
    if (!value) {
        return Number.NaN
    }
    return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/**
 * 执行到期生效（幂等）。
 *
 * 并发登录下只有一次能通过 `status = pending` 条件更新，其余返回 RACE_LOST。
 */
export async function applyScheduledChannelChange(
    requestId: string,
    options: { now?: number } = {},
): Promise<ChannelChangeApplyResult> {
    const now = options.now ?? Date.now()
    const outcome = await dataSource.transaction<ApplyTransactionOutcome>(async (manager) => (
        applyWithinTransaction(manager, requestId, now)
    ))

    if (!outcome.applied || !outcome.request) {
        return { applied: false, reason: outcome.reason ?? 'NOT_DUE', requestId }
    }

    const request = outcome.request
    const oldEmail = outcome.oldEmail ?? null
    const newEmail = request.newValue

    /* 事务提交后再清二级存储，避免回滚后会话缓存被误删 */
    await invalidateCachedSessions(outcome.userId ?? request.userId, outcome.scheduledTokens ?? [])

    writeAuditEvent({
        action: 'email.change.apply',
        targetUserId: request.userId,
        before: { email: oldEmail },
        after: { email: newEmail, scheduledAt: request.scheduledAt?.toISOString?.() ?? null },
        reason: `source:${request.source}`,
        source: 'system',
    })

    await notifyAppliedChange(request, oldEmail, newEmail)

    return {
        applied: true,
        requestId: request.id,
        userId: request.userId,
        oldEmail,
        newEmail,
        scheduledAt: request.scheduledAt ?? new Date(now),
    }
}

async function applyWithinTransaction(
    manager: EntityManager,
    requestId: string,
    now: number,
): Promise<ApplyTransactionOutcome> {
    const requestRepository = manager.getRepository(ChannelChangeRequest)
    const request = await requestRepository.findOne({ where: { id: requestId } })
    if (!request) {
        return { applied: false, reason: 'NOT_FOUND' }
    }
    if (request.status !== 'pending' || !request.scheduledAt) {
        return { applied: false, reason: 'ALREADY_HANDLED', request }
    }
    if (toTime(request.scheduledAt) > now) {
        return { applied: false, reason: 'NOT_DUE', request }
    }

    const userRepository = manager.getRepository(User)
    const user = await userRepository.findOne({ where: { id: request.userId } })
    if (!user) {
        return { applied: false, reason: 'USER_NOT_FOUND', request }
    }

    const conflict = await userRepository.findOne({ where: { email: request.newValue } })
    if (conflict && conflict.id !== user.id) {
        await cancelRequest(requestRepository, request, now, 'target-taken')
        return { applied: false, reason: 'TARGET_TAKEN', request }
    }
    const registration = await evaluateRegistration({ email: request.newValue })
    if (!registration.allowed) {
        await cancelRequest(requestRepository, request, now, 'registration-not-allowed')
        return { applied: false, reason: 'REGISTRATION_NOT_ALLOWED', request }
    }

    const oldEmail = user.email ?? null
    const sessions = await manager.find(Session, {
        where: { userId: user.id },
        select: ['id', 'token'],
    })

    /* 条件更新：只有仍为 pending 的请求能被推进，天然防并发重复生效 */
    const updated = await requestRepository.update(
        { id: request.id, status: 'pending' },
        { status: 'confirmed', confirmedAt: new Date(now) },
    )
    if (!(updated.affected ?? 0)) {
        return { applied: false, reason: 'RACE_LOST', request }
    }

    user.email = request.newValue
    user.emailVerified = true
    await userRepository.save(user)

    /* 直接删 session 表，保证与状态推进同事务；二级存储在提交后处理 */
    await manager.delete(Session, { userId: user.id })

    request.status = 'confirmed'
    request.confirmedAt = new Date(now)
    return {
        applied: true,
        request,
        oldEmail,
        scheduledTokens: sessions.map((session) => session.token).filter(Boolean),
        userId: user.id,
    }
}

async function cancelRequest(
    repository: Repository<ChannelChangeRequest>,
    request: ChannelChangeRequest,
    now: number,
    reason: string,
): Promise<void> {
    request.status = 'cancelled'
    request.cancelledAt = new Date(now)
    await repository.save(request)
    writeAuditEvent({
        action: 'email.change.apply',
        targetUserId: request.userId,
        result: 'failure',
        reason,
        after: { email: request.newValue },
        source: 'system',
    })
}

/** 清理 Redis / LRU 中的同批会话（DB 行已在事务内删除） */
async function invalidateCachedSessions(userId: string, tokens: string[]): Promise<void> {
    try {
        const { auth } = await import('@/lib/auth')
        const context = await auth.$context
        const storage = context.secondaryStorage
        if (!storage) {
            return
        }
        await storage.delete(`active-sessions-${userId}`)
        await Promise.all(tokens.map((token) => storage.delete(token)))
    } catch (error) {
        writeAuditEvent({
            action: 'email.change.apply',
            targetUserId: userId,
            result: 'failure',
            reason: `revoke-session-cache: ${error instanceof Error ? error.message : String(error)}`,
            source: 'system',
        })
    }
}

/** 新旧邮箱双通道通知；旧邮箱不可投递时回落到新邮箱并记录原因 */
async function notifyAppliedChange(
    request: ChannelChangeRequest,
    oldEmail: string | null,
    newEmail: string,
): Promise<void> {
    const detail = `email: ${maskEmail(newEmail)}`
    let delivered = false
    if (oldEmail) {
        try {
            await emailService.sendChannelChangeNotification(oldEmail, detail)
            delivered = true
        } catch (error) {
            writeAuditEvent({
                action: 'channel.change.notify',
                targetUserId: request.userId,
                result: 'failure',
                reason: `old-email: ${error instanceof Error ? error.message : String(error)}`,
                source: 'system',
            })
        }
    }
    if (!delivered) {
        try {
            await emailService.sendChannelChangeNotification(newEmail, detail)
            delivered = true
        } catch (error) {
            writeAuditEvent({
                action: 'channel.change.notify',
                targetUserId: request.userId,
                result: 'failure',
                reason: `new-email: ${error instanceof Error ? error.message : String(error)}`,
                source: 'system',
            })
        }
    }
    if (delivered) {
        writeAuditEvent({
            action: 'channel.change.notify',
            targetUserId: request.userId,
            after: { channel: 'email' },
            source: 'system',
        })
    }
}

/**
 * 找出该用户所有到期未生效的自助改绑请求并依次生效。
 *
 * 供登录会话创建钩子与状态查询端点调用。
 */
export async function applyDueChannelChanges(
    userId: string,
    options: { now?: number } = {},
): Promise<ChannelChangeApplyResult> {
    const now = options.now ?? Date.now()
    const due = await dataSource.getRepository(ChannelChangeRequest).find({
        where: {
            userId,
            status: 'pending',
            source: 'user',
            scheduledAt: LessThanOrEqual(new Date(now)),
        },
    })
    if (!due.length) {
        return { applied: false, reason: 'NOT_DUE' }
    }
    due.sort((left, right) => toTime(left.scheduledAt) - toTime(right.scheduledAt))
    let last: ChannelChangeApplyResult = { applied: false, reason: 'NOT_DUE' }
    for (const request of due) {
        last = await applyScheduledChannelChange(request.id, { now })
        if (last.applied) {
            return last
        }
    }
    return last
}

/**
 * 登录会话创建前调用：到期即生效，并终止本次登录（旧邮箱不得再进入）。
 */
export async function applyChannelChangeBeforeSession(userId: string): Promise<void> {
    const result = await applyDueChannelChanges(userId)
    if (result.applied) {
        throw new APIError('CONFLICT', {
            message: 'The email change is now effective. Sign in with the new email address.',
            code: 'CHANNEL_CHANGE_APPLIED',
        })
    }
}
