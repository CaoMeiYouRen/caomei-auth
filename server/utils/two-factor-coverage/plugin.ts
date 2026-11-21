import { createAuthMiddleware, isAPIError } from 'better-auth/api'
import type { BetterAuthPlugin } from 'better-auth'
import { buildChallengeRedirect, isTwoFactorCoverageChannelEnabled, TWO_FACTOR_COVERAGE_CHANNELS } from './channels'
import { buildTwoFactorChallenge } from './challenge'
import { requestAuditMeta, writeAuditEvent } from '@/server/utils/audit-log'

const TWO_FACTOR_VERIFY_PREFIX = '/two-factor/verify-'

function resolveVerifiedFactor(path: string): 'totp' | 'otp' | 'backup-code' | 'unknown' {
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

/**
 * 2FA 覆盖收紧插件（阶段 11 M1.2 / M4.2）。
 *
 * 对会创建会话的非凭据登录通道复用上游挑战；挑战签发与因子验证写结构化审计。
 * 开关关闭时 matcher 直接不命中，行为回到「仅凭据登录触发 2FA」。
 */
export function twoFactorCoveragePlugin(): BetterAuthPlugin {
    return {
        id: 'two-factor-coverage',
        hooks: {
            after: [
                ...TWO_FACTOR_COVERAGE_CHANNELS.map((channel) => ({
                    matcher: (ctx: { path?: string }) => {
                        if (!isTwoFactorCoverageChannelEnabled(channel)) {
                            return false
                        }
                        return channel.matches(ctx.path ?? '')
                    },
                    handler: createAuthMiddleware(async (ctx) => {
                        const outcome = await buildTwoFactorChallenge(ctx, channel)
                        if (!outcome) {
                            return
                        }

                        const meta = requestAuditMeta(ctx.request)
                        writeAuditEvent({
                            action: 'twoFactor.challenge',
                            actorId: outcome.userId,
                            targetUserId: outcome.userId,
                            after: { channel: channel.id },
                            ...meta,
                        })

                        if (channel.responseMode === 'json') {
                            return { ...outcome.payload, channel: channel.id }
                        }

                        const callbackURL = (ctx.query as Record<string, unknown> | undefined)?.callbackURL
                        throw ctx.redirect(buildChallengeRedirect(channel.id, callbackURL))
                    }),
                })),
                {
                    matcher: (ctx: { path?: string }) => (ctx.path ?? '').startsWith(TWO_FACTOR_VERIFY_PREFIX),
                    handler: createAuthMiddleware(async (ctx) => {
                        const path = ctx.path ?? ''
                        const factor = resolveVerifiedFactor(path)
                        const returned = (ctx.context as { returned?: unknown }).returned
                        const failed = isAPIError(returned)
                        const user = ctx.context.newSession?.user
                        const meta = requestAuditMeta(ctx.request)
                        const trustDevice = !failed && Boolean((ctx.body as { trustDevice?: boolean } | undefined)?.trustDevice)
                        writeAuditEvent({
                            action: 'twoFactor.verify',
                            actorId: user?.id ?? null,
                            targetUserId: user?.id ?? null,
                            after: trustDevice ? { factor, trustDevice: true } : { factor },
                            result: failed ? 'failure' : 'success',
                            reason: failed ? (returned.message || 'verify-failed') : null,
                            ...meta,
                        })
                    }),
                },
            ],
        },
    }
}
