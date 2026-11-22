// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createMemoryDatabase,
    createTestAuth,
    setupTwoFactorUser,
    TestClient,
    type CapturedCodes,
} from './helpers/two-factor-coverage'
import { trustedDevicePlugin } from '@/server/utils/trusted-device-plugin'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const EMAIL = 'trusted-device@example.com'
const PASSWORD = 'passw0rd123'

function createRepository() {
    const store = new Map<string, any>()
    let sequence = 0
    return {
        store,
        create: vi.fn((data: any) => ({ ...data })),
        save: vi.fn(async (item: any) => {
            sequence += 1
            item.id ??= `device-${sequence}`
            store.set(item.id, item)
            return item
        }),
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
        update: vi.fn(async (id: string, patch: any) => {
            Object.assign(store.get(id) ?? {}, patch)
            return { affected: 1, raw: [] }
        }),
        find: vi.fn(async () => [...store.values()]),
        delete: vi.fn(async () => ({ affected: 0, raw: [] })),
    }
}

describe('trusted device plugin', () => {
    let captured: CapturedCodes
    let database: ReturnType<typeof createMemoryDatabase>
    let repository: ReturnType<typeof createRepository>
    let client: TestClient

    beforeEach(() => {
        captured = {}
        database = createMemoryDatabase()
        repository = createRepository()
        client = new TestClient(createTestAuth(captured, database, {
            extraPlugins: [trustedDevicePlugin({ repository: repository as never })],
        }))
    })

    async function verifyWithTrust(trustDevice: boolean) {
        await client.request('/sign-in/email', { body: { email: EMAIL, password: PASSWORD } })
        await client.request('/two-factor/send-otp')
        return client.request('/two-factor/verify-otp', {
            body: { code: captured.twoFactorCode, trustDevice },
        })
    }

    it('验证成功且勾选信任设备时写入 identifier 与 UA', async () => {
        await setupTwoFactorUser(client, database, EMAIL)
        const response = await verifyWithTrust(true)
        expect(response.response.status).toBe(200)

        expect(repository.save).toHaveBeenCalledTimes(1)
        const saved = repository.save.mock.calls[0]?.[0]
        expect(saved).toMatchObject({
            userId: database.user[0]?.id,
            identifier: expect.stringMatching(/^trust-device-/u),
        })
        expect(saved.expiresAt).toBeInstanceOf(Date)
        expect(saved.lastUsedAt).toBeInstanceOf(Date)
    })

    it('未勾选信任设备时不写入', async () => {
        await setupTwoFactorUser(client, database, EMAIL)
        const response = await verifyWithTrust(false)
        expect(response.response.status).toBe(200)
        expect(repository.save).not.toHaveBeenCalled()
    })

    it('验证失败时不写入', async () => {
        await setupTwoFactorUser(client, database, EMAIL)
        await client.request('/sign-in/email', { body: { email: EMAIL, password: PASSWORD } })
        const failed = await client.request('/two-factor/verify-otp', { body: { code: '000000', trustDevice: true } })
        expect(failed.response.status).toBeGreaterThanOrEqual(400)
        expect(repository.save).not.toHaveBeenCalled()
    })
})
