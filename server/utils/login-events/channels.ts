import { findTwoFactorCoverageChannel } from '@/server/utils/two-factor-coverage/channels'
import type { TwoFactorCoverageChannel } from '@/utils/shared/two-factor-coverage-channels'
import type { LoginEventChannel } from '@/utils/shared/login-events'

/**
 * 登录事件通道解析（阶段 12 M1.2）。
 *
 * 2FA 覆盖通道（阶段 11）优先按路径映射，保证「挑战事件」与登录页提示、
 * 安全审计使用同一套通道标识；凭据登录与验证码登录再单独补齐。
 */
const COVERAGE_CHANNEL_MAP: Record<TwoFactorCoverageChannel, LoginEventChannel> = {
    'email-otp': 'email-otp',
    'phone-otp': 'phone-otp',
    'email-otp-verification': 'email-verification',
    'email-link-verification': 'email-verification',
    'magic-link': 'magic-link',
    'social-callback': 'social',
    'social-id-token': 'social',
    'sso-oidc': 'sso',
    'sso-oidc-shared': 'sso',
    'sso-saml': 'sso',
}

const CREDENTIAL_PATHS: Record<string, LoginEventChannel> = {
    '/sign-in/email': 'email',
    '/sign-in/username': 'username',
    '/sign-in/phone-number': 'phone',
    /* 匿名会话也是登录通道，但无法归入具名通道，统一记 unknown（D18 兜底值） */
    '/sign-in/anonymous': 'unknown',
}

/*
 * 明确不进入事件表：
 * - `/sign-up/email` 等注册即登录路径（D18 只登记登录 / 登出事件）；
 * - `/admin/impersonate-user`（管理员扮演不是用户登录）。
 */

const SOCIAL_CALLBACK_PATTERN = /^\/callback\/([^/]+)$/u
const SSO_CALLBACK_PATTERN = /^\/sso\/callback\/([^/]+)$/u
const SSO_SAML_ACS_PATTERN = /^\/sso\/saml2\/sp\/acs\/([^/]+)$/u

/** 返回该路径对应的登录通道；非登录路径返回 null */
export function resolveLoginEventChannel(path: string | undefined): LoginEventChannel | null {
    if (!path) {
        return null
    }
    const credential = CREDENTIAL_PATHS[path]
    if (credential) {
        return credential
    }
    const coverage = findTwoFactorCoverageChannel(path)
    if (coverage) {
        return COVERAGE_CHANNEL_MAP[coverage.id]
    }
    return null
}

/** 从路径提取社交 / SSO provider；共享 SSO 回调无法从路径判断 */
export function resolveLoginEventProvider(path: string | undefined): string | null {
    if (!path) {
        return null
    }
    const matched = path.match(SOCIAL_CALLBACK_PATTERN)
        ?? path.match(SSO_CALLBACK_PATTERN)
        ?? path.match(SSO_SAML_ACS_PATTERN)
    const provider = matched?.[1]
    if (!provider || provider === 'callback') {
        return null
    }
    try {
        return decodeURIComponent(provider)
    } catch {
        return provider
    }
}

/** 2FA 验证因子（与阶段 11 审计口径一致） */
export function resolveTwoFactorFactor(path: string | undefined): 'totp' | 'otp' | 'backup-code' | 'unknown' {
    if (!path) {
        return 'unknown'
    }
    if (path.endsWith('/verify-totp')) {
        return 'totp'
    }
    if (path.endsWith('/verify-otp')) {
        return 'otp'
    }
    if (path.endsWith('/verify-backup-code')) {
        return 'backup-code'
    }
    return 'unknown'
}

export function isTwoFactorVerifyPath(path: string | undefined): boolean {
    return Boolean(path?.startsWith('/two-factor/verify-'))
}
