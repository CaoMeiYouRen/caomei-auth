/**
 * 登录页 2FA 挑战查询参数解析（阶段 11 M5.1）。
 *
 * 服务端在浏览器导航通道（魔法链接 / 邮箱验证 / 社交 / SSO）上 302 到
 * `/login?twoFactor=1&channel=...&redirect=...`；这里只负责解析与站内回跳校验，
 * 不授予任何状态。
 */
import { isTwoFactorCoverageChannel, type TwoFactorCoverageChannel } from '@/utils/shared/two-factor-coverage-channels'

export interface TwoFactorChallengeQuery {
    active: boolean
    channel: TwoFactorCoverageChannel | null
    redirect: string | null
}

function firstQueryValue(value: unknown): string | null {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : null
    }
    return typeof value === 'string' ? value : null
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

export function isSafeInternalPath(value: string): boolean {
    if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return false
    }
    return !containsControlCharacters(value)
}

export function readTwoFactorChallengeQuery(query: Record<string, unknown>): TwoFactorChallengeQuery {
    const active = firstQueryValue(query.twoFactor) === '1'
    if (!active) {
        return { active: false, channel: null, redirect: null }
    }
    const channel = firstQueryValue(query.channel)
    if (!channel || !isTwoFactorCoverageChannel(channel)) {
        return { active: false, channel: null, redirect: null }
    }
    const redirect = firstQueryValue(query.redirect)
    return {
        active: true,
        channel,
        redirect: redirect && isSafeInternalPath(redirect) ? redirect : null,
    }
}
