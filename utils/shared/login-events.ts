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

/**
 * 事件类型 × 通道的适用矩阵（阶段 12 M1.4 契约）。
 *
 * 定义「哪些组合允许出现在事件表中」，M2 的筛选与统计、后续新增写入点都以本表为准；
 * 新增枚举时必须同批更新本表与契约测试。
 *
 * 注意：`two_factor_*` / `sign_out` / `session_revoked` 只允许 `unknown` 是当前写入能力的
 * 下界（上游挑战会清空 newSession，验证 / 登出拿不到原始通道），不是业务语义；
 * 后续补齐通道归因时同批放宽本矩阵。
 */
export const LOGIN_EVENT_CHANNEL_MATRIX: Record<LoginEventType, readonly LoginEventChannel[]> = {
    sign_in_success: LOGIN_EVENT_CHANNELS,
    sign_in_failure: LOGIN_EVENT_CHANNELS,
    two_factor_challenge: LOGIN_EVENT_CHANNELS,
    two_factor_success: [LOGIN_EVENT_UNKNOWN_CHANNEL],
    two_factor_failure: [LOGIN_EVENT_UNKNOWN_CHANNEL],
    sign_out: [LOGIN_EVENT_UNKNOWN_CHANNEL],
    session_revoked: [LOGIN_EVENT_UNKNOWN_CHANNEL],
}

/** 每个事件类型允许的结果（登出 / 撤销可能因数据库异常失败） */
export const LOGIN_EVENT_RESULT_MATRIX: Record<LoginEventType, readonly LoginEventResult[]> = {
    sign_in_success: ['success'],
    sign_in_failure: ['failure'],
    two_factor_challenge: ['success'],
    two_factor_success: ['success'],
    two_factor_failure: ['failure'],
    sign_out: ['success', 'failure'],
    session_revoked: ['success', 'failure'],
}

export function isSupportedLoginEventCombination(type: LoginEventType, channel: LoginEventChannel): boolean {
    return LOGIN_EVENT_CHANNEL_MATRIX[type].includes(channel)
}

export function isSupportedLoginEventResult(type: LoginEventType, result: LoginEventResult): boolean {
    return LOGIN_EVENT_RESULT_MATRIX[type].includes(result)
}
