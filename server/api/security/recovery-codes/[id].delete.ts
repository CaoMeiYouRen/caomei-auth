import { defineEventHandler } from 'h3'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { rateLimit } from '@/server/utils/rate-limit'
import { auditFromEvent } from '@/server/utils/audit-log'
import { deleteRecoveryCode } from '@/server/utils/recovery-code'

/**
 * 删除单条恢复码（阶段 10 M1.2）。
 *
 * 只能删除自己的恢复码；不存在与不属于当前账号统一返回 404，避免暴露存在性。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 10 })
    const { t } = await getServerI18n(event)
    const { userId } = await getUserSession(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }

    const deleted = await deleteRecoveryCode({ userId, id: params.data.id })
    if (!deleted) {
        throw await createLocalizedError(event, {
            statusCode: 404,
            key: 'errors.recovery.recoveryCodeNotFound',
            data: { code: 'RECOVERY_CODE_NOT_FOUND' },
        })
    }

    auditFromEvent(event, {
        action: 'recoveryCodes.delete',
        actorId: userId,
        targetUserId: userId,
        after: { id: params.data.id },
        source: 'web',
    })

    return { status: true }
})
