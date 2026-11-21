import { describe, expect, it } from 'vitest'
import { resolveTwoFactorErrorMessage } from '@/utils/web/two-factor-errors'

const translate = (key: string) => `[${key}]`

describe('two-factor error messages', () => {
    it('maps invalid factor codes to a retryable message', () => {
        expect(resolveTwoFactorErrorMessage('INVALID_CODE', 'raw', translate)).toBe('[auth.login.twoFactor.errors.invalidCode]')
        expect(resolveTwoFactorErrorMessage('INVALID_BACKUP_CODE', 'raw', translate)).toBe('[auth.login.twoFactor.errors.invalidCode]')
        expect(resolveTwoFactorErrorMessage('INVALID_TOTP', 'raw', translate)).toBe('[auth.login.twoFactor.errors.invalidCode]')
    })

    it('maps expired challenge cookies to a re-login message', () => {
        expect(resolveTwoFactorErrorMessage('INVALID_TWO_FACTOR_COOKIE', 'raw', translate)).toBe('[auth.login.twoFactor.errors.sessionExpired]')
        expect(resolveTwoFactorErrorMessage('SESSION_EXPIRED', 'raw', translate)).toBe('[auth.login.twoFactor.errors.sessionExpired]')
    })

    it('maps unavailable factors to a channel message', () => {
        expect(resolveTwoFactorErrorMessage('OTP_NOT_CONFIGURED', 'raw', translate)).toBe('[auth.login.twoFactor.errors.channelUnavailable]')
        expect(resolveTwoFactorErrorMessage('TOTP_NOT_CONFIGURED', 'raw', translate)).toBe('[auth.login.twoFactor.errors.channelUnavailable]')
    })

    it('keeps unknown upstream messages', () => {
        expect(resolveTwoFactorErrorMessage('UNKNOWN', 'raw message', translate)).toBe('raw message')
        expect(resolveTwoFactorErrorMessage(undefined, undefined, translate)).toBe('[auth.login.verifyFailed]')
    })
})
