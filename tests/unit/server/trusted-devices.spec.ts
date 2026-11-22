// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import loggerMock from '@/tests/mocks/logger'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    captureTrustedDevice,
    listTrustedDevices,
    parseTrustedDeviceExpiresAt,
    parseTrustedDeviceIdentifier,
    recordTrustedDevice,
    revokeTrustedDevice,
} = await import('@/server/utils/trusted-devices')

function createDeviceRepository(seed: any[] = []) {
    const store = new Map<string, any>(seed.map((item) => [item.id, { ...item }]))
    let sequence = seed.length
    return {
        store,
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
        create: vi.fn((data: any) => ({ ...data })),
        save: vi.fn(async (item: any) => {
            if (!item.id) {
                sequence += 1
                item.id = `device-${sequence}`
            }
            store.set(item.id, item)
            return item
        }),
        update: vi.fn(async (id: string, patch: any) => {
            const item = store.get(id)
            if (item) {
                Object.assign(item, patch)
            }
            return { affected: item ? 1 : 0, raw: [] }
        }),
        find: vi.fn(async ({ where }: any) => [...store.values()]
            .filter((item) => Object.entries(where).every(([key, value]) => item[key] === value))
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())),
        delete: vi.fn(async (where: any) => {
            for (const [id, item] of [...store.entries()]) {
                if (Object.entries(where).every(([key, value]) => item[key] === value)) {
                    store.delete(id)
                }
            }
            return { affected: 1, raw: [] }
        }),
    }
}

function cookie(identifier: string, maxAge = 2592000) {
    return `better-auth.trust_device=token!${identifier}.signature; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`
}

describe('trusted devices', () => {
    beforeEach(() => {
        loggerMock.warn.mockClear()
    })

    it('解析 trust_device cookie 的 identifier，非法值返回 null', () => {
        expect(parseTrustedDeviceIdentifier([cookie('trust-device-abc')])).toBe('trust-device-abc')
        expect(parseTrustedDeviceIdentifier(['better-auth.trust_device=invalid'])).toBeNull()
        expect(parseTrustedDeviceIdentifier(['better-auth.other=trust-device-abc'])).toBeNull()
        expect(parseTrustedDeviceIdentifier([])).toBeNull()
    })

    it('从 Max-Age 推导过期时间，缺失时回落 30 天', () => {
        const now = new Date('2026-11-22T00:00:00.000Z')
        expect(parseTrustedDeviceExpiresAt([cookie('trust-device-abc', 3600)], now).toISOString()).toBe('2026-11-22T01:00:00.000Z')
        expect(parseTrustedDeviceExpiresAt(['better-auth.trust_device=x'], now).toISOString()).toBe('2026-12-22T00:00:00.000Z')
    })

    it('同一 identifier 去重并更新 lastUsedAt', async () => {
        const repository = createDeviceRepository([{
            id: 'device-1',
            userId: 'user-1',
            identifier: 'trust-device-abc',
            userAgent: 'old',
            ip: '203.0.113.1',
            createdAt: new Date('2026-11-01T00:00:00.000Z'),
            expiresAt: new Date('2026-11-10T00:00:00.000Z'),
            lastUsedAt: new Date('2026-11-01T00:00:00.000Z'),
        }])
        const device = await recordTrustedDevice({
            userId: 'user-1',
            identifier: 'trust-device-abc',
            userAgent: 'new',
            ip: '203.0.113.2',
            expiresAt: new Date('2026-12-01T00:00:00.000Z'),
            now: new Date('2026-11-22T00:00:00.000Z'),
        }, { repository: repository as never })
        expect(device.id).toBe('device-1')
        expect(repository.store.get('device-1')).toMatchObject({
            userAgent: 'new',
            ip: '203.0.113.2',
            lastUsedAt: new Date('2026-11-22T00:00:00.000Z'),
        })
    })

    it('并发双写撞唯一索引时回落为更新，不丢设备', async () => {
        const existing = {
            id: 'device-1',
            userId: 'user-1',
            identifier: 'trust-device-race',
            createdAt: new Date('2026-11-01T00:00:00.000Z'),
        }
        const repository = createDeviceRepository()
        repository.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(existing)
        repository.save.mockRejectedValueOnce(new Error('UNIQUE constraint failed'))
        const device = await recordTrustedDevice({
            userId: 'user-1',
            identifier: 'trust-device-race',
            expiresAt: new Date('2026-12-01T00:00:00.000Z'),
            now: new Date('2026-11-22T00:00:00.000Z'),
        }, { repository: repository as never })
        expect(device.id).toBe('device-1')
        expect(repository.update).toHaveBeenCalledWith('device-1', expect.objectContaining({
            lastUsedAt: new Date('2026-11-22T00:00:00.000Z'),
        }))
    })

    it('新 identifier 创建记录并按创建时间倒序列出', async () => {
        const repository = createDeviceRepository()
        await recordTrustedDevice({
            userId: 'user-1',
            identifier: 'trust-device-new',
            expiresAt: new Date('2026-12-01T00:00:00.000Z'),
            now: new Date('2026-11-22T00:00:00.000Z'),
        }, { repository: repository as never })
        expect(repository.store.size).toBe(1)

        const list = await listTrustedDevices('user-1', { repository: repository as never })
        expect(list).toHaveLength(1)
        expect(list[0]?.identifier).toBe('trust-device-new')
    })

    it('吊销同时删除 verification 行与实体', async () => {
        const repository = createDeviceRepository([{
            id: 'device-1',
            userId: 'user-1',
            identifier: 'trust-device-abc',
            createdAt: new Date(),
        }])
        const verificationRepository = { delete: vi.fn(async () => ({ affected: 1, raw: [] })) }
        const removed = await revokeTrustedDevice({
            userId: 'user-1',
            id: 'device-1',
            deviceRepository: repository as never,
            verificationRepository: verificationRepository as never,
        })
        expect(removed).toBe(true)
        expect(verificationRepository.delete).toHaveBeenCalledWith({ identifier: 'trust-device-abc' })
        expect(repository.store.size).toBe(0)
    })

    it('cookie 缺失或畸形时只告警，不阻断验证', async () => {
        const repository = createDeviceRepository()
        const device = await captureTrustedDevice({
            userId: 'user-1',
            setCookies: ['better-auth.trust_device=invalid'],
            repository: repository as never,
        })
        expect(device).toBeNull()
        expect(loggerMock.warn).toHaveBeenCalledWith(
            'trusted device: trust_device cookie is missing or malformed',
            { userId: 'user-1' },
        )
    })

    it('采集成功后写审计', async () => {
        const repository = createDeviceRepository()
        const device = await captureTrustedDevice({
            userId: 'user-1',
            setCookies: [cookie('trust-device-abc')],
            repository: repository as never,
            now: new Date('2026-11-22T00:00:00.000Z'),
        })
        expect(device?.identifier).toBe('trust-device-abc')
        expect(loggerMock.audit.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'trustedDevice.create',
            targetUserId: 'user-1',
            after: { identifier: 'trust-device-abc' },
        }))
    })
})
