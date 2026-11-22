import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { rateLimit } from '@/server/utils/rate-limit'
import { auditFromEvent } from '@/server/utils/audit-log'
import {
    findTrustedDevice,
    parseTrustedDeviceIdentifierValue,
    revokeTrustedDevice,
    TRUST_DEVICE_COOKIE_NAMES,
} from '@/server/utils/trusted-devices'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/**
 * 吊销当前用户的可信设备（阶段 12 M4.2）。
 *
 * 删除 `verification` 行 + 实体并写审计；若吊销的是当前浏览器正在使用的设备，
 * 同时清除 `trust_device` cookie，避免下次登录继续免 2FA。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 10 })
    const { t } = await getServerI18n(event)
    const { userId } = await getUserSession(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }

    const device = await findTrustedDevice({ userId, id: params.data.id })
    if (!device) {
        throw await createLocalizedError(event, {
            statusCode: 404,
            key: 'errors.security.trustedDeviceNotFound',
            data: { code: 'TRUSTED_DEVICE_NOT_FOUND' },
        })
    }

    const cookieName = TRUST_DEVICE_COOKIE_NAMES.find((name) => Boolean(getCookie(event, name)))
    const currentIdentifier = cookieName
        ? parseTrustedDeviceIdentifierValue(getCookie(event, cookieName))
        : null
    await revokeTrustedDevice({ userId, id: device.id })
    auditFromEvent(event, {
        action: 'trustedDevice.revoke',
        actorId: userId,
        targetUserId: userId,
        after: { identifier: device.identifier },
        source: 'web',
    })
    if (cookieName && currentIdentifier === device.identifier) {
        deleteCookie(event, cookieName, {
            path: '/',
            secure: cookieName.startsWith('__Secure-'),
        })
    }

    return { status: true }
})
