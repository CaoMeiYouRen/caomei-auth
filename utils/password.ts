import isStrongPassword from 'validator/es/lib/isStrongPassword'
import type { StrongPasswordOptions } from 'validator'
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
 * 验证密码强度（重载：返回布尔值）
 *
 * @param password 要验证的密码
 * @param options 验证选项或预设强度级别
 * @returns 密码是否符合要求
 */
export function passwordValidator(
    password: string,
    options?: PasswordValidatorOptions & { returnScore?: false }
): boolean
export function passwordValidator(
    password: string,
    options?: PasswordStrength
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
    options: PasswordValidatorOptions & { returnScore: true }
): number

/**
 * 验证密码强度
 *
 * @param password 要验证的密码
 * @param options 验证选项或预设强度级别，默认为 STRONG 级别
 * @returns 根据 returnScore 选项返回布尔值或数值得分
 */
export function passwordValidator(
    password: string,
    options: PasswordValidatorOptions | PasswordStrength = PasswordStrength.STRONG,
): boolean | number {
    // 如果传入的是预设强度级别，则使用对应的配置
    const finalOptions: PasswordValidatorOptions = typeof options === 'string'
        ? passwordStrengthPresets[options]
        : options

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
 * @param options 评分选项，默认使用强密码标准
 * @returns 密码得分
 */
export function getPasswordScore(
    password: string,
    options: PasswordValidatorOptions = passwordStrengthPresets[PasswordStrength.STRONG],
): number {
    return passwordValidator(password, { ...options, returnScore: true }) as number
}
