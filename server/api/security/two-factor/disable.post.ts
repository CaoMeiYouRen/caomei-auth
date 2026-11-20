import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getUserSession } from '@/server/utils/get-user-session'
import { auditFromEvent } from '@/server/utils/audit-log'

const bodySchema = z.object({
    password: z.string().min(1).max(64),
})

/** 关闭两步验证（阶段 9 M1：2FA 开关写审计） */
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

    const response = await auth.api.disableTwoFactor({
        body: { password: parsed.data.password },
        headers: event.headers,
    })

    auditFromEvent(event, {
        action: 'twoFactor.disable',
        actorId: userId,
        targetUserId: userId,
        before: { twoFactorEnabled: Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled) },
        after: { twoFactorEnabled: false },
        source: 'web',
    })

    return response
})
