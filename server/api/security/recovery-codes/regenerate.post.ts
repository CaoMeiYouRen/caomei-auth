import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent } from '@/server/utils/audit-log'
import { generateRecoveryCodes, isFreshSession } from '@/server/utils/recovery-code'
import { checkTotpFactor, consumeBackupCodeFactor, consumeTotpFactor } from '@/server/utils/proof-factors'

const bodySchema = z.object({
    /** 已启用 2FA 的账号必须提供第二因子；未启用时可省略 */
    factor: z.enum(['totp', 'backup-code']).optional(),
    code: z.string().min(4).max(32).optional(),
})

/**
 * 重新签发恢复码（阶段 10 M1.1）。
 *
 * - 要求新鲜会话（15 分钟内登录，服务端读 `session.createdAt`）；
 * - 已启用 2FA 的账号另需 TOTP 或备份码作为第二因子（OAuth-only 用户因此可自助生成）；
 * - 旧码在签发时整体失效；明文只在本次响应中出现一次，审计只记录数量。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { session, userId } = await getUserSession(event)

    let body: unknown = {}
    try {
        body = await readBody(event)
    } catch {
        body = {}
    }
    const parsed = bodySchema.safeParse(body ?? {})
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid payload',
            data: { code: 'INVALID_PAYLOAD' },
        })
    }

    if (!isFreshSession(session.session.createdAt)) {
        throw await createLocalizedError(event, {
            statusCode: 403,
            key: 'errors.recovery.sessionNotFresh',
            data: { code: 'SESSION_NOT_FRESH' },
        })
    }

    const user = await dataSource.getRepository(User).findOne({ where: { id: userId } })
    if (!user) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }

    if (user.twoFactorEnabled) {
        const { factor, code } = parsed.data
        if (!factor || !code) {
            throw await createLocalizedError(event, {
                statusCode: 403,
                key: 'errors.recovery.proofRequired',
                data: { code: 'PROOF_REQUIRED' },
            })
        }
        if (factor === 'totp') {
            const check = await checkTotpFactor(userId, code)
            if (!check.valid || check.timeStep === undefined) {
                throw await createLocalizedError(event, {
                    statusCode: 403,
                    key: check.reason === 'PROOF_CONSUMED' ? 'errors.recovery.proofConsumed' : 'errors.recovery.proofInvalid',
                    data: { code: check.reason ?? 'PROOF_INVALID' },
                })
            }
            const consumed = await consumeTotpFactor(userId, check.timeStep)
            if (!consumed) {
                throw await createLocalizedError(event, {
                    statusCode: 403,
                    key: 'errors.recovery.proofConsumed',
                    data: { code: 'PROOF_CONSUMED' },
                })
            }
            auditFromEvent(event, {
                action: 'proof.verify',
                actorId: userId,
                targetUserId: userId,
                after: { factor },
                reason: 'recovery-codes-regenerate',
                source: 'web',
            })
        } else {
            const consumed = await consumeBackupCodeFactor(userId, code)
            if (!consumed.ok) {
                throw await createLocalizedError(event, {
                    statusCode: 403,
                    key: consumed.reason === 'PROOF_CONSUMED' ? 'errors.recovery.proofConsumed' : 'errors.recovery.proofInvalid',
                    data: { code: consumed.reason ?? 'PROOF_INVALID' },
                })
            }
            auditFromEvent(event, {
                action: 'recoveryCodes.consume',
                actorId: userId,
                targetUserId: userId,
                after: { factor },
                reason: 'recovery-codes-regenerate',
                source: 'web',
            })
        }
    }

    const recoveryCodes = await generateRecoveryCodes({ userId })

    auditFromEvent(event, {
        action: 'recoveryCodes.regenerate',
        actorId: userId,
        targetUserId: userId,
        after: { count: recoveryCodes.length, twoFactorEnabled: Boolean(user.twoFactorEnabled) },
        source: 'web',
    })

    return {
        status: true,
        data: {
            recoveryCodes,
            remaining: recoveryCodes.length,
        },
    }
})
