import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getUserSession } from '@/server/utils/get-user-session'
import { auditFromEvent } from '@/server/utils/audit-log'

const bodySchema = z.object({
    password: z.string().min(1).max(64),
    method: z.enum(['totp', 'otp']).optional(),
})

/**
 * 启用两步验证（阶段 9 M1：2FA 开关写审计）。
 *
 * 上游 `before`/`after` 钩子无法区分 2FA 开关，这里包一层只做转发与审计，
 * 用户可见行为与 `authClient.twoFactor.enable` 保持一致。
 */
export default defineEventHandler(async (event) => {
    const { user, userId } = await getUserSession(event)
    const body = await readBody(event)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Password required',
        })
    }

    const response = await auth.api.enableTwoFactor({
        body: {
            password: parsed.data.password,
            method: parsed.data.method ?? 'totp',
        },
        headers: event.headers,
    })

    auditFromEvent(event, {
        action: 'twoFactor.enable',
        actorId: userId,
        targetUserId: userId,
        before: { twoFactorEnabled: Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled) },
        after: { twoFactorEnabled: true, method: response.method },
        source: 'web',
    })

    return response
})
