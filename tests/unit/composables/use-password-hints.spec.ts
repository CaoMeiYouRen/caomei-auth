import { describe, expect, it, vi } from 'vitest'
import { PasswordStrength } from '@/utils/shared/password'
import { usePasswordHints } from '@/composables/utils/use-password-hints'

const messages: Record<string, string> = {
    'common.listSeparator': '、',
    'auth.password.strength.weak': '弱',
    'auth.password.strength.medium': '中等',
    'auth.password.strength.strong': '强',
    'auth.password.strength.veryStrong': '非常强',
    'auth.password.requirements.weak': '至少 {minLength} 个字符',
    'auth.password.requirements.medium': '至少 {minLength} 个字符，包含字母和数字',
    'auth.password.requirements.strong': '至少 {minLength} 个字符，包含大小写字母、数字和特殊字符',
    'auth.password.requirements.veryStrong': '至少 {minLength} 个字符，包含多个大小写字母、数字和特殊字符',
    'auth.password.requirements.met': '✓ 密码强度达标',
    'auth.password.error.required': '请输入密码',
    'auth.password.error.tooLong': '密码长度不能超过 64 个字符',
    'auth.password.error.minLength': '密码长度至少需要 {min} 个字符，当前为 {current} 个字符',
    'auth.password.error.missing': '密码还需要包含：{types}',
    'auth.password.error.typeSeparator': '、',
    'auth.password.strengthSummary': '密码强度：{level}',
    'auth.password.error.type.lowercase': '{count} 个小写字母',
    'auth.password.error.type.uppercase': '{count} 个大写字母',
    'auth.password.error.type.number': '{count} 个数字',
    'auth.password.error.type.symbol': '{count} 个特殊字符',
}

vi.mock('@/composables/utils/use-i18n-text', () => ({
    useI18nText: () => (key: string, named?: Record<string, unknown>) => {
        const template = messages[key]
        if (!template) {
            return key
        }
        return template.replace(/\{(\w+)\}/g, (raw, name: string) => (named && name in named ? String(named[name]) : raw))
    },
}))

describe('usePasswordHints', () => {
    const hints = usePasswordHints()

    it('resolves strength labels and requirement hints', () => {
        expect(hints.strengthLabel(PasswordStrength.MEDIUM)).toBe('中等')
        expect(hints.strengthSummary(PasswordStrength.MEDIUM)).toBe('密码强度：中等')
        expect(hints.strengthLabel()).toBeTruthy()
        expect(hints.requirementHint(PasswordStrength.WEAK)).toBe('至少 6 个字符')
        expect(hints.requirementHint(PasswordStrength.STRONG)).toContain('至少 8 个字符')
    })

    it('reports required and length errors', () => {
        expect(hints.validationError('', PasswordStrength.STRONG)).toBe('请输入密码')
        expect(hints.validationError('a', PasswordStrength.STRONG)).toBe('密码长度至少需要 8 个字符，当前为 1 个字符')
        expect(hints.validationError('A'.repeat(65), PasswordStrength.WEAK)).toBe('密码长度不能超过 64 个字符')
    })

    it('lists missing character types in the current language', () => {
        const message = hints.validationError('abcdefgh', PasswordStrength.STRONG)

        expect(message).toContain('密码还需要包含：')
        expect(message).toContain('1 个大写字母')
        expect(message).toContain('1 个数字')
        expect(message).toContain('1 个特殊字符')
    })

    it('returns null for a password that satisfies the target strength', () => {
        expect(hints.validationError('ValidPass1!', PasswordStrength.STRONG)).toBeNull()
    })
})
