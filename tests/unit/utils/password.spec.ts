import { describe, it, expect, afterEach, vi } from 'vitest'

const importPasswordModule = async (level: string = 'strong') => {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        PASSWORD_STRENGTH_LEVEL: level,
    }))
    return import('@/utils/shared/password')
}

afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
})

describe('utils/password', () => {
    describe('getDefaultPasswordStrength', () => {
        it('derives strength from environment value', async () => {
            const weakModule = await importPasswordModule('weak')
            expect(weakModule.getDefaultPasswordStrength()).toBe(weakModule.PasswordStrength.WEAK)

            const strongModule = await importPasswordModule('strong')
            expect(strongModule.getDefaultPasswordStrength()).toBe(strongModule.PasswordStrength.STRONG)
        })

        it('falls back to STRONG when value is invalid', async () => {
            const module = await importPasswordModule('unexpected')
            expect(module.getDefaultPasswordStrength()).toBe(module.PasswordStrength.STRONG)
        })
    })

    describe('passwordValidator', () => {
        it('validates strong passwords using preset levels', async () => {
            const { passwordValidator, PasswordStrength } = await importPasswordModule('strong')
            expect(passwordValidator('ValidPass1!')).toBe(true)
            expect(passwordValidator('ValidPass1!', PasswordStrength.STRONG)).toBe(true)
            expect(passwordValidator('weakpass', PasswordStrength.MEDIUM)).toBe(false)
        })

        it('returns a numerical score when requested', async () => {
            const { passwordValidator } = await importPasswordModule('strong')
            const score = passwordValidator('ValidPass1!', {
                minLength: 4,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
                returnScore: true,
            })
            expect(typeof score).toBe('number')
            expect(score).toBeGreaterThan(0)
        })
    })

    describe('getPasswordStrength and score helpers', () => {
        it('calculates strength buckets correctly', async () => {
            const { getPasswordStrength, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordStrength('Aa1!Aa1!Bb2@')).toBe(PasswordStrength.VERY_STRONG)
            expect(getPasswordStrength('Aa1!test')).toBe(PasswordStrength.STRONG)
            expect(getPasswordStrength('abc12345')).toBe(PasswordStrength.MEDIUM)
            expect(getPasswordStrength('abc')).toBe(PasswordStrength.WEAK)
        })

        it('computes password score using configured defaults', async () => {
            const { getPasswordScore } = await importPasswordModule('medium')
            const score = getPasswordScore('ValidPass1!', {
                minLength: 4,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            expect(score).toBeGreaterThan(0)
        })
    })

    describe('presentation helpers', () => {
        it('maps strength levels to descriptive text', async () => {
            const { getPasswordStrengthText, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordStrengthText(PasswordStrength.VERY_STRONG)).toBe('非常强')
            expect(getPasswordStrengthText(PasswordStrength.STRONG)).toBe('强')
            expect(getPasswordStrengthText(PasswordStrength.MEDIUM)).toBe('中等')
            expect(getPasswordStrengthText(PasswordStrength.WEAK)).toBe('弱')
        })

        it('maps strength levels to colour palette', async () => {
            const { getPasswordStrengthColor, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordStrengthColor(PasswordStrength.VERY_STRONG)).toBe('#22c55e')
            expect(getPasswordStrengthColor(PasswordStrength.STRONG)).toBe('#3b82f6')
            expect(getPasswordStrengthColor(PasswordStrength.MEDIUM)).toBe('#f59e0b')
            expect(getPasswordStrengthColor(PasswordStrength.WEAK)).toBe('#ef4444')
        })

        it('provides detailed requirements text', async () => {
            const { getPasswordRequirements, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordRequirements(PasswordStrength.STRONG)).toContain('至少 8 个字符')
            expect(getPasswordRequirements(PasswordStrength.VERY_STRONG)).toContain('至少 12 个字符')
        })

        it('provides short requirement hints per strength', async () => {
            const { getPasswordRequirementsShort, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordRequirementsShort(PasswordStrength.WEAK)).toContain('至少 6 个字符')
            expect(getPasswordRequirementsShort(PasswordStrength.MEDIUM)).toContain('包含字母和数字')
            expect(getPasswordRequirementsShort(PasswordStrength.STRONG)).toContain('特殊字符')
            expect(getPasswordRequirementsShort(PasswordStrength.VERY_STRONG)).toContain('多个大小写字母')
        })
    })

    describe('getPasswordValidationError', () => {
        it('enforces minimum length', async () => {
            const { getPasswordValidationError, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordValidationError('abc', PasswordStrength.STRONG)).toBe('密码长度至少需要 8 个字符，当前为 3 个字符')
        })

        it('enforces missing character categories', async () => {
            const { getPasswordValidationError, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordValidationError('abcdefghi', PasswordStrength.STRONG)).toBe('密码还需要包含：1 个大写字母、1 个数字、1 个特殊字符')
        })

        it('limits password length', async () => {
            const { getPasswordValidationError, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordValidationError('x'.repeat(65), PasswordStrength.STRONG)).toBe('密码长度不能超过 64 个字符')
        })

        it('returns null when password meets requirements', async () => {
            const { getPasswordValidationError, PasswordStrength } = await importPasswordModule('strong')
            expect(getPasswordValidationError('ValidPass1!', PasswordStrength.STRONG)).toBeNull()
        })
    })
})
