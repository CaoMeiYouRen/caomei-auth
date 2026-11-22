import { defineEventHandler } from 'h3'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { checkAdmin } from '@/server/utils/check-admin'
import { auditFromEvent } from '@/server/utils/audit-log'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/** 管理员按用户批量撤销会话（阶段 12 M4.3），复用 admin 插件并补审计 */
export default defineEventHandler(async (event) => {
    const admin = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }
    const user = await dataSource.getRepository(User).findOne({ where: { id: params.data.id }, select: ['id'] })
    if (!user) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }
    await auth.api.revokeUserSessions({
        body: { userId: params.data.id },
        headers: event.headers,
    })
    auditFromEvent(event, {
        action: 'session.revokeAll',
        actorId: admin.data.userId,
        targetUserId: params.data.id,
        after: null,
        source: 'admin',
    })
    return { status: true }
})
