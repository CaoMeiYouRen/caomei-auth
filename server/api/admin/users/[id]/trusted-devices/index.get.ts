import { defineEventHandler } from 'h3'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { listTrustedDevices } from '@/server/utils/trusted-devices'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/** 管理员查看指定用户的可信设备（阶段 12 M4.3） */
export default defineEventHandler(async (event) => {
    await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }
    const devices = await listTrustedDevices(params.data.id)
    const now = Date.now()
    return {
        status: true,
        data: {
            devices: devices.map((device) => ({
                id: device.id,
                userAgent: device.userAgent,
                ip: device.ip,
                createdAt: device.createdAt,
                expiresAt: device.expiresAt,
                lastUsedAt: device.lastUsedAt,
                expired: new Date(device.expiresAt).getTime() <= now,
            })),
        },
    }
})
