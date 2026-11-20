import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    CHANNEL_CHANGE_EXPIRES_IN_MS,
    CHANNEL_CHANGE_MAX_ATTEMPTS,
    createChannelChangeRequest,
    generateChannelChangeCode,
    hashChannelChangeCode,
    maskChannelValue,
    markChannelChangeConfirmed,
    normalizeChannelValue,
    verifyChannelChangeCode,
    verifyChannelChangeRequest,
} = await import('@/server/utils/channel-change')

function createRepository(seed: any[] = []) {
    const store = new Map<string, any>(seed.map((item) => [item.id, { ...item }]))
    return {
        store,
        create: vi.fn((data: any) => ({ ...data })),
        save: vi.fn(async (item: any) => {
            store.set(item.id, item)
            return item
        }),
        find: vi.fn(async ({ where }: any) => [...store.values()].filter((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        ))),
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
    }
}

describe('server/utils/channel-change', () => {
    it('normalizes emails and masks both channels', () => {
        expect(normalizeChannelValue('email', '  User@Example.COM ')).toBe('user@example.com')
        expect(normalizeChannelValue('phone', ' +8613800138000 ')).toBe('+8613800138000')
        expect(maskChannelValue('email', 'user@example.com')).toBe('u**r@example.com')
        expect(maskChannelValue('phone', '+8613800138000')).toBe('+86 138 **** 8000')
    })

    it('generates six digit codes and binds the hash to the request id', () => {
        const code = generateChannelChangeCode()
        expect(code).toMatch(/^\d{6}$/u)
        const hash = hashChannelChangeCode('req-1', code)
        expect(verifyChannelChangeCode('req-1', code, hash)).toBe(true)
        expect(verifyChannelChangeCode('req-2', code, hash)).toBe(false)
        expect(verifyChannelChangeCode('req-1', `${code}0`, hash)).toBe(false)
    })

    it('creates a pending request, cancels previous pending requests and expires in 10 minutes', async () => {
        const repository = createRepository([
            { id: 'old', userId: 'u1', channel: 'email', status: 'pending', expiresAt: new Date() },
        ])
        const now = Date.now()
        const { request, code } = await createChannelChangeRequest({
            userId: 'u1',
            channel: 'email',
            value: 'New@Example.com',
            requestedBy: 'admin-1',
            reason: 'user request',
            repository: repository as any,
            now,
        })

        expect(request.status).toBe('pending')
        expect(request.newValue).toBe('new@example.com')
        expect(request.expiresAt.getTime()).toBe(now + CHANNEL_CHANGE_EXPIRES_IN_MS)
        expect(request.id).toBeTruthy()
        expect(verifyChannelChangeCode(request.id, code, request.codeHash)).toBe(true)
        expect(repository.store.get('old').status).toBe('cancelled')
    })

    it('rejects expired requests and marks them expired', async () => {
        const repository = createRepository([
            { id: 'r1', userId: 'u1', channel: 'email', status: 'pending', attempts: 0, codeHash: hashChannelChangeCode('r1', '123456'), expiresAt: new Date(Date.now() - 1) },
        ])
        const result = await verifyChannelChangeRequest({ id: 'r1', code: '123456', repository: repository as any })
        expect(result).toMatchObject({ ok: false, reason: 'CODE_EXPIRED' })
        expect(repository.store.get('r1').status).toBe('expired')
    })

    it('counts invalid attempts and expires at the limit', async () => {
        const repository = createRepository([
            { id: 'r1', userId: 'u1', channel: 'email', status: 'pending', attempts: 0, codeHash: hashChannelChangeCode('r1', '123456'), expiresAt: new Date(Date.now() + 60000) },
        ])
        for (let index = 0; index < CHANNEL_CHANGE_MAX_ATTEMPTS; index += 1) {
            const result = await verifyChannelChangeRequest({ id: 'r1', code: '000000', repository: repository as any })
            expect(result).toMatchObject({ ok: false, reason: 'CODE_INVALID' })
        }
        expect(repository.store.get('r1')).toMatchObject({
            attempts: CHANNEL_CHANGE_MAX_ATTEMPTS,
            status: 'expired',
        })
    })

    it('accepts the correct code and blocks replay after confirmation', async () => {
        const repository = createRepository([
            { id: 'r1', userId: 'u1', channel: 'email', status: 'pending', attempts: 0, codeHash: hashChannelChangeCode('r1', '123456'), expiresAt: new Date(Date.now() + 60000) },
        ])
        const result = await verifyChannelChangeRequest({ id: 'r1', code: '123456', repository: repository as any })
        expect(result.ok).toBe(true)
        if (!result.ok) {
            return
        }
        await markChannelChangeConfirmed(result.request, repository as any, new Date('2026-11-20T00:00:00Z'))
        expect(repository.store.get('r1').status).toBe('confirmed')
        expect(repository.store.get('r1').confirmedAt).toEqual(new Date('2026-11-20T00:00:00Z'))

        const replay = await verifyChannelChangeRequest({ id: 'r1', code: '123456', repository: repository as any })
        expect(replay).toMatchObject({ ok: false, reason: 'REQUEST_CONSUMED' })
    })
})
