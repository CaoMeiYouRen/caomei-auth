import { PasswordStrength, getDefaultPasswordStrength, passwordStrengthPresets } from '@/utils/shared/password'
import { useI18nText } from '@/composables/utils/use-i18n-text'

/** 密码强度枚举 → i18n 键后缀 */
const STRENGTH_KEYS: Record<PasswordStrength, string> = {
    [PasswordStrength.WEAK]: 'weak',
    [PasswordStrength.MEDIUM]: 'medium',
    [PasswordStrength.STRONG]: 'strong',
    [PasswordStrength.VERY_STRONG]: 'veryStrong',
}

/**
 * 密码强度 / 要求的本地化文案。
 *
 * `utils/shared/password.ts` 只保留强度计算与预设，文案统一走 `auth.password.*`，
 * 避免共享工具直接产出中文导致英文界面残留。
 */
export function usePasswordHints() {
    const t = useI18nText()

    const resolveStrength = (strength?: PasswordStrength) => strength ?? getDefaultPasswordStrength()

    const strengthLabel = (strength?: PasswordStrength) => t(`auth.password.strength.${STRENGTH_KEYS[resolveStrength(strength)]}`)

    return {
        /** 强度标签（弱 / 中等 / 强 / 非常强） */
        strengthLabel,

        /** 带前缀的强度说明（密码强度：强） */
        strengthSummary: (strength?: PasswordStrength) => t('auth.password.strengthSummary', { level: strengthLabel(strength) }),

        /** 输入框旁的要求提示（含最小长度） */
        requirementHint: (strength?: PasswordStrength) => {
            const target = resolveStrength(strength)
            return t(`auth.password.requirements.${STRENGTH_KEYS[target]}`, {
                minLength: passwordStrengthPresets[target].minLength,
            })
        },

        requirementsMet: () => t('auth.password.requirements.met'),

        /**
         * 密码校验失败时的本地化提示；通过时返回 null。
         * 校验顺序与阈值沿用 `utils/shared/password` 的预设，只把文案换成 i18n 键。
         */
        validationError: (password: string, strength?: PasswordStrength): string | null => {
            if (!password) {
                return t('auth.password.error.required')
            }

            const target = resolveStrength(strength)
            const preset = passwordStrengthPresets[target]

            if (password.length < (preset.minLength || 8)) {
                return t('auth.password.error.minLength', {
                    min: preset.minLength || 8,
                    current: password.length,
                })
            }
            if (password.length > 64) {
                return t('auth.password.error.tooLong')
            }

            const missing: string[] = []
            const countOf = (pattern: RegExp) => (password.match(pattern) || []).length

            if (preset.minLowercase && countOf(/[a-z]/g) < preset.minLowercase) {
                missing.push(t('auth.password.error.type.lowercase', { count: preset.minLowercase }))
            }
            if (preset.minUppercase && countOf(/[A-Z]/g) < preset.minUppercase) {
                missing.push(t('auth.password.error.type.uppercase', { count: preset.minUppercase }))
            }
            if (preset.minNumbers && countOf(/\d/g) < preset.minNumbers) {
                missing.push(t('auth.password.error.type.number', { count: preset.minNumbers }))
            }
            if (preset.minSymbols && countOf(/[^A-Za-z0-9]/g) < preset.minSymbols) {
                missing.push(t('auth.password.error.type.symbol', { count: preset.minSymbols }))
            }

            if (missing.length > 0) {
                return t('auth.password.error.missing', { types: missing.join(t('auth.password.error.typeSeparator')) })
            }

            return null
        },
    }
}
