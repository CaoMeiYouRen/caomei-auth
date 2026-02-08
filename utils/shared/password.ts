import isStrongPassword from 'validator/es/lib/isStrongPassword'
import type { StrongPasswordOptions } from 'validator'
import { PASSWORD_STRENGTH_LEVEL } from './env'

/**
 * 密码强度级别枚举
 */
export enum PasswordStrength {
    /** 弱密码 - 只要求最小长度 */
    WEAK = 'weak',
    /** 中等密码 - 要求长度和基本字符类型 */
    MEDIUM = 'medium',
    /** 强密码 - 要求长度和多种字符类型 */
    STRONG = 'strong',
    /** 超强密码 - 要求更长长度和所有字符类型 */
    VERY_STRONG = 'very_strong',
}

/**
 * 密码验证配置选项
 */
export interface PasswordValidatorOptions extends Omit<StrongPasswordOptions, 'returnScore'> {
    /** 是否返回密码得分而不是布尔值 */
    returnScore?: boolean
}

/**
 * 预设的密码强度配置
 */
const passwordStrengthPresets: Record<PasswordStrength, PasswordValidatorOptions> = {
    [PasswordStrength.WEAK]: {
        minLength: 6,
        minLowercase: 0,
        minUppercase: 0,
        minNumbers: 0,
        minSymbols: 0,
    },
    [PasswordStrength.MEDIUM]: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
    },
    [PasswordStrength.STRONG]: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    },
    [PasswordStrength.VERY_STRONG]: {
        minLength: 12,
        minLowercase: 2,
        minUppercase: 2,
        minNumbers: 2,
        minSymbols: 2,
    },
}

/**
 * 获取默认的密码强度级别（从环境变量读取）
 *
 * @returns 密码强度级别
 */
export function getDefaultPasswordStrength(): PasswordStrength {
    // const config = useRuntimeConfig().public
    const level = PASSWORD_STRENGTH_LEVEL.toLowerCase()
    // console.log('level', level)
    switch (level) {
        case 'weak':
            return PasswordStrength.WEAK
        case 'medium':
            return PasswordStrength.MEDIUM
        case 'strong':
            return PasswordStrength.STRONG
        case 'very_strong':
            return PasswordStrength.VERY_STRONG
        default:
            // 如果环境变量值无效，默认返回 STRONG
            return PasswordStrength.STRONG
    }
}

/**
 * 验证密码强度（重载：返回布尔值）
 *
 * @param password 要验证的密码
 * @param options 验证选项或预设强度级别
 * @returns 密码是否符合要求
 */
export function passwordValidator(
    password: string,
    options?: PasswordValidatorOptions & { returnScore?: false },
): boolean
export function passwordValidator(
    password: string,
    options?: PasswordStrength,
): boolean
/**
 * 验证密码强度（重载：返回得分）
 *
 * @param password 要验证的密码
 * @param options 验证选项，必须设置 returnScore 为 true
 * @returns 密码得分
 */
export function passwordValidator(
    password: string,
    options: PasswordValidatorOptions & { returnScore: true },
): number

/**
 * 验证密码强度
 *
 * @param password 要验证的密码
 * @param options 验证选项或预设强度级别，默认从环境变量读取强度级别
 * @returns 根据 returnScore 选项返回布尔值或数值得分
 */
export function passwordValidator(
    password: string,
    options?: PasswordValidatorOptions | PasswordStrength,
): boolean | number {
    // 如果没有提供选项，使用默认的密码强度级别
    const finalOptionsInput = options || getDefaultPasswordStrength()

    // 如果传入的是预设强度级别，则使用对应的配置
    const finalOptions: PasswordValidatorOptions = typeof finalOptionsInput === 'string'
        ? passwordStrengthPresets[finalOptionsInput]
        : finalOptionsInput

    // 合并默认选项
    const validatorOptions: StrongPasswordOptions = {
        minLength: 8, // 密码最小长度
        minLowercase: 1, // 密码必须包含小写字母
        minUppercase: 1, // 密码必须包含大写字母
        minNumbers: 1, // 密码必须包含数字
        minSymbols: 1, // 密码必须包含特殊字符
        returnScore: false,
        pointsPerUnique: 1, // 每个唯一字符的得分
        pointsPerRepeat: 0.5, // 每个重复字符的得分
        pointsForContainingLower: 10, // 包含小写字母的得分
        pointsForContainingUpper: 10, // 包含大写字母的得分
        pointsForContainingNumber: 10, // 包含数字的得分
        pointsForContainingSymbol: 10, // 包含特殊字符的得分
        ...finalOptions,
    }

    return isStrongPassword(password, validatorOptions as any) as boolean | number
}

/**
 * 获取密码强度描述
 *
 * @param password 要检查的密码
 * @returns 密码强度级别
 */
export function getPasswordStrength(password: string): PasswordStrength {
    if (passwordValidator(password, PasswordStrength.VERY_STRONG)) {
        return PasswordStrength.VERY_STRONG
    }
    if (passwordValidator(password, PasswordStrength.STRONG)) {
        return PasswordStrength.STRONG
    }
    if (passwordValidator(password, PasswordStrength.MEDIUM)) {
        return PasswordStrength.MEDIUM
    }
    if (passwordValidator(password, PasswordStrength.WEAK)) {
        return PasswordStrength.WEAK
    }
    // 如果连最弱的要求都不满足，返回弱密码
    return PasswordStrength.WEAK
}

/**
 * 获取密码强度得分
 *
 * @param password 要评分的密码
 * @param options 评分选项，默认使用环境变量配置的密码强度标准
 * @returns 密码得分
 */
