import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent } from '@/server/utils/audit-log'
import { consumeProofFactor, verifyRecoveryProof, type RecoveryProofFailure } from '@/server/utils/recovery-proof'
import { createChannelChangeRequest } from '@/server/utils/channel-change'
import { evaluateRegistration } from '@/server/utils/registration-policy'
import { emailService } from '@/server/utils/email/service'
import { notifyChannelChangeLifecycle } from '@/server/utils/channel-change-notify'
import { maskEmail } from '@/server/utils/privacy'
import { emailSchema } from '@/utils/shared/validators'

const bodySchema = z.object({
    newEmail: emailSchema,
    /** 改邮箱必须提供密码；OAuth-only 用户应走自助设密码后再来 */
    password: z.string().min(1).max(128),
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
 * 自助申请更换已验证邮箱（阶段 10 M2.3）。
 *
 * 流程：密码 + 恢复因子校验 → 事务内消费因子并创建 pending 请求 → 向新邮箱发送归属验证码。
 * 新邮箱未完成归属验证前不进入冷静期；同一用户只保留一个 pending 请求。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { userId } = await getUserSession(event)
    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid payload',
            data: { code: 'INVALID_PAYLOAD' },
        })
    }

    const newEmail = parsed.data.newEmail.trim().toLowerCase()
    const user = await dataSource.getRepository(User).findOne({ where: { id: userId } })
    if (!user) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }
    if (user.email && user.email.toLowerCase() === newEmail) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.targetInvalid',
            data: { code: 'TARGET_INVALID' },
        })
    }

    /* 目标占用先做一次检查；事务内仍会以唯一性 / 状态兜底 */
    const existing = await dataSource.getRepository(User).findOne({ where: { email: newEmail } })
    if (existing && existing.id !== userId) {
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.targetTaken',
            data: { code: 'TARGET_TAKEN' },
        })
    }

    const registrationDecision = await evaluateRegistration({ email: newEmail })
    if (!registrationDecision.allowed) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.registration.notAllowed',
            data: { code: 'REGISTRATION_NOT_ALLOWED' },
        })
    }

    const proof = await verifyRecoveryProof({
        userId,
        purpose: 'change-email',
        password: parsed.data.password,
        factor: parsed.data.factor,
        code: parsed.data.code,
    })
    if (!proof.ok) {
        const mapping = FAILURE_MAP[proof.reason]
        throw await createLocalizedError(event, {
            statusCode: mapping.statusCode,
            key: mapping.key,
            data: { code: proof.reason },
        })
    }

    const created = await dataSource.transaction(async (manager) => {
        const consumed = await consumeProofFactor({
            userId,
            factor: proof.factor,
            code: parsed.data.code,
            timeStep: proof.timeStep,
            manager,
        })
        if (!consumed.ok) {
            return { ok: false as const, reason: consumed.reason ?? 'PROOF_CONSUMED' }
        }
        const { request, code } = await createChannelChangeRequest({
            userId,
            channel: 'email',
            value: newEmail,
            source: 'user',
            proofFactor: proof.factor,
            repository: manager.getRepository(ChannelChangeRequest),
        })
        return { ok: true as const, request, code }
    })

    if (!created.ok) {
        const mapping = FAILURE_MAP[created.reason]
        throw await createLocalizedError(event, {
            statusCode: mapping.statusCode,
            key: mapping.key,
            data: { code: created.reason },
        })
    }

    auditFromEvent(event, {
        action: 'email.change.request',
        actorId: userId,
        targetUserId: userId,
        before: { email: user.email },
        after: { email: newEmail, factor: proof.factor },
        source: 'web',
    })
    auditFromEvent(event, {
        action: 'proof.verify',
        actorId: userId,
        targetUserId: userId,
        after: { factor: proof.factor },
        reason: 'email-change-request',
        source: 'web',
    })

    const maskedTarget = maskEmail(newEmail)
    try {
        await emailService.sendChannelChangeCode(
            newEmail,
            created.code,
            maskedTarget,
            10,
            { request: { headers: event.headers } as Request },
        )
    } catch (error) {
        /* 发码失败不留下悬挂的 pending 请求 */
        const repository = dataSource.getRepository(ChannelChangeRequest)
        created.request.status = 'cancelled'
        created.request.cancelledAt = new Date()
        await repository.save(created.request)
        auditFromEvent(event, {
            action: 'email.change.request',
            actorId: userId,
            targetUserId: userId,
            after: { email: newEmail },
            result: 'failure',
            reason: error instanceof Error ? error.message : String(error),
            source: 'web',
        })
        throw await createLocalizedError(event, {
            statusCode: 502,
            key: 'errors.recovery.sendFailed',
            data: { code: 'SEND_FAILED' },
        })
    }

    /* 申请通知：旧邮箱可投递时提醒；失败只记录，不影响已创建的请求 */
    await notifyChannelChangeLifecycle({
        userId,
        event: 'request',
        oldEmail: user.email ?? null,
        newEmail,
    })

    return {
        status: true,
        data: {
            requestId: created.request.id,
            maskedTarget,
            factor: proof.factor,
            scheduledAt: null,
            requiresVerify: true,
        },
    }
})
