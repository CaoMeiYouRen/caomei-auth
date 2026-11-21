import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const {
    FRESH_SESSION_MAX_AGE_MS,
    RECOVERY_CODE_COUNT,
    checkRecoveryCode,
    consumeRecoveryCode,
    countRemainingRecoveryCodes,
    deleteRecoveryCode,
    generateRecoveryCode,
    generateRecoveryCodes,
    hashRecoveryCode,
    isFreshSession,
    listRecoveryCodes,
    normalizeRecoveryCode,
} = await import('@/server/utils/recovery-code')

function createRepository(seed: any[] = []) {
    let sequence = 0
    const store = new Map<string, any>(seed.map((item) => [item.id, { ...item }]))
    return {
        store,
        create: vi.fn((data: any) => ({ ...data })),
        save: vi.fn(async (items: any) => {
            const list = Array.isArray(items) ? items : [items]
            for (const item of list) {
                if (!item.id) {
                    sequence += 1
                    item.id = `id-${sequence}`
                }
                store.set(item.id, item)
            }
            return items
        }),
        find: vi.fn(async ({ where }: any) => [...store.values()].filter((item) => (
            Object.entries(where).every(([key, value]) => {
                if (value && typeof value === 'object' && '_type' in value && value._type === 'isNull') {
                    return item[key] === null || item[key] === undefined
                }
                return item[key] === value
            })
        ))),
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
        count: vi.fn(async ({ where }: any) => [...store.values()].filter((item) => (
            Object.entries(where).every(([key, value]) => {
                if (value && typeof value === 'object' && '_type' in value && value._type === 'isNull') {
                    return item[key] === null || item[key] === undefined
                }
                return item[key] === value
            })
        )).length),
        delete: vi.fn(async (where: any) => {
            for (const [id, item] of [...store.entries()]) {
                const matches = Object.entries(where).every(([key, value]) => item[key] === value)
                if (matches) {
                    store.delete(id)
                }
            }
        }),
        update: vi.fn(async (where: any, patch: any) => {
            let affected = 0
            for (const item of store.values()) {
                const matches = Object.entries(where).every(([key, value]) => {
                    if (value && typeof value === 'object' && '_type' in value && value._type === 'isNull') {
                        return item[key] === null || item[key] === undefined
                    }
                    return item[key] === value
                })
                if (matches) {
                    Object.assign(item, patch)
                    affected += 1
                }
            }
            return { affected }
        }),
    }
}

describe('server/utils/recovery-code', () => {
    it('formats codes with 80 bits of entropy and normalizes user input', () => {
        const code = generateRecoveryCode()
        expect(code).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/u)
        expect(normalizeRecoveryCode(code.toLowerCase().replace(/-/gu, ' '))).toHaveLength(16)
        expect(hashRecoveryCode(code)).toBe(hashRecoveryCode(code.toLowerCase()))
        expect(hashRecoveryCode(code)).toHaveLength(64)
        const codes = new Set(Array.from({ length: 200 }, () => generateRecoveryCode()))
        expect(codes.size).toBe(200)
    })

    it('issues a batch, replaces previous codes and never stores plaintext', async () => {
        const repository = createRepository([
            { id: 'old', userId: 'u1', codeHash: 'deadbeef', usedAt: null },
        ])
        const codes = await generateRecoveryCodes({ userId: 'u1', repository: repository as any })
        expect(codes).toHaveLength(RECOVERY_CODE_COUNT)
        expect(repository.store.has('old')).toBe(false)
        const stored = [...repository.store.values()]
        expect(stored).toHaveLength(RECOVERY_CODE_COUNT)
        for (const row of stored) {
            expect(row.codeHash).toHaveLength(64)
            expect(codes).not.toContain(row.codeHash)
        }
        expect(JSON.stringify(stored)).not.toContain(codes[0])
    })

    it('counts only unused codes and consumes exactly once', async () => {
        const repository = createRepository()
        const codes = await generateRecoveryCodes({ userId: 'u1', repository: repository as any })
        expect(await countRemainingRecoveryCodes('u1', repository as any)).toBe(RECOVERY_CODE_COUNT)
        expect(await checkRecoveryCode({ userId: 'u1', code: codes[0]!, repository: repository as any })).toEqual({ valid: true })

        const first = await consumeRecoveryCode({ userId: 'u1', code: codes[0]!, repository: repository as any })
        expect(first).toEqual({ ok: true })
        expect(await countRemainingRecoveryCodes('u1', repository as any)).toBe(RECOVERY_CODE_COUNT - 1)

        const second = await consumeRecoveryCode({ userId: 'u1', code: codes[0]!, repository: repository as any })
        expect(second).toEqual({ ok: false, reason: 'PROOF_CONSUMED' })
        expect(await checkRecoveryCode({ userId: 'u1', code: codes[0]!, repository: repository as any }))
            .toEqual({ valid: false, reason: 'PROOF_CONSUMED' })
    })

    it('rejects unknown codes and codes of other users', async () => {
        const repository = createRepository()
        const codes = await generateRecoveryCodes({ userId: 'u1', repository: repository as any })
        expect(await consumeRecoveryCode({ userId: 'u2', code: codes[0]!, repository: repository as any }))
            .toEqual({ ok: false, reason: 'NOT_FOUND' })
        expect(await consumeRecoveryCode({ userId: 'u1', code: 'AAAA-BBBB-CCCC-DDDD', repository: repository as any }))
            .toEqual({ ok: false, reason: 'NOT_FOUND' })
    })

    it('deletes only codes owned by the caller and lists without plaintext', async () => {
        const repository = createRepository()
        const codes = await generateRecoveryCodes({ userId: 'u1', repository: repository as any })
        const listed = await listRecoveryCodes('u1', repository as any)
        expect(listed).toHaveLength(RECOVERY_CODE_COUNT)
        expect(JSON.stringify(listed)).not.toContain(codes[0])

        expect(await deleteRecoveryCode({ userId: 'u2', id: listed[0]!.id, repository: repository as any })).toBe(false)
        expect(await deleteRecoveryCode({ userId: 'u1', id: listed[0]!.id, repository: repository as any })).toBe(true)
        expect(await countRemainingRecoveryCodes('u1', repository as any)).toBe(RECOVERY_CODE_COUNT - 1)
    })

    it('treats a session as fresh only within 15 minutes', () => {
        const now = Date.now()
        expect(isFreshSession(new Date(now - 60 * 1000), { now })).toBe(true)
        expect(isFreshSession(new Date(now - FRESH_SESSION_MAX_AGE_MS), { now })).toBe(true)
        expect(isFreshSession(new Date(now - FRESH_SESSION_MAX_AGE_MS - 1000), { now })).toBe(false)
        expect(isFreshSession(new Date(now + 60 * 1000), { now })).toBe(false)
        expect(isFreshSession(null)).toBe(false)
        expect(isFreshSession('not-a-date')).toBe(false)
    })
})
