import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    checkRecoveryCode: vi.fn(),
    consumeRecoveryCode: vi.fn(),
    checkTotp: vi.fn(),
    consumeTotp: vi.fn(),
    checkBackup: vi.fn(),
    consumeBackup: vi.fn(),
    checkProofOtp: vi.fn(),
    consumeProofOtp: vi.fn(),
    findCredentialAccount: vi.fn(),
    verifyPassword: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
    auth: {
        $context: Promise.resolve({
            internalAdapter: { findCredentialAccount: state.findCredentialAccount },
            password: { verify: state.verifyPassword },
        }),
    },
}))
vi.mock('@/server/utils/recovery-code', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-code')>()
    return {
        ...actual,
        checkRecoveryCode: state.checkRecoveryCode,
        consumeRecoveryCode: state.consumeRecoveryCode,
    }
})
vi.mock('@/server/utils/proof-factors', () => ({
    checkTotpFactor: state.checkTotp,
    consumeTotpFactor: state.consumeTotp,
    checkBackupCodeFactor: state.checkBackup,
    consumeBackupCodeFactor: state.consumeBackup,
}))
vi.mock('@/server/utils/proof-otp', () => ({
    checkProofOtp: state.checkProofOtp,
    consumeProofOtp: state.consumeProofOtp,
}))

const {
    PURPOSE_FACTORS,
    clearProofFailures,
    consumeProofFactor,
    getProofFailureState,
    recordProofFailure,
    resetProofFailures,
    verifyRecoveryProof,
} = await import('@/server/utils/recovery-proof')

const NOW = new Date('2026-11-21T12:00:00Z').getTime()

