import { getSessionFromCtx } from 'better-auth/api'
import type { TwoFactorCoverageChannelDefinition } from './channels'
import logger from '@/server/utils/logger'

/**
 * 复用 better-auth two-factor 插件的登录挑战步骤（阶段 11）。
 *
 * 上游没有导出 signInPaths 以外的挑战入口；这里通过
 * `ctx.context.getPlugin('two-factor')` 取到插件自身的 after-hook，
 * 以 `{ ...ctx, returnHeaders: true }` 调用，再复制 Set-Cookie。
 *
 * `returnHeaders` 不在 `createAuthMiddleware` 的公开类型中，属非公开契约：
 * M1.2 以契约测试锁定该行为；上游不再支持时退回自建 challenge。
 */
interface TwoFactorPluginHook {
    matcher: (ctx: { path?: string }) => boolean
    handler: (ctx: unknown) => Promise<unknown>
}

interface TwoFactorPluginLike {
    hooks?: {
        after?: TwoFactorPluginHook[]
    }
}

interface TwoFactorSessionUser {
    id?: string
    twoFactorEnabled?: boolean
}

interface TwoFactorSession {
    token?: string
}

interface TwoFactorChallengeContext {
    query?: Record<string, unknown>
    request?: Request
    responseHeaders: Headers
    redirect: (url: string) => unknown
    context: {
        responseHeaders?: Headers
        newSession?: { user?: TwoFactorSessionUser, session?: TwoFactorSession } | null
        getPlugin: (id: string) => TwoFactorPluginLike | null
        authCookies?: {
            sessionToken?: {
                name?: string
                attributes?: Record<string, unknown>
            }
        }
        internalAdapter?: { deleteSession?: (token: string) => Promise<unknown> }
    }
}

export interface TwoFactorChallengeOutcome {
    /** 上游挑战响应体（`twoFactorRedirect` + `twoFactorMethods`） */
    payload: Record<string, unknown>
    channel: TwoFactorCoverageChannelDefinition['id']
    /** 挑战前的用户 ID（上游挑战会把 newSession 置空，必须提前捕获） */
    userId: string | null
}

function buildExpiredCookie(name: string, attributes: Record<string, unknown> | undefined): string {
    const parts = [`${name}=`, 'Max-Age=0']
    const path = typeof attributes?.path === 'string' ? attributes.path : '/'
    parts.push(`Path=${path}`)
    if (typeof attributes?.domain === 'string' && attributes.domain) {
        parts.push(`Domain=${attributes.domain}`)
    }
    if (attributes?.httpOnly !== false) {
        parts.push('HttpOnly')
    }
    if (typeof attributes?.sameSite === 'string' && attributes.sameSite) {
        parts.push(`SameSite=${attributes.sameSite}`)
    }
    if (attributes?.secure === true) {
        parts.push('Secure')
    }
    return parts.join('; ')
}

function scrubSessionCookies(headers: Headers, cookieName: string): void {
    const cookies = headers.getSetCookie()
    if (!cookies.length) {
        return
    }
    headers.delete('set-cookie')
    for (const cookie of cookies) {
        if (cookie.startsWith(`${cookieName}=`) && !/Max-Age=0/iu.test(cookie)) {
            continue
        }
        headers.append('set-cookie', cookie)
    }
}

async function discardSessionAndCookie(
    challengeContext: TwoFactorChallengeContext,
    sessionToken: string | undefined,
    cookie: { name?: string, attributes?: Record<string, unknown> } | undefined,
): Promise<void> {
    if (sessionToken) {
        const deleteSession = challengeContext.context.internalAdapter?.deleteSession
        if (!deleteSession) {
            logger.warn('2FA coverage: internalAdapter.deleteSession is unavailable; orphan session may remain', { sessionToken })
        } else {
            try {
                await deleteSession(sessionToken)
            } catch (error) {
                logger.warn('2FA coverage: failed to delete the challenged session', { error: error instanceof Error ? error.message : String(error) })
            }
        }
    }
    if (cookie?.name) {
        scrubSessionCookies(challengeContext.responseHeaders, cookie.name)
        if (challengeContext.context.responseHeaders && challengeContext.context.responseHeaders !== challengeContext.responseHeaders) {
            scrubSessionCookies(challengeContext.context.responseHeaders, cookie.name)
        }
        challengeContext.responseHeaders.append('set-cookie', buildExpiredCookie(cookie.name, cookie.attributes))
    }
}

function copyResponseHeaders(target: Headers, source: Headers): void {
    source.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            target.append(key, value)
            return
        }
        target.set(key, value)
    })
}

export async function buildTwoFactorChallenge(
    ctx: unknown,
    channel: TwoFactorCoverageChannelDefinition,
): Promise<TwoFactorChallengeOutcome | null> {
    const challengeContext = ctx as TwoFactorChallengeContext
    const newSessionUser = challengeContext.context.newSession?.user
    if (!newSessionUser?.twoFactorEnabled) {
        return null
    }
    const sessionToken = challengeContext.context.newSession?.session?.token
    const sessionCookie = challengeContext.context.authCookies?.sessionToken

    if (channel.skipWhenSessionMatches) {
        const existingSession = await getSessionFromCtx(challengeContext as Parameters<typeof getSessionFromCtx>[0])
        if (existingSession?.user?.id && existingSession.user.id === newSessionUser.id) {
            return null
        }
    }

    const plugin = challengeContext.context.getPlugin('two-factor')
    const step = plugin?.hooks?.after?.find((hook) => hook.matcher({ path: '/sign-in/email' }))
    if (!step) {
        await discardSessionAndCookie(challengeContext, sessionToken, sessionCookie)
        throw new Error('two-factor plugin sign-in hook is unavailable')
    }

    let result: { headers?: Headers, response?: unknown } | undefined
    try {
        result = await step.handler({ ...(ctx as object), returnHeaders: true }) as {
            headers?: Headers
            response?: unknown
        } | undefined
    } catch (error) {
        await discardSessionAndCookie(challengeContext, sessionToken, sessionCookie)
        throw error
    }

    if (result?.headers) {
        copyResponseHeaders(challengeContext.responseHeaders, result.headers)
    }

    if (!result?.response || typeof result.response !== 'object') {
        return null
    }

    const payload = result.response as Record<string, unknown>
    if (payload.twoFactorRedirect !== true) {
        return null
    }

    return { payload, channel: channel.id, userId: newSessionUser.id ?? null }
}
