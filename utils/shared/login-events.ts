/**
 * 登录事件枚举（阶段 12 D18，服务端与管理端共享）。
 *
 * 事件只描述「发生了什么」，不承载密码、验证码、令牌或恢复材料；
 * 通道 ID 与阶段 11 的 2FA 覆盖通道保持可映射关系（`email-otp` / `phone-otp` /
 * `magic-link` / `social` / `sso`），新增通道时类型、守卫与契约测试同批更新。
 *
 * `two_factor_challenge` 表示挑战已发出，`result` 固定记 `success`；
 * 验证结果由 `two_factor_success` / `two_factor_failure` 承载（M1.4 契约锁定）。
 */
export const LOGIN_EVENT_TYPES = [
    'sign_in_success',
    'sign_in_failure',
    'two_factor_challenge',
    'two_factor_success',
    'two_factor_failure',
    'sign_out',
    'session_revoked',
] as const

export type LoginEventType = typeof LOGIN_EVENT_TYPES[number]

export const LOGIN_EVENT_RESULTS = [
    'success',
    'failure',
] as const

export type LoginEventResult = typeof LOGIN_EVENT_RESULTS[number]

export const LOGIN_EVENT_CHANNELS = [
    'email',
    'username',
    'phone',
    'email-otp',
    'phone-otp',
    'magic-link',
    'email-verification',
    'social',
    'sso',
    'unknown',
] as const

export type LoginEventChannel = typeof LOGIN_EVENT_CHANNELS[number]

/** 写入端未知通道统一回落值（D18 / M1.4） */
export const LOGIN_EVENT_UNKNOWN_CHANNEL: LoginEventChannel = 'unknown'

export function isLoginEventType(value: unknown): value is LoginEventType {
    return typeof value === 'string' && (LOGIN_EVENT_TYPES as readonly string[]).includes(value)
}

export function isLoginEventResult(value: unknown): value is LoginEventResult {
    return typeof value === 'string' && (LOGIN_EVENT_RESULTS as readonly string[]).includes(value)
}

export function isLoginEventChannel(value: unknown): value is LoginEventChannel {
    return typeof value === 'string' && (LOGIN_EVENT_CHANNELS as readonly string[]).includes(value)
}

/** 未知 / 非法通道回落 `unknown`，写入路径不应因此失败 */
export function normalizeLoginEventChannel(value: unknown): LoginEventChannel {
    return isLoginEventChannel(value) ? value : LOGIN_EVENT_UNKNOWN_CHANNEL
}
