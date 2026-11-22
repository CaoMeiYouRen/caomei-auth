// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteCookie, getCookie } from 'h3'

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
        ...actual,
        getCookie: vi.fn(),
        deleteCookie: vi.fn(),
    }
})

vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: vi.fn() }))
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn() }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: vi.fn(async () => ({ t: (key: string) => key })),
    createLocalizedError: vi.fn(async (_event: unknown, options: { statusCode: number, key: string }) => {
        const error = new Error(options.key)
        Object.assign(error, { statusCode: options.statusCode })
        return error
    }),
}))
vi.mock('@/server/utils/validation', () => ({ validateParamsSafe: vi.fn() }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: vi.fn() }))
vi.mock('@/server/utils/trusted-devices', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/trusted-devices')>()
    return {
        ...actual,
        listTrustedDevices: vi.fn(),
        findTrustedDevice: vi.fn(),
        revokeTrustedDevice: vi.fn(),
    }
})

const { getUserSession } = await import('@/server/utils/get-user-session')
const { validateParamsSafe } = await import('@/server/utils/validation')
const { listTrustedDevices, findTrustedDevice, revokeTrustedDevice } = await import('@/server/utils/trusted-devices')
const { auditFromEvent } = await import('@/server/utils/audit-log')
const { default: listHandler } = await import('@/server/api/security/trusted-devices/index.get')
const { default: deleteHandler } = await import('@/server/api/security/trusted-devices/[id].delete')

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

describe('trusted devices API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getUserSession).mockResolvedValue({ userId: 'user-1' } as never)
        vi.mocked(validateParamsSafe).mockResolvedValue({ success: true, data: { id: 'device-1' } } as never)
        vi.mocked(getCookie).mockReturnValue(undefined)
    })

    it('GET 只查询本人并计算 expired', async () => {
        vi.mocked(listTrustedDevices).mockResolvedValue([device, { ...device, id: 'device-2', expiresAt: new Date('2026-01-01T00:00:00.000Z') }] as never)
        const response = await listHandler(event)
        expect(listTrustedDevices).toHaveBeenCalledWith('user-1')
        expect(response.data.devices[0]).toMatchObject({ id: 'device-1', expired: false, current: false })
        expect(response.data.devices[0]).not.toHaveProperty('identifier')
        expect(response.data.devices[1]?.expired).toBe(true)
    })

    it('DELETE 不存在或非本人设备返回 404', async () => {
        vi.mocked(findTrustedDevice).mockResolvedValue(null as never)
        await expect(deleteHandler(event)).rejects.toMatchObject({ statusCode: 404 })
        expect(revokeTrustedDevice).not.toHaveBeenCalled()
    })

    it('DELETE 吊销当前设备时清除 trust_device cookie', async () => {
        vi.mocked(findTrustedDevice).mockResolvedValue(device as never)
        vi.mocked(getCookie).mockReturnValue('token!trust-device-abc.signature')
        await expect(deleteHandler(event)).resolves.toEqual({ status: true })
        expect(revokeTrustedDevice).toHaveBeenCalledWith({ userId: 'user-1', id: 'device-1' })
        expect(auditFromEvent).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'trustedDevice.revoke',
            after: { identifier: 'trust-device-abc' },
            source: 'web',
        }))
        expect(deleteCookie).toHaveBeenCalledWith(event, 'better-auth.trust_device', { path: '/', secure: false })
    })

    it('DELETE 清除 __Secure- cookie 时带 secure 属性', async () => {
        vi.mocked(findTrustedDevice).mockResolvedValue(device as never)
        vi.mocked(getCookie).mockImplementation((_event, name) => name === '__Secure-better-auth.trust_device'
            ? 'token!trust-device-abc.signature'
            : undefined)
        await expect(deleteHandler(event)).resolves.toEqual({ status: true })
        expect(deleteCookie).toHaveBeenCalledWith(event, '__Secure-better-auth.trust_device', { path: '/', secure: true })
    })

    it('DELETE 其他设备时不清除 cookie', async () => {
        vi.mocked(findTrustedDevice).mockResolvedValue(device as never)
        vi.mocked(getCookie).mockReturnValue('token!trust-device-other.signature')
        await expect(deleteHandler(event)).resolves.toEqual({ status: true })
        expect(deleteCookie).not.toHaveBeenCalled()
    })
})
