import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))
vi.mock('@/lib/auth', () => ({
    auth: { $context: Promise.resolve({ secretConfig: 'test-secret-key' }) },
}))

const {
    checkBackupCodeFactor,
    checkTotpFactor,
    consumeBackupCodeFactor,
    consumeTotpFactor,
    decodeBase32,
    decryptTotpSecret,
    generateTotpCode,
    normalizeBackupCode,
    readBackupCodes,
    verifyTotpCode,
} = await import('@/server/utils/proof-factors')

const SECRET_KEY = 'test-secret-key'
const RFC_SECRET = '12345678901234567890'

function createTwoFactorRepository(seed: any[] = []) {
    const store = new Map<string, any>(seed.map((item) => [item.id ?? item.userId, { ...item }]))
    return {
        store,
        findOne: vi.fn(async ({ where }: any) => [...store.values()].find((item) => (
            Object.entries(where).every(([key, value]) => item[key] === value)
        )) ?? null),
        save: vi.fn(async (item: any) => {
            store.set(item.id ?? item.userId, item)
            return item
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

describe('server/utils/proof-factors', () => {
    it('decodes base32 and matches the RFC 6238 SHA-1 vector', () => {
        expect(decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ').toString()).toBe(RFC_SECRET)
        expect(generateTotpCode(RFC_SECRET, 1, 8)).toBe('94287082')
        expect(generateTotpCode(RFC_SECRET, Math.floor(1234567890 / 30), 8)).toBe('89005924')
    })

    it('accepts the current time step and rejects replays of older steps', () => {
        const now = 1_700_000_000_000
        const timeStep = Math.floor(now / 1000 / 30)
        const code = generateTotpCode(RFC_SECRET, timeStep)
        expect(verifyTotpCode(RFC_SECRET, code, { now })).toEqual({ valid: true, timeStep })
        expect(verifyTotpCode(RFC_SECRET, '000000', { now }).valid).toBe(false)
        expect(verifyTotpCode(RFC_SECRET, 'abc', { now }).valid).toBe(false)
    })

    it('decrypts better-auth encrypted TOTP secrets, including the base32 import format', async () => {
        const encrypted = await symmetricEncrypt({ key: SECRET_KEY, data: RFC_SECRET })
        expect(await decryptTotpSecret(encrypted)).toBe(RFC_SECRET)
        const imported = await symmetricEncrypt({ key: SECRET_KEY, data: 'base32:GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' })
        expect(String(await decryptTotpSecret(imported))).toBe(RFC_SECRET)
    })

    it('verifies an encrypted TOTP factor once per time step', async () => {
        const encrypted = await symmetricEncrypt({ key: SECRET_KEY, data: RFC_SECRET })
        const repository = createTwoFactorRepository([
            { id: 'tf-1', userId: 'u1', secret: encrypted, backupCodes: null, lastUsedTimeStep: null },
        ])
        const now = 1_700_000_000_000
        const timeStep = Math.floor(now / 1000 / 30)
        const code = generateTotpCode(RFC_SECRET, timeStep)

        const check = await checkTotpFactor('u1', code, { repository: repository as any, now })
        expect(check).toMatchObject({ valid: true, timeStep })
        expect(await consumeTotpFactor('u1', timeStep, { repository: repository as any })).toBe(true)
        expect(await consumeTotpFactor('u1', timeStep, { repository: repository as any })).toBe(false)

        const replay = await checkTotpFactor('u1', code, { repository: repository as any, now })
        expect(replay).toMatchObject({ valid: false, reason: 'PROOF_CONSUMED' })

        const wrong = await checkTotpFactor('u1', '000000', { repository: repository as any, now })
        expect(wrong).toMatchObject({ valid: false, reason: 'CODE_INVALID' })

        const missing = await checkTotpFactor('u2', code, { repository: repository as any, now })
        expect(missing).toMatchObject({ valid: false, reason: 'FACTOR_UNAVAILABLE' })
    })

    it('handles plaintext backup codes and consumes them exactly once', async () => {
        const codes = ['AAAAA-BBBBB', 'CCCCC-DDDDD']
        const repository = createTwoFactorRepository([
            { id: 'tf-1', userId: 'u1', secret: 'x', backupCodes: JSON.stringify(codes), lastUsedTimeStep: null },
        ])

        expect(await readBackupCodes(JSON.stringify(codes))).toEqual(codes)
        expect(normalizeBackupCode(' aaaaa-bbbbb ')).toBe('AAAAA-BBBBB')
        expect(await checkBackupCodeFactor('u1', 'aaaaa-bbbbb', { repository: repository as any }))
            .toMatchObject({ valid: true })
        expect(await checkBackupCodeFactor('u1', 'ZZZZZ-ZZZZZ', { repository: repository as any }))
            .toMatchObject({ valid: false, reason: 'CODE_INVALID' })

        expect(await consumeBackupCodeFactor('u1', 'AAAAA-BBBBB', { repository: repository as any })).toEqual({ ok: true })
        expect(JSON.parse(repository.store.get('tf-1').backupCodes)).toEqual(['CCCCC-DDDDD'])
        expect(await consumeBackupCodeFactor('u1', 'AAAAA-BBBBB', { repository: repository as any }))
            .toMatchObject({ ok: false, reason: 'CODE_INVALID' })
    })

    it('returns an empty list for malformed backup code stores', async () => {
        expect(await readBackupCodes(null)).toEqual([])
        expect(await readBackupCodes('not-json')).toEqual([])
    })

    it('preserves encrypted backup-code storage when a code is consumed', async () => {
        const codes = ['AAAAA-BBBBB', 'CCCCC-DDDDD']
        const encrypted = await symmetricEncrypt({ key: SECRET_KEY, data: JSON.stringify(codes) })
        const repository = createTwoFactorRepository([
            { id: 'tf-1', userId: 'u1', secret: 'x', backupCodes: encrypted, lastUsedTimeStep: null },
        ])
        expect(await consumeBackupCodeFactor('u1', 'AAAAA-BBBBB', { repository: repository as any })).toEqual({ ok: true })
        const stored = repository.store.get('tf-1').backupCodes
        expect(stored).not.toContain('CCCCC-DDDDD')
        expect(JSON.parse(await symmetricDecrypt({ key: SECRET_KEY, data: stored }))).toEqual(['CCCCC-DDDDD'])
    })
})
