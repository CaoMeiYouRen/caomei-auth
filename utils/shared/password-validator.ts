import { PasswordStrength, getPasswordValidationError } from './password'

/**
 * 密码验证结果接口
 */
export interface PasswordValidationResult {
    /** 是否有效 */
    isValid: boolean
    /** 错误信息 */
    error?: string
}

/**
 * 通用密码验证函数
 *
 * @param password 密码
 * @param confirmPassword 确认密码（可选）
 * @param targetStrength 目标强度级别
 * @returns 验证结果
 */
export function validatePassword(
    password: string,
    confirmPassword?: string,
    targetStrength: PasswordStrength = PasswordStrength.STRONG,
): PasswordValidationResult {
    // 检查密码本身
    const passwordError = getPasswordValidationError(password, targetStrength)
    if (passwordError) {
        return {
            isValid: false,
            error: passwordError,
        }
    }

    // 检查密码确认
    if (confirmPassword !== undefined && password !== confirmPassword) {
        return {
            isValid: false,
            error: '两次输入的密码不一致',
        }
    }

    return { isValid: true }
}

/**
 * 批量表单密码验证
 *
 * @param formData 表单数据
 * @param targetStrength 目标强度级别
 * @returns 错误信息对象
 */
export function validatePasswordForm(
    formData: {
        password?: string
        confirmPassword?: string
        currentPassword?: string
    },
    targetStrength: PasswordStrength = PasswordStrength.STRONG,
): Record<string, string> {
    const errors: Record<string, string> = {}

    // 验证当前密码（如果需要）
    if (formData.currentPassword !== undefined && !formData.currentPassword) {
        errors.currentPassword = '请输入当前密码'
    }

    // 验证新密码
    if (formData.password !== undefined) {
        const passwordValidation = validatePassword(
            formData.password,
            formData.confirmPassword,
            targetStrength,
        )

        if (!passwordValidation.isValid) {
            if (formData.confirmPassword !== undefined && formData.password !== formData.confirmPassword) {
                // 如果密码不匹配，将错误分配到确认密码字段
                errors.confirmPassword = passwordValidation.error!
            } else {
                // 其他密码错误分配到密码字段
                errors.password = passwordValidation.error!
            }
        }

        // 单独验证确认密码是否为空
        if (formData.confirmPassword !== undefined && !formData.confirmPassword && formData.password) {
            errors.confirmPassword = '请确认密码'
        }
    }

    return errors
}
