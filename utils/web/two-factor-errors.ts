/**
 * 2FA 验证错误分类（阶段 11 M4.2）。
 *
 * 把上游错误码映射为可区分的提示：验证码错误 / 验证会话失效 / 通道不可用。
 * 未识别的错误保留原始消息，避免吞掉上游新增信息。
 */
export type TwoFactorErrorTranslator = (key: string) => string

export function resolveTwoFactorErrorMessage(
    code: string | undefined,
    message: string | undefined,
    t: TwoFactorErrorTranslator,
): string {
    switch (code) {
        case 'INVALID_CODE':
        case 'INVALID_BACKUP_CODE':
        case 'INVALID_TOTP':
            return t('auth.login.twoFactor.errors.invalidCode')
        case 'INVALID_TWO_FACTOR_COOKIE':
        case 'SESSION_EXPIRED':
            return t('auth.login.twoFactor.errors.sessionExpired')
        case 'OTP_NOT_CONFIGURED':
        case 'TOTP_NOT_CONFIGURED':
            return t('auth.login.twoFactor.errors.channelUnavailable')
        default:
            return message || t('auth.login.verifyFailed')
    }
}