describe('server/utils/recovery-proof', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetProofFailures()
        state.findCredentialAccount.mockResolvedValue({ id: 'acc-1', password: 'hashed' })
        state.verifyPassword.mockResolvedValue(true)
        state.checkRecoveryCode.mockResolvedValue({ valid: true })
        state.checkProofOtp.mockResolvedValue({ valid: true, phoneNumber: '+8613800138000' })
        state.checkTotp.mockResolvedValue({ valid: true, timeStep: 100 })
        state.checkBackup.mockResolvedValue({ valid: true })
    })

    it('keeps phone OTP out of the self-service password factor set (D3 / D6)', () => {
        expect(PURPOSE_FACTORS['change-email']).toContain('phone-otp')
        expect(PURPOSE_FACTORS['self-service-password']).not.toContain('phone-otp')
        expect(PURPOSE_FACTORS['change-email']).not.toContain('social' as any)
    })

    it('requires and verifies the password for changing email', async () => {
        const missing = await verifyRecoveryProof({ userId: 'u1', purpose: 'change-email', factor: 'recovery-code', code: 'x', now: NOW })
        expect(missing).toEqual({ ok: false, reason: 'PASSWORD_REQUIRED' })

        state.verifyPassword.mockResolvedValue(false)
        const wrong = await verifyRecoveryProof({ userId: 'u1', purpose: 'change-email', password: 'bad', factor: 'recovery-code', code: 'x', now: NOW })
        expect(wrong).toEqual({ ok: false, reason: 'PASSWORD_INVALID' })
        expect(state.checkRecoveryCode).not.toHaveBeenCalled()
    })

    it('rejects factors outside the purpose or narrowed set', async () => {
        const purposeReject = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'self-service-password',
            factor: 'phone-otp',
            code: '123456',
            sessionCreatedAt: new Date(NOW - 60_000),
            now: NOW,
        })
        expect(purposeReject).toEqual({ ok: false, reason: 'FACTOR_NOT_ALLOWED' })

        const narrowed = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'change-email',
            password: 'pw',
            factor: 'recovery-code',
            code: 'x',
            allowedFactors: ['totp'],
            now: NOW,
        })
        expect(narrowed).toEqual({ ok: false, reason: 'FACTOR_NOT_ALLOWED' })

        const unknown = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'change-email',
            password: 'pw',
            factor: 'social' as any,
            code: 'x',
            now: NOW,
        })
        expect(unknown).toEqual({ ok: false, reason: 'FACTOR_NOT_ALLOWED' })
    })

    it('requires a fresh session for self-service password but accepts OAuth-only accounts', async () => {
        state.findCredentialAccount.mockResolvedValue(null)
        const stale = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'self-service-password',
            factor: 'recovery-code',
            code: 'x',
            sessionCreatedAt: new Date(NOW - 16 * 60 * 1000),
            now: NOW,
        })
        expect(stale).toEqual({ ok: false, reason: 'SESSION_NOT_FRESH' })

        const fresh = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'self-service-password',
            factor: 'recovery-code',
            code: 'x',
            sessionCreatedAt: new Date(NOW - 60_000),
            now: NOW,
        })
        expect(fresh).toEqual({ ok: true, factor: 'recovery-code' })
        expect(state.verifyPassword).not.toHaveBeenCalled()
    })

    it('locks a factor after 5 failures within 15 minutes and clears on success', async () => {
        state.checkRecoveryCode.mockResolvedValue({ valid: false, reason: 'NOT_FOUND' })
        for (let index = 0; index < 5; index += 1) {
            const result = await verifyRecoveryProof({
                userId: 'u1',
                purpose: 'change-email',
                password: 'pw',
                factor: 'recovery-code',
                code: 'bad',
                now: NOW,
            })
            expect(result).toEqual({ ok: false, reason: 'PROOF_INVALID' })
        }
        expect(getProofFailureState('u1', 'recovery-code', NOW)).toMatchObject({ locked: true })

        const locked = await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'change-email',
            password: 'pw',
            factor: 'recovery-code',
            code: 'bad',
            now: NOW,
        })
        expect(locked).toEqual({ ok: false, reason: 'TOO_MANY_ATTEMPTS' })
        expect(state.checkRecoveryCode).toHaveBeenCalledTimes(5)

        /* 锁定到期后恢复 */
        expect(getProofFailureState('u1', 'recovery-code', NOW + 16 * 60 * 1000)).toMatchObject({ locked: false })

        resetProofFailures()
        state.checkRecoveryCode.mockResolvedValue({ valid: true })
        expect(await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'change-email',
            password: 'pw',
            factor: 'recovery-code',
            code: 'ok',
            now: NOW,
        })).toMatchObject({ ok: true })
        expect(getProofFailureState('u1', 'recovery-code', NOW)).toEqual({ count: 0, locked: false })
    })

    it('counts failures per factor independently', () => {
        for (let index = 0; index < 5; index += 1) {
            recordProofFailure('u1', 'recovery-code', NOW)
        }
        expect(getProofFailureState('u1', 'recovery-code', NOW).locked).toBe(true)
        expect(getProofFailureState('u1', 'totp', NOW).locked).toBe(false)
        clearProofFailures('u1', 'recovery-code')
        expect(getProofFailureState('u1', 'recovery-code', NOW).locked).toBe(false)
    })

    it('maps consumed recovery codes and returns TOTP time step', async () => {
        state.checkRecoveryCode.mockResolvedValue({ valid: false, reason: 'PROOF_CONSUMED' })
        expect(await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'change-email',
            password: 'pw',
            factor: 'recovery-code',
            code: 'used',
            now: NOW,
        })).toEqual({ ok: false, reason: 'PROOF_CONSUMED' })

        expect(await verifyRecoveryProof({
            userId: 'u1',
            purpose: 'self-service-password',
            factor: 'totp',
            code: '123456',
            sessionCreatedAt: new Date(NOW - 60_000),
            now: NOW,
        })).toEqual({ ok: true, factor: 'totp', timeStep: 100 })
    })

    it('consumes each factor through its own anchor', async () => {
        state.consumeRecoveryCode.mockResolvedValue({ ok: true })
        expect(await consumeProofFactor({ userId: 'u1', factor: 'recovery-code', code: 'x' })).toEqual({ ok: true })

        state.consumeRecoveryCode.mockResolvedValue({ ok: false, reason: 'PROOF_CONSUMED' })
        expect(await consumeProofFactor({ userId: 'u1', factor: 'recovery-code', code: 'x' }))
            .toEqual({ ok: false, reason: 'PROOF_CONSUMED' })

        state.consumeTotp.mockResolvedValue(true)
        expect(await consumeProofFactor({ userId: 'u1', factor: 'totp', code: '123456', timeStep: 100 })).toEqual({ ok: true })
        expect(state.consumeTotp).toHaveBeenCalledWith('u1', 100, { repository: undefined })
        state.consumeTotp.mockResolvedValue(false)
        expect(await consumeProofFactor({ userId: 'u1', factor: 'totp', code: '123456', timeStep: 100 }))
            .toEqual({ ok: false, reason: 'PROOF_CONSUMED' })

        state.consumeBackup.mockResolvedValue({ ok: true })
        expect(await consumeProofFactor({ userId: 'u1', factor: 'backup-code', code: 'AAAAA-BBBBB' })).toEqual({ ok: true })

        state.consumeProofOtp.mockResolvedValue({ ok: true })
        expect(await consumeProofFactor({ userId: 'u1', factor: 'phone-otp', code: '123456' })).toEqual({ ok: true })
    })
})