export function getPasswordScore(
    password: string,
    options?: PasswordValidatorOptions,
): number {
    const finalOptions = options || passwordStrengthPresets[getDefaultPasswordStrength()]
    return passwordValidator(password, { ...finalOptions, returnScore: true })
}

/**
 * 获取密码强度的中文描述
 *
 * @param strength 密码强度级别
 * @returns 中文描述
 */
export function getPasswordStrengthText(strength: PasswordStrength): string {
    switch (strength) {
        case PasswordStrength.VERY_STRONG:
            return '非常强'
        case PasswordStrength.STRONG:
            return '强'
        case PasswordStrength.MEDIUM:
            return '中等'
        case PasswordStrength.WEAK:
            return '弱'
        default:
            return '弱'
    }
}

/**
 * 获取密码强度的颜色标识
 *
 * @param strength 密码强度级别
 * @returns 颜色值
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
    switch (strength) {
        case PasswordStrength.VERY_STRONG:
            return '#22c55e' // 绿色
        case PasswordStrength.STRONG:
            return '#3b82f6' // 蓝色
        case PasswordStrength.MEDIUM:
            return '#f59e0b' // 橙色
        case PasswordStrength.WEAK:
            return '#ef4444' // 红色
        default:
            return '#ef4444'
    }
}

/**
 * 根据密码强度级别获取详细的要求说明
 *
 * @param strength 目标密码强度级别，默认使用环境变量配置的强度级别
 * @returns 密码要求说明
 */
export function getPasswordRequirements(strength?: PasswordStrength): string {
    const targetStrength = strength || getDefaultPasswordStrength()
    const preset = passwordStrengthPresets[targetStrength]
    const requirements: string[] = []

    requirements.push(`至少 ${preset.minLength} 个字符`)

    if (preset.minLowercase && preset.minLowercase > 0) {
        requirements.push(`${preset.minLowercase} 个小写字母`)
    }
    if (preset.minUppercase && preset.minUppercase > 0) {
        requirements.push(`${preset.minUppercase} 个大写字母`)
    }
    if (preset.minNumbers && preset.minNumbers > 0) {
        requirements.push(`${preset.minNumbers} 个数字`)
    }
    if (preset.minSymbols && preset.minSymbols > 0) {
        requirements.push(`${preset.minSymbols} 个特殊字符（如 !@#$%^&*）`)
    }

    return `密码需要包含：${requirements.join('、')}`
}

/**
 * 获取简化的密码要求说明（用于 tooltip）
 *
 * @param strength 目标密码强度级别，默认使用环境变量配置的强度级别
 * @returns 简化的密码要求说明
 */
export function getPasswordRequirementsShort(strength?: PasswordStrength): string {
    const targetStrength = strength || getDefaultPasswordStrength()

    const preset = passwordStrengthPresets[targetStrength]

    if (targetStrength === PasswordStrength.WEAK) {
        return `至少 ${preset.minLength} 个字符`
    }

    if (targetStrength === PasswordStrength.MEDIUM) {
        return `至少 ${preset.minLength} 个字符，包含字母和数字`
    }

    if (targetStrength === PasswordStrength.STRONG) {
        return `至少 ${preset.minLength} 个字符，包含大小写字母、数字和特殊字符`
    }

    if (targetStrength === PasswordStrength.VERY_STRONG) {
        return `至少 ${preset.minLength} 个字符，包含多个大小写字母、数字和特殊字符`
    }

    return getPasswordRequirements(targetStrength)
}

/**
 * 获取密码验证失败时的友好错误信息
 *
 * @param password 输入的密码
 * @param targetStrength 目标密码强度级别，默认使用环境变量配置的强度级别
 * @returns 友好的错误信息
 */
export function getPasswordValidationError(password: string, targetStrength?: PasswordStrength): string | null {
    if (!password) {
        return '请输入密码'
    }

    const strength = targetStrength || getDefaultPasswordStrength()
    const preset = passwordStrengthPresets[strength]

    // 检查长度
    if (password.length < (preset.minLength || 8)) {
        const minLength = preset.minLength || 8
        return `密码长度至少需要 ${minLength} 个字符，当前为 ${password.length} 个字符`
    }

    if (password.length > 64) {
        return '密码长度不能超过 64 个字符'
    }

    // 检查字符类型
    const missingTypes: string[] = []

    if (preset.minLowercase && preset.minLowercase > 0) {
        const count = (password.match(/[a-z]/g) || []).length
        if (count < preset.minLowercase) {
            missingTypes.push(`${preset.minLowercase} 个小写字母`)
        }
    }

    if (preset.minUppercase && preset.minUppercase > 0) {
        const count = (password.match(/[A-Z]/g) || []).length
        if (count < preset.minUppercase) {
            missingTypes.push(`${preset.minUppercase} 个大写字母`)
        }
    }

    if (preset.minNumbers && preset.minNumbers > 0) {
        const count = (password.match(/\d/g) || []).length
        if (count < preset.minNumbers) {
            missingTypes.push(`${preset.minNumbers} 个数字`)
        }
    }

    if (preset.minSymbols && preset.minSymbols > 0) {
        const count = (password.match(/[^a-zA-Z0-9]/g) || []).length
        if (count < preset.minSymbols) {
            missingTypes.push(`${preset.minSymbols} 个特殊字符`)
        }
    }
    if (missingTypes.length > 0) {
        return `密码还需要包含：${missingTypes.join('、')}`
    }

    return null
}
