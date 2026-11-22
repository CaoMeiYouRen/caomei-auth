import { defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '@/server/utils/get-user-session'
import {
    listTrustedDevices,
    parseTrustedDeviceIdentifierValue,
    TRUST_DEVICE_COOKIE_NAMES,
} from '@/server/utils/trusted-devices'

/**
 * 当前用户的可信设备列表（阶段 12 M4.2）。
 *
 * 只返回本人记录；`expired` 由服务端计算，前端无需自行比较时间。
 */
export default defineEventHandler(async (event) => {
    const { userId } = await getUserSession(event)
    const devices = await listTrustedDevices(userId)
    const now = Date.now()
    const cookieName = TRUST_DEVICE_COOKIE_NAMES.find((name) => Boolean(getCookie(event, name)))
    const currentIdentifier = cookieName
        ? parseTrustedDeviceIdentifierValue(getCookie(event, cookieName))
        : null
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
                current: Boolean(currentIdentifier && currentIdentifier === device.identifier),
            })),
        },
    }
})
