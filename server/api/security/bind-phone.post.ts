import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { phoneSchema } from '@/utils/shared/validators'

const bindPhoneBodySchema = z.object({
    phoneNumber: phoneSchema,
    code: z.string().regex(/^\d{6}$/u),
})

/**
 * 用户自助绑定 / 换绑手机（阶段 9 M7）。
 *
 * 上游 `verifyPhoneNumber` 在号码被占用时会落到数据库唯一约束，表现为 500。
 * 这里先做占用检查，返回可本地化的 `TARGET_TAKEN`。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { userId } = await getUserSession(event)
    const body = await readBody(event)
    const result = bindPhoneBodySchema.safeParse(body)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            message: result.error.issues[0]?.message ?? 'Invalid phone number',
            data: { code: 'TARGET_INVALID' },
        })
    }

    const { phoneNumber, code } = result.data
    const existing = await dataSource.getRepository(User).findOne({ where: { phoneNumber } })
    if (existing && existing.id !== userId) {
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.targetTaken',
            data: { code: 'TARGET_TAKEN' },
        })
    }

    return auth.api.verifyPhoneNumber({
        body: { phoneNumber, code, updatePhoneNumber: true },
        headers: event.headers,
    })
})
