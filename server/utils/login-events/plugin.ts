import { createAuthMiddleware, getSessionFromCtx, isAPIError } from 'better-auth/api'
import type { BetterAuthPlugin } from 'better-auth'
import {
    isTwoFactorVerifyPath,
    resolveLoginEventChannel,
    resolveLoginEventProvider,
    resolveTwoFactorFactor,
} from './channels'
import { recordLoginEventSafely, type LoginEventInput } from './repository'
import { requestAuditMeta } from '@/server/utils/audit-log'
import logger from '@/server/utils/logger'
import { isTwoFactorCoverageChannel } from '@/utils/shared/two-factor-coverage-channels'
import type { LoginEventChannel } from '@/utils/shared/login-events'

/**
 * 登录事件写入插件（阶段 12 M1.2 / D20）。
 *
 * 在 better-auth after-hook 读取最终响应、新会话与请求元数据：
 * - 登录成功 / 失败按通道写 `sign_in_*`；
 * - 上游 2FA 挑战（JSON `twoFactorRedirect` 或阶段 11 的 `?twoFactor=1` 重定向）
 *   写 `two_factor_challenge`，复用阶段 11 通道标识；
 * - `/two-factor/verify-*` 写成功 / 失败事件并记录因子；
 * - `/sign-out` 由 before-hook 捕获操作人，after-hook 写 `sign_out`。
 *
 * 写入失败只 warn，不阻断认证（`recordLoginEventSafely`）；插件必须注册在
 * `twoFactorCoveragePlugin` 之后，才能看到最终挑战响应。
 */

export interface LoginEventRequestContext {
    path?: string
    body?: unknown
    query?: unknown
    request?: { headers?: Headers | { get?: (name: string) => string | null } } | null
    context: {
        returned?: unknown
        newSession?: { user?: { id?: string | null } | null } | null
        /** 请求已有会话：用于区分「登录」与登录后的验证 / 设置操作 */
        session?: { user?: { id?: string | null } | null } | null
        loginEventActorId?: string | null
    }
}

export interface LoginEventWriter {
    (input: LoginEventInput): Promise<unknown>
}

function readRedirectLocation(returned: unknown): string | null {
    if (!isAPIError(returned)) {
        return null
    }
    const headers = (returned as { headers?: unknown }).headers
    if (headers instanceof Headers) {
        return headers.get('location')
    }
    if (headers && typeof headers === 'object') {
        return (headers as Record<string, string>).location ?? null
    }
    return null
}

/** 只有 4xx / 5xx 才算失败；302 等重定向在成功路径上同样会以 APIError 形式返回 */
function isFailureResponse(returned: unknown): boolean {
    return isAPIError(returned) && Number(returned.statusCode) >= 400
}

/** 社交 / SSO 失败会以带 `error` 参数的重定向返回，同样视为失败 */
function isErrorRedirect(returned: unknown): boolean {
    const location = readRedirectLocation(returned)
    if (!location) {
        return false
    }
    try {
        const params = new URL(location, 'http://localhost').searchParams
        return params.has('error') || params.has('error_code')
    } catch {
        return false
    }
}

/** 2FA 挑战响应：上游 JSON 响应或阶段 11 带 `channel` 的 `?twoFactor=1` 重定向 */
export function isTwoFactorChallengeResponse(returned: unknown): boolean {
    if (!returned || typeof returned !== 'object') {
        return false
    }
    if ((returned as { twoFactorRedirect?: unknown }).twoFactorRedirect === true) {
        return true
    }
    const location = readRedirectLocation(returned)
    if (!location) {
        return false
    }
    try {
        const params = new URL(location, 'http://localhost').searchParams
        const channel = params.get('channel')
        /* 只认阶段 11 自己的挑战跳转，避免用户可控 callbackURL 的 twoFactor=1 污染事件 */
        return params.get('twoFactor') === '1' && channel !== null && isTwoFactorCoverageChannel(channel)
    } catch {
        return false
    }
}

function resolveProvider(ctx: LoginEventRequestContext): string | null {
    const fromPath = resolveLoginEventProvider(ctx.path)
    if (fromPath) {
        return fromPath
    }
    if (ctx.path === '/sign-in/social') {
        const provider = (ctx.body as { provider?: unknown } | undefined)?.provider
        return typeof provider === 'string' ? provider : null
    }
    if (ctx.path === '/sso/callback') {
        const providerId = (ctx.query as { providerId?: unknown } | undefined)?.providerId
        return typeof providerId === 'string' ? providerId : null
    }
    return null
}

function resolveFailureReason(returned: unknown): string | null {
    if (!isAPIError(returned)) {
        return null
    }
    const body = (returned as { body?: { code?: unknown } }).body
    /* 只保留稳定的错误码；自由文本可能包含邮箱 / 手机号，不作为事件字段 */
    return body && typeof body.code === 'string' ? body.code : 'unknown_error'
}

