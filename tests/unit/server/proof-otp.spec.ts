import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    PROOF_OTP_MAX_ATTEMPTS,
    PROOF_OTP_PREFIX,
    checkProofOtp,
    consumeProofOtp,
    generateProofOtp,
    hasPendingProofOtp,
    issueProofOtp,
} = await import('@/server/utils/proof-otp')

function createVerificationRepository(seed: any[] = []) {
    let sequence = 0
    const store = new Map<string, any>(seed.map((item) => [item.id ?? `seed-${item.identifier}`, { ...item }]))
    return {
        store,
        create: vi.fn((data: any) => ({ ...data })),
        save: vi.fn(async (item: any) => {
            if (!item.id) {
                sequence += 1
                item.id = `v-${sequence}`
            }
            store.set(item.id, item)
            return item
        }),
        find: vi.fn(async ({ where }: any) => [...store.values()].filter((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        ))),
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
        delete: vi.fn(async (where: any) => {
            let affected = 0
            for (const [id, item] of [...store.entries()]) {
                if (Object.entries(where).every(([key, value]) => item[key] === value)) {
                    store.delete(id)
                    affected += 1
                }
            }
            return { affected }
        }),
    }
}

const NOW = new Date('2026-11-21T12:00:00Z').getTime()

describe('server/utils/proof-otp', () => {
    it('issues a prefixed verification row with hashed value only', async () => {
        const repository = createVerificationRepository()
        const code = generateProofOtp()
        expect(code).toMatch(/^\d{6}$/u)
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code, repository: repository as any, now: NOW })

        const rows = [...repository.store.values()]
        expect(rows).toHaveLength(1)
        expect(rows[0].identifier).toBe(`${PROOF_OTP_PREFIX}u1`)
        expect(rows[0].value).not.toContain(code)
        expect(rows[0].expiresAt.getTime()).toBe(NOW + 10 * 60 * 1000)
        expect(await hasPendingProofOtp('u1', repository as any, NOW)).toBe(true)
    })

    it('verifies the code once and rejects replay', async () => {
        const repository = createVerificationRepository()
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code: '123456', repository: repository as any, now: NOW })

        expect(await checkProofOtp({ userId: 'u1', code: '123456', repository: repository as any, now: NOW }))
            .toMatchObject({ valid: true, phoneNumber: '+8613800138000' })
        expect(await consumeProofOtp({ userId: 'u1', code: '123456', repository: repository as any, now: NOW }))
            .toEqual({ ok: true })
        expect(await consumeProofOtp({ userId: 'u1', code: '123456', repository: repository as any, now: NOW }))
            .toEqual({ ok: false, reason: 'CODE_NOT_ISSUED' })
    })

    it('counts wrong attempts and invalidates after the limit', async () => {
        const repository = createVerificationRepository()
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code: '123456', repository: repository as any, now: NOW })

        for (let index = 1; index < PROOF_OTP_MAX_ATTEMPTS; index += 1) {
            expect(await checkProofOtp({ userId: 'u1', code: '000000', repository: repository as any, now: NOW }))
                .toEqual({ valid: false, reason: 'CODE_INVALID' })
        }
        expect(await checkProofOtp({ userId: 'u1', code: '000000', repository: repository as any, now: NOW }))
            .toEqual({ valid: false, reason: 'TOO_MANY_ATTEMPTS' })
        expect(repository.store.size).toBe(0)
    })

    it('expires codes after 10 minutes and isolates users', async () => {
        const repository = createVerificationRepository()
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code: '123456', repository: repository as any, now: NOW })
        expect(await checkProofOtp({ userId: 'u2', code: '123456', repository: repository as any, now: NOW }))
            .toEqual({ valid: false, reason: 'CODE_NOT_ISSUED' })
        expect(await checkProofOtp({ userId: 'u1', code: '123456', repository: repository as any, now: NOW + 11 * 60 * 1000 }))
            .toEqual({ valid: false, reason: 'CODE_EXPIRED' })
    })

    it('replaces the previous code on reissue', async () => {
        const repository = createVerificationRepository()
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code: '111111', repository: repository as any, now: NOW })
        await issueProofOtp({ userId: 'u1', phoneNumber: '+8613800138000', code: '222222', repository: repository as any, now: NOW })
        expect(repository.store.size).toBe(1)
        expect(await checkProofOtp({ userId: 'u1', code: '111111', repository: repository as any, now: NOW }))
            .toMatchObject({ valid: false })
        expect(await checkProofOtp({ userId: 'u1', code: '222222', repository: repository as any, now: NOW }))
            .toMatchObject({ valid: true })
    })
})
