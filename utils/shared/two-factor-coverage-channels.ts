/**
 * 2FA 覆盖通道 ID（服务端与登录页共享，阶段 11）。
 *
 * 服务端的通道定义（路径 / 开关 / 响应形态）在
 * `server/utils/two-factor-coverage/channels.ts`；登录页只消费本文件的 ID 白名单，
 * 避免新增通道时两处静默漂移。
 */
export const TWO_FACTOR_COVERAGE_CHANNEL_IDS = [
    'email-otp',
    'phone-otp',
    'email-otp-verification',
    'email-link-verification',
    'magic-link',
    'social-callback',
    'social-id-token',
    'sso-oidc',
    'sso-oidc-shared',
    'sso-saml',
] as const

export type TwoFactorCoverageChannel = typeof TWO_FACTOR_COVERAGE_CHANNEL_IDS[number]

export function isTwoFactorCoverageChannel(value: string): value is TwoFactorCoverageChannel {
    return (TWO_FACTOR_COVERAGE_CHANNEL_IDS as readonly string[]).includes(value)
}
