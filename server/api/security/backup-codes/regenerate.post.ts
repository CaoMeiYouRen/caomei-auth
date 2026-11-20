import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { auth } from '@/lib/auth'
import { getUserSession } from '@/server/utils/get-user-session'
import { auditFromEvent } from '@/server/utils/audit-log'

const bodySchema = z.object({
    password: z.string().min(1).max(64),
})

/**
 * 重新生成备份码（阶段 9 M5）。
 *
 * 必须携带当前密码（上游 `shouldRequirePassword` 默认要求）；旧备份码在成功后立即失效。
 * 返回的明文备份码只在本次响应中出现，审计只记录数量，不落盘。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 5 })
    const { userId } = await getUserSession(event)
    const body = await readBody(event)
    const result = bodySchema.safeParse(body)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            message: result.error.issues[0]?.message ?? 'Password required',
            data: { code: 'PASSWORD_REQUIRED' },
        })
    }

    const response = await auth.api.generateBackupCodes({
        body: { password: result.data.password },
        headers: event.headers,
    })

    auditFromEvent(event, {
        action: 'backupCodes.regenerate',
        actorId: userId,
        targetUserId: userId,
        after: { count: response.backupCodes.length },
        source: 'web',
    })

    return { status: true, backupCodes: response.backupCodes }
})
