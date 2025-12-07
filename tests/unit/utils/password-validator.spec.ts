import { describe, it, expect, vi, afterEach } from 'vitest'
import { PasswordStrength } from '@/utils/shared/password'
import * as passwordModule from '@/utils/shared/password'
import { validatePassword, validatePasswordForm } from '@/utils/shared/password-validator'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('utils/password-validator', () => {
    describe('validatePassword', () => {
        it('propagates validation errors from password helper', () => {
            vi.spyOn(passwordModule, 'getPasswordValidationError').mockReturnValue('长度不足')
            const result = validatePassword('short')
            expect(result).toEqual({ isValid: false, error: '长度不足' })
        })

        it('detects mismatched confirmation', () => {
            vi.spyOn(passwordModule, 'getPasswordValidationError').mockReturnValue(null)
            const result = validatePassword('ValidPass1!', 'Mismatch', PasswordStrength.STRONG)
            expect(result).toEqual({ isValid: false, error: '两次输入的密码不一致' })
        })

        it('returns success when password is valid and confirmed', () => {
            vi.spyOn(passwordModule, 'getPasswordValidationError').mockReturnValue(null)
            const result = validatePassword('ValidPass1!', 'ValidPass1!', PasswordStrength.STRONG)
            expect(result).toEqual({ isValid: true })
        })
    })

    describe('validatePasswordForm', () => {
        it('requires current password when field is present', () => {
            const errors = validatePasswordForm({ currentPassword: '' })
            expect(errors.currentPassword).toBe('请输入当前密码')
        })

        it('surfaces password rule violations on the password field', () => {
            const errors = validatePasswordForm({ password: 'abc', confirmPassword: 'abc' }, PasswordStrength.STRONG)
            expect(errors.password).toBeDefined()
            expect(errors.password).toContain('密码长度至少需要')
        })

        it('marks confirmation errors distinctly when passwords differ', () => {
            const errors = validatePasswordForm({ password: 'ValidPass1!', confirmPassword: 'Mismatch' }, PasswordStrength.STRONG)
            expect(errors.confirmPassword).toBe('两次输入的密码不一致')
        })

        it('requires confirmation when provided but empty', () => {
            const errors = validatePasswordForm({ password: 'ValidPass1!', confirmPassword: '' }, PasswordStrength.STRONG)
            expect(errors.confirmPassword).toBe('请确认密码')
        })
    })
})
