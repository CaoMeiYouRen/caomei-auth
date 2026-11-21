import { TWO_FACTOR_COVERAGE } from '@/utils/shared/env'
import type { TwoFactorCoverageChannel } from '@/utils/shared/two-factor-coverage-channels'

/**
 * 2FA 覆盖收紧（阶段 11）的通道定义。
 *
 * 只登记「会创建会话的用户自助登录通道」；匿名登录、新用户注册即登录、
 * 管理员扮演（`/admin/impersonate-user`）不在覆盖内。
 */
export type { TwoFactorCoverageChannel } from '@/utils/shared/two-factor-coverage-channels'

export type TwoFactorCoverageSwitch = keyof typeof TWO_FACTOR_COVERAGE

export interface TwoFactorCoverageChannelDefinition {
    id: TwoFactorCoverageChannel
    switch: TwoFactorCoverageSwitch
    /** XHR 通道返回 `twoFactorRedirect`；浏览器导航通道 302 到登录页 */
    responseMode: 'json' | 'redirect'
    matches: (path: string) => boolean
    /** 已登录用户验证邮箱时复用当前会话，不重复挑战 */
    skipWhenSessionMatches?: boolean
}

const SOCIAL_CALLBACK_PATTERN = /^\/callback\/[^/]+$/u
const SSO_OIDC_CALLBACK_PATTERN = /^\/sso\/callback\/[^/]+$/u
const SSO_SAML_ACS_PATTERN = /^\/sso\/saml2\/sp\/acs\/[^/]+$/u

export const TWO_FACTOR_COVERAGE_CHANNELS: readonly TwoFactorCoverageChannelDefinition[] = [
    {
        id: 'email-otp',
        switch: 'emailOtp',
        responseMode: 'json',
        matches: (path) => path === '/sign-in/email-otp',
    },
    {
        id: 'phone-otp',
        switch: 'phoneOtp',
        responseMode: 'json',
        matches: (path) => path === '/phone-number/verify',
        skipWhenSessionMatches: true,
    },
    {
        id: 'email-otp-verification',
        switch: 'emailVerification',
        responseMode: 'json',
        matches: (path) => path === '/email-otp/verify-email',
        skipWhenSessionMatches: true,
    },
    {
        id: 'email-link-verification',
        switch: 'emailVerification',
        responseMode: 'redirect',
        matches: (path) => path === '/verify-email',
        skipWhenSessionMatches: true,
    },
    {
        id: 'magic-link',
        switch: 'magicLink',
        responseMode: 'redirect',
        matches: (path) => path === '/magic-link/verify',
    },
    {
        id: 'social-callback',
        switch: 'social',
        responseMode: 'redirect',
        matches: (path) => SOCIAL_CALLBACK_PATTERN.test(path),
    },
    {
        id: 'social-id-token',
        switch: 'social',
        responseMode: 'json',
        matches: (path) => path === '/sign-in/social',
    },
    {
        id: 'sso-oidc',
        switch: 'sso',
        responseMode: 'redirect',
        matches: (path) => SSO_OIDC_CALLBACK_PATTERN.test(path),
    },
    {
        id: 'sso-oidc-shared',
        switch: 'sso',
        responseMode: 'redirect',
        matches: (path) => path === '/sso/callback',
    },
    {
        id: 'sso-saml',
        switch: 'sso',
        responseMode: 'redirect',
        matches: (path) => SSO_SAML_ACS_PATTERN.test(path),
    },
]

export function findTwoFactorCoverageChannel(path: string | undefined): TwoFactorCoverageChannelDefinition | undefined {
    if (!path) {
        return undefined
    }
    return TWO_FACTOR_COVERAGE_CHANNELS.find((channel) => channel.matches(path))
}

export function isTwoFactorCoverageChannelEnabled(
    channel: TwoFactorCoverageChannelDefinition,
    config: Record<TwoFactorCoverageSwitch, boolean> = TWO_FACTOR_COVERAGE,
): boolean {
    return config[channel.switch] === true
}

function containsControlCharacters(value: string): boolean {
    for (const character of value) {
        const codePoint = character.codePointAt(0)
        if (codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7F)) {
            return true
        }
    }
    return false
}

/** 只接受站内相对路径，防止开放重定向 */
export function resolveSafeRedirect(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return '/'
    }
    // 拒绝控制字符与双重编码绕过（浏览器会剥离制表符 / 换行）
    if (value.includes('%5C') || value.includes('%2F%2F') || containsControlCharacters(value)) {
        return '/'
    }
    return value
}

export function buildChallengeRedirect(channel: TwoFactorCoverageChannel, callbackURL: unknown): string {
    const redirect = resolveSafeRedirect(callbackURL)
    return `/login?twoFactor=1&channel=${encodeURIComponent(channel)}&redirect=${encodeURIComponent(redirect)}`
}
