import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { checkAdmin } from '@/server/utils/check-admin'
import { auditFromEvent } from '@/server/utils/audit-log'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { findTrustedDevice, revokeTrustedDevice } from '@/server/utils/trusted-devices'
import { validateParamsSafe } from '@/server/utils/validation'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

const paramsSchema = z.object({ id: z.string().min(1).max(64), deviceId: z.string().min(1).max(64) })

/** 管理员吊销指定用户的可信设备（阶段 12 M4.3，语义与用户侧一致） */
export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, paramsSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }
    const device = await findTrustedDevice({ userId: params.data.id, id: params.data.deviceId })
    if (!device) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.security.trustedDeviceNotFound' })
    }
    await revokeTrustedDevice({ userId: params.data.id, id: device.id })
    auditFromEvent(event, {
        action: 'trustedDevice.revoke',
        actorId: auth.data.userId,
        targetUserId: params.data.id,
        after: { identifier: device.identifier },
        source: 'admin',
    })
    return { status: true }
})
