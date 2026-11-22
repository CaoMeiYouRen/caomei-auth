// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: vi.fn() }))
vi.mock('@/server/utils/validation', () => ({ validateParamsSafe: vi.fn() }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: vi.fn(async () => ({ t: (key: string) => key })),
    createLocalizedError: vi.fn(async (_event: unknown, options: { statusCode: number, key: string }) => {
        const error = new Error(options.key)
        Object.assign(error, { statusCode: options.statusCode })
        return error
    }),
}))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: vi.fn() }))
vi.mock('@/server/utils/trusted-devices', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/trusted-devices')>()
    return { ...actual, listTrustedDevices: vi.fn(), findTrustedDevice: vi.fn(), revokeTrustedDevice: vi.fn() }
})
vi.mock('@/lib/auth', () => ({ auth: { api: { revokeUserSessions: vi.fn() } } }))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(() => ({ findOne: vi.fn(async () => ({ id: 'user-1' })) })),
    },
}))

const { checkAdmin } = await import('@/server/utils/check-admin')
const { validateParamsSafe } = await import('@/server/utils/validation')
const { auditFromEvent } = await import('@/server/utils/audit-log')
const { listTrustedDevices, findTrustedDevice, revokeTrustedDevice } = await import('@/server/utils/trusted-devices')
const { auth } = await import('@/lib/auth')
const { default: getHandler } = await import('@/server/api/admin/users/[id]/trusted-devices/index.get')
const { default: deleteHandler } = await import('@/server/api/admin/users/[id]/trusted-devices/[deviceId].delete')
const { default: revokeHandler } = await import('@/server/api/admin/users/[id]/revoke-sessions.post')

const event = {} as never
const device = {
    id: 'device-1',
    userId: 'user-1',
    identifier: 'trust-device-abc',
    userAgent: 'UA',
    ip: '203.0.113.1',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    expiresAt: new Date('2026-12-01T00:00:00.000Z'),
    lastUsedAt: new Date('2026-11-20T00:00:00.000Z'),
}

describe('admin trusted devices / revoke sessions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as never)
        vi.mocked(validateParamsSafe).mockResolvedValue({ success: true, data: { id: 'user-1', deviceId: 'device-1' } } as never)
        vi.mocked(listTrustedDevices).mockResolvedValue([device] as never)
        vi.mocked(findTrustedDevice).mockResolvedValue(device as never)
        vi.mocked(revokeTrustedDevice).mockResolvedValue(true as never)
        vi.mocked(auth.api.revokeUserSessions).mockResolvedValue({ status: true } as never)
    })

    it('管理员可查看用户可信设备', async () => {
        const response = await getHandler(event)
        expect(checkAdmin).toHaveBeenCalledWith(event)
        expect(listTrustedDevices).toHaveBeenCalledWith('user-1')
        expect(response.data.devices[0]).toMatchObject({ id: 'device-1', expired: false })
    })

    it('管理员吊销可信设备并写审计', async () => {
        await expect(deleteHandler(event)).resolves.toEqual({ status: true })
        expect(revokeTrustedDevice).toHaveBeenCalledWith({ userId: 'user-1', id: 'device-1' })
        expect(auditFromEvent).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'trustedDevice.revoke',
            actorId: 'admin-1',
            targetUserId: 'user-1',
            source: 'admin',
        }))
    })

    it('不存在设备返回 404', async () => {
        vi.mocked(findTrustedDevice).mockResolvedValue(null as never)
        await expect(deleteHandler(event)).rejects.toMatchObject({ statusCode: 404 })
    })

    it('批量撤销会话调用 admin 插件并写审计', async () => {
        await expect(revokeHandler(event)).resolves.toEqual({ status: true })
        expect(auth.api.revokeUserSessions).toHaveBeenCalledWith({
            body: { userId: 'user-1' },
            headers: (event as { headers: Headers }).headers,
        })
        expect(auditFromEvent).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'session.revokeAll',
            actorId: 'admin-1',
            targetUserId: 'user-1',
            source: 'admin',
        }))
    })
})