function buildMetadata(ctx: LoginEventRequestContext, channel: LoginEventChannel, failed: boolean): Record<string, unknown> | null {
    const metadata: Record<string, unknown> = {}
    if (channel === 'social' || channel === 'sso') {
        const provider = resolveProvider(ctx)
        if (provider) {
            metadata.provider = provider
        }
    }
    if (failed) {
        const reason = resolveFailureReason(ctx.context.returned)
        if (reason) {
            metadata.reason = reason
        }
    }
    return Object.keys(metadata).length ? metadata : null
}

/** 把一次请求上下文转换为事件写入参数；不匹配的路径返回 null（纯函数，便于单测） */
export function buildLoginEventRecord(ctx: LoginEventRequestContext): LoginEventInput | null {
    const path = ctx.path ?? ''
    const returned = ctx.context.returned
    const actorId = ctx.context.newSession?.user?.id ?? ctx.context.loginEventActorId ?? null
    const failed = isFailureResponse(returned) || (!actorId && isErrorRedirect(returned))
    const existingSessionUserId = ctx.context.session?.user?.id ?? null
    const meta = requestAuditMeta(ctx.request)

    if (path === '/sign-out') {
        return {
            type: 'sign_out',
            result: failed ? 'failure' : 'success',
            channel: 'unknown',
            userId: actorId,
            ...meta,
        }
    }

    if (isTwoFactorVerifyPath(path)) {
        /* 已登录状态下验证 2FA 是启用 / 设置流程，不是登录事件 */
        if (existingSessionUserId) {
            return null
        }
        const factor = resolveTwoFactorFactor(path)
        return {
            type: failed ? 'two_factor_failure' : 'two_factor_success',
            result: failed ? 'failure' : 'success',
            channel: 'unknown',
            userId: actorId,
            metadata: { factor },
            ...meta,
        }
    }

    const channel = resolveLoginEventChannel(path)
    if (!channel) {
        return null
    }

    /* 挑战前上游已清空 newSession；redirect 形态仅认阶段 11 的带 channel 跳转 */
    if (!actorId && isTwoFactorChallengeResponse(returned)) {
        return {
            type: 'two_factor_challenge',
            result: 'success',
            channel,
            userId: null,
            metadata: buildMetadata(ctx, channel, false),
            ...meta,
        }
    }

    if (actorId) {
        /* 已登录用户验证邮箱 / 换绑不是登录；匿名会话升级为正式用户仍应记录 */
        if (channel === 'email-verification' && existingSessionUserId === actorId) {
            return null
        }
        return {
            type: 'sign_in_success',
            result: 'success',
            channel,
            userId: actorId,
            metadata: buildMetadata(ctx, channel, false),
            ...meta,
        }
    }

    if (failed) {
        return {
            type: 'sign_in_failure',
            result: 'failure',
            channel,
            userId: null,
            metadata: buildMetadata(ctx, channel, true),
            ...meta,
        }
    }

    return null
}

function isTrackedPath(path: string | undefined): boolean {
    if (!path) {
        return false
    }
    return path === '/sign-out' || isTwoFactorVerifyPath(path) || resolveLoginEventChannel(path) !== null
}

export function loginEventPlugin(options: { record?: LoginEventWriter } = {}): BetterAuthPlugin {
    const record = options.record ?? ((input: LoginEventInput) => recordLoginEventSafely(input))
    return {
        id: 'login-events',
        hooks: {
            before: [{
                matcher: (ctx: { path?: string }) => ctx.path === '/sign-out',
                handler: createAuthMiddleware(async (ctx) => {
                    /* 登出后 newSession 为空，必须在删除会话前捕获操作人 */
                    try {
                        const session = await getSessionFromCtx(ctx as never) as { user?: { id?: string | null } | null } | null
                        if (session?.user?.id) {
                            (ctx.context as { loginEventActorId?: string | null }).loginEventActorId = session.user.id
                        }
                    } catch {
                        /* 捕获失败不阻断登出；事件以匿名形式记录 */
                    }
                }),
            }],
            after: [{
                matcher: (ctx: { path?: string }) => isTrackedPath(ctx.path),
                handler: createAuthMiddleware(async (ctx) => {
                    try {
                        const input = buildLoginEventRecord(ctx as unknown as LoginEventRequestContext)
                        if (input) {
                            await record(input)
                        }
                    } catch (error) {
                        /* 事件失败绝不阻断认证：这里兜住 hook 内的非预期异常 */
                        logger.warn('Login event plugin failed, skipped', {
                            path: ctx.path,
                            error: error instanceof Error ? error.message : String(error),
                        })
                    }
                }),
            }],
        },
    }
}
