import type { LoginEventChannel, LoginEventResult, LoginEventType } from '@/utils/shared/login-events'

/**
 * 登录事件展示用的 i18n 键映射（面板与热力图共用）。
 *
 * 动态 key 不在 i18n 静态扫描范围，集中在这里便于与 5 套语言包同步核对。
 */
export const LOGIN_EVENT_TYPE_LABEL_KEYS: Record<LoginEventType, string> = {
    sign_in_success: 'types.signInSuccess',
    sign_in_failure: 'types.signInFailure',
    two_factor_challenge: 'types.twoFactorChallenge',
    two_factor_success: 'types.twoFactorSuccess',
    two_factor_failure: 'types.twoFactorFailure',
    sign_out: 'types.signOut',
    session_revoked: 'types.sessionRevoked',
}

export const LOGIN_EVENT_CHANNEL_LABEL_KEYS: Record<LoginEventChannel, string> = {
    email: 'channels.email',
    username: 'channels.username',
    phone: 'channels.phone',
    'email-otp': 'channels.emailOtp',
    'phone-otp': 'channels.phoneOtp',
    'magic-link': 'channels.magicLink',
    'email-verification': 'channels.emailVerification',
    social: 'channels.social',
    sso: 'channels.sso',
    unknown: 'channels.unknown',
}

export function loginEventTypeLabelKey(type: LoginEventType): string {
    return `admin.logs.events.${LOGIN_EVENT_TYPE_LABEL_KEYS[type]}`
}

export function loginEventChannelLabelKey(channel: LoginEventChannel): string {
    return `admin.logs.events.${LOGIN_EVENT_CHANNEL_LABEL_KEYS[channel]}`
}

export function loginEventResultLabelKey(result: LoginEventResult): string {
    return `admin.logs.events.results.${result}`
}
