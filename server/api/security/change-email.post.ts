import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { rateLimit } from '@/server/utils/rate-limit'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { emailSchema } from '@/utils/shared/validators'

const changeEmailBodySchema = z.object({
    newEmail: emailSchema,
    callbackURL: z.string().max(2048).optional(),
})

/**
 * 用户自助修改 / 绑定邮箱（阶段 9 M7）。
 *
 * 上游 `changeEmail` 在目标邮箱已存在时仍返回 `status: true`，前端会误报成功。
 * 这里先做占用检查再调用上游；错误码 `TARGET_TAKEN` 由前端本地化展示。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { userId } = await getUserSession(event)
    const body = await readBody(event)
    const result = changeEmailBodySchema.safeParse(body)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            message: result.error.issues[0]?.message ?? 'Invalid email',
            data: { code: 'TARGET_INVALID' },
        })
    }

    const { newEmail, callbackURL } = result.data
    if (newEmail.toLowerCase() === (await findCurrentEmail(userId))?.toLowerCase()) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.targetInvalid',
            data: { code: 'TARGET_INVALID' },
        })
    }

    const existing = await dataSource.getRepository(User).findOne({ where: { email: newEmail } })
    if (existing && existing.id !== userId) {
        throw await createLocalizedError(event, {
            statusCode: 409,
            key: 'errors.recovery.targetTaken',
            data: { code: 'TARGET_TAKEN' },
        })
    }

    return auth.api.changeEmail({
        body: { newEmail, callbackURL },
        headers: event.headers,
    })
})

async function findCurrentEmail(userId: string): Promise<string | null> {
    const user = await dataSource.getRepository(User).findOne({ where: { id: userId } })
    return user?.email ?? null
}
