import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { Session } from '@/server/entities/session'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent, writeAuditEvent } from '@/server/utils/audit-log'
import { auth } from '@/lib/auth'
import {
    consumeProofFactor,
    verifyRecoveryProof,
    type RecoveryProofFailure,
} from '@/server/utils/recovery-proof'

const bodySchema = z.object({
    newPassword: z.string().min(6).max(64),
    factor: z.enum(['recovery-code', 'phone-otp', 'totp', 'backup-code']),
    code: z.string().min(4).max(64),
})

const FAILURE_MAP: Record<RecoveryProofFailure, { statusCode: number, key: string }> = {
    PASSWORD_REQUIRED: { statusCode: 403, key: 'errors.recovery.proofRequired' },
    PASSWORD_INVALID: { statusCode: 403, key: 'errors.recovery.passwordInvalid' },
    PROOF_REQUIRED: { statusCode: 403, key: 'errors.recovery.proofRequired' },
    FACTOR_NOT_ALLOWED: { statusCode: 403, key: 'errors.recovery.factorNotAllowed' },
    FACTOR_UNAVAILABLE: { statusCode: 403, key: 'errors.recovery.factorUnavailable' },
    PROOF_INVALID: { statusCode: 403, key: 'errors.recovery.proofInvalid' },
    PROOF_CONSUMED: { statusCode: 403, key: 'errors.recovery.proofConsumed' },
    TOO_MANY_ATTEMPTS: { statusCode: 429, key: 'errors.recovery.proofLocked' },
    SESSION_NOT_FRESH: { statusCode: 403, key: 'errors.recovery.sessionNotFresh' },
}

/**
 * 受控自助设置密码（阶段 10 M4.1，D10）。
 *
 * 面向 OAuth-only 用户：新鲜会话（15 分钟内登录）+ 第二因子（恢复码 / TOTP / 备份码）。
 * 手机 OTP 由服务层 `PURPOSE_FACTORS` 强制排除（D3 延伸），调用方无法放宽。
 * 管理员仍不能代设密码（D8），本端点只接受当前用户自己的会话。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { userId, session } = await getUserSession(event)
    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        if (parsed.error.issues.some((issue) => issue.path.includes('newPassword'))) {
            throw await createLocalizedError(event, {
                statusCode: 400,
                key: 'errors.recovery.passwordTooWeak',
                data: { code: 'PASSWORD_TOO_WEAK' },
            })
        }
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid payload',
            data: { code: 'INVALID_PAYLOAD' },
        })
    }

    const proof = await verifyRecoveryProof({
        userId,
        purpose: 'self-service-password',
        factor: parsed.data.factor,
        code: parsed.data.code,
        sessionCreatedAt: session.session.createdAt,
    })
    if (!proof.ok) {
        const mapping = FAILURE_MAP[proof.reason]
        throw await createLocalizedError(event, {
            statusCode: mapping.statusCode,
            key: mapping.key,
            data: { code: proof.reason },
        })
    }

    const consumed = await consumeProofFactor({
        userId,
        factor: proof.factor,
        code: parsed.data.code,
        timeStep: proof.timeStep,
    })
    if (!consumed.ok) {
        const reason = consumed.reason ?? 'PROOF_CONSUMED'
        const mapping = FAILURE_MAP[reason]
        throw await createLocalizedError(event, {
            statusCode: mapping.statusCode,
            key: mapping.key,
            data: { code: reason },
        })
    }

    const context = await auth.$context
    const passwordHash = await context.password.hash(parsed.data.newPassword)
    const account = await context.internalAdapter.findCredentialAccount(userId)
    if (account) {
        await context.internalAdapter.updateAccount(account.id, { password: passwordHash })
    } else {
        await context.internalAdapter.linkAccount({
            userId,
            providerId: 'credential',
            accountId: userId,
            password: passwordHash,
        })
    }

    /* 撤销其他会话：保留当前会话，避免设置成功后立即被踢出 */
    await revokeOtherSessions(userId, session.session.token)

    auditFromEvent(event, {
        action: 'password.set.selfService',
        actorId: userId,
        targetUserId: userId,
        after: { factor: proof.factor },
        source: 'web',
    })

    return {
        status: true,
        data: {
            factor: proof.factor,
            otherSessionsRevoked: true,
        },
    }
})

async function revokeOtherSessions(userId: string, currentToken: string): Promise<void> {
    const repository = dataSource.getRepository(Session)
    const sessions = await repository.find({ where: { userId }, select: ['id', 'token'] })
    const others = sessions.filter((item) => item.token && item.token !== currentToken)
    for (const item of others) {
        await repository.delete({ id: item.id })
    }
    try {
        const context = await auth.$context
        const storage = context.secondaryStorage
        if (storage) {
            await storage.delete(`active-sessions-${userId}`)
            await Promise.all(others.map((item) => storage.delete(item.token)))
        }
    } catch (error) {
        /* 缓存清理失败不影响已完成的密码设置，但需要留痕 */
        writeAuditEvent({
            action: 'password.set.selfService',
            actorId: userId,
            targetUserId: userId,
            result: 'failure',
            reason: `revoke-session-cache: ${error instanceof Error ? error.message : String(error)}`,
            source: 'web',
        })
    }
}
