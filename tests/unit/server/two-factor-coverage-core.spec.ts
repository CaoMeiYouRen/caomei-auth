// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryDatabase, createTestAuth, setupTwoFactorUser, type CapturedCodes, TestClient } from './helpers/two-factor-coverage'
import { twoFactorCoveragePlugin } from '@/server/utils/two-factor-coverage/plugin'
import loggerMock from '@/tests/mocks/logger'
import { buildChallengeRedirect, findTwoFactorCoverageChannel, resolveSafeRedirect, TWO_FACTOR_COVERAGE_CHANNELS } from '@/server/utils/two-factor-coverage/channels'
import { buildTwoFactorChallenge } from '@/server/utils/two-factor-coverage/challenge'
import { TWO_FACTOR_COVERAGE_CHANNEL_IDS } from '@/utils/shared/two-factor-coverage-channels'
import { TWO_FACTOR_COVERAGE } from '@/utils/shared/env'

describe('two-factor coverage integration', () => {
    let captured: CapturedCodes
    let database: ReturnType<typeof createMemoryDatabase>
    let client: TestClient

    beforeEach(() => {
        captured = {}
        database = createMemoryDatabase()
        client = new TestClient(createTestAuth(captured, database))
    })

    it('challenges email OTP sign-in and keeps the session deleted', async () => {
        await setupTwoFactorUser(client, database)

        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        const signIn = await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })

        expect(signIn.response.status).toBe(200)
        expect(signIn.json).toMatchObject({ twoFactorRedirect: true, channel: 'email-otp' })
        expect(client.hasCookie('session_token')).toBe(false)
        expect(client.hasCookie('two_factor')).toBe(true)
        expect(database.session).toHaveLength(0)
        const rawCookies = signIn.response.headers.getSetCookie()
        expect(rawCookies.some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
        expect(loggerMock.audit.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'twoFactor.challenge',
            actorId: database.user[0]?.id,
            after: { channel: 'email-otp' },
        }))

        await client.request('/two-factor/send-otp')
        const verified = await client.request('/two-factor/verify-otp', { body: { code: captured.twoFactorCode, trustDevice: true } })
        expect(verified.response.status).toBe(200)
        expect(client.hasCookie('session_token')).toBe(true)
        expect(client.hasCookie('trust_device')).toBe(true)
        expect(database.session).toHaveLength(1)
    })

    it('honours the trusted device cookie on the next email OTP sign-in', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })
        await client.request('/two-factor/send-otp')
        await client.request('/two-factor/verify-otp', { body: { code: captured.twoFactorCode, trustDevice: true } })
        await client.request('/sign-out')

        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        const trustedSignIn = await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })

        expect(trustedSignIn.json).not.toMatchObject({ twoFactorRedirect: true })
        expect(client.hasCookie('session_token')).toBe(true)
        expect(client.hasCookie('trust_device')).toBe(true)
        expect(database.session).toHaveLength(1)
        expect(loggerMock.audit.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'twoFactor.verify',
            after: { factor: 'otp', trustDevice: true },
            result: 'success',
        }))

        // 负向控制：清掉信任设备 cookie 后必须重新挑战
        await client.request('/sign-out')
        client.clearCookies('trust_device')
        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        const challengedAgain = await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })
        expect(challengedAgain.json).toMatchObject({ twoFactorRedirect: true })
        expect(database.session).toHaveLength(0)
    })

    it('leaves email OTP sign-in unchanged when the channel switch is off', async () => {
        await setupTwoFactorUser(client, database)
        const previous = TWO_FACTOR_COVERAGE.emailOtp
        TWO_FACTOR_COVERAGE.emailOtp = false
        try {
            await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
            const signIn = await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })
            expect(signIn.json).not.toMatchObject({ twoFactorRedirect: true })
            expect(client.hasCookie('session_token')).toBe(true)
        } finally {
            TWO_FACTOR_COVERAGE.emailOtp = previous
        }
    })

})

describe('two-factor challenge adapter failure handling', () => {
    function createChallengeContext(plugin: unknown) {
        const deleteSession = vi.fn(async () => undefined)
        const responseHeaders = new Headers()
        responseHeaders.append('set-cookie', 'better-auth.session_token=valid-session; Max-Age=3600; Path=/')
        const outerResponseHeaders = new Headers()
        outerResponseHeaders.append('set-cookie', 'better-auth.session_token=outer-valid-session; Max-Age=3600; Path=/')
        const context = {
            responseHeaders,
            context: {
                responseHeaders: outerResponseHeaders,
                newSession: {
                    user: { id: 'user-1', twoFactorEnabled: true },
                    session: { token: 'session-token-1' },
                },
                getPlugin: () => plugin,
                authCookies: {
                    sessionToken: {
                        name: 'better-auth.session_token',
                        attributes: { path: '/', secure: true, sameSite: 'lax', httpOnly: true, domain: 'auth.example' },
                    },
                },
                internalAdapter: { deleteSession },
            },
        }
        return { context, deleteSession }
    }

    it('discards the created session when the upstream hook is unavailable', async () => {
        const { context, deleteSession } = createChallengeContext(null)
        const channel = findTwoFactorCoverageChannel('/sign-in/email-otp')!

        await expect(buildTwoFactorChallenge(context, channel)).rejects.toThrow('unavailable')
        expect(deleteSession).toHaveBeenCalledWith('session-token-1')
        const cookies = context.responseHeaders.getSetCookie()
        expect(cookies.some((cookie) => /session_token=/u.test(cookie) && /Max-Age=0/iu.test(cookie))).toBe(true)
        expect(cookies.some((cookie) => /session_token=valid-session/u.test(cookie))).toBe(false)
        expect(cookies.find((cookie) => /session_token=/u.test(cookie) && /Max-Age=0/iu.test(cookie))).toContain('Secure')
        expect(cookies.find((cookie) => /session_token=/u.test(cookie) && /Max-Age=0/iu.test(cookie))).toContain('Domain=auth.example')
        expect(context.context.responseHeaders.getSetCookie().some((cookie) => /outer-valid-session/u.test(cookie))).toBe(false)
    })

    it('discards the created session when the upstream hook throws', async () => {
        const { context, deleteSession } = createChallengeContext({
            hooks: {
                after: [{
                    matcher: () => true,
                    handler: async () => {
                        throw new Error('upstream failure')
                    },
                }],
            },
        })
        const channel = findTwoFactorCoverageChannel('/sign-in/email-otp')!

        await expect(buildTwoFactorChallenge(context, channel)).rejects.toThrow('upstream failure')
        expect(deleteSession).toHaveBeenCalledWith('session-token-1')
        const cookies = context.responseHeaders.getSetCookie()
        expect(cookies.some((cookie) => /session_token=/u.test(cookie) && /Max-Age=0/iu.test(cookie))).toBe(true)
        expect(context.context.responseHeaders.getSetCookie().some((cookie) => /outer-valid-session/u.test(cookie))).toBe(false)
    })

    it('logs a warning when the session adapter is unavailable', async () => {
        const context = {
            responseHeaders: new Headers(),
            context: {
                newSession: {
                    user: { id: 'user-1', twoFactorEnabled: true },
                    session: { token: 'session-token-1' },
                },
                getPlugin: () => null,
                authCookies: { sessionToken: { name: 'better-auth.session_token' } },
                internalAdapter: {},
            },
        }
        const channel = findTwoFactorCoverageChannel('/sign-in/email-otp')!

        await expect(buildTwoFactorChallenge(context, channel)).rejects.toThrow('unavailable')
        expect(loggerMock.warn).toHaveBeenCalled()
    })
})


describe('two-factor coverage handler contract for callback-only channels', () => {
    function createHookContext(path: string) {
        return {
            path,
            returnHeaders: true,
            query: {},
            request: new Request(`http://localhost:3000/api/auth${path}`),
            responseHeaders: new Headers(),
            context: {
                newSession: {
                    user: { id: 'user-callback-1', twoFactorEnabled: true },
                    session: { token: 'callback-session-token' },
                },
                getPlugin: () => ({
                    hooks: {
                        after: [{
                            matcher: () => true,
                            handler: async () => ({
                                headers: new Headers({ 'set-cookie': 'better-auth.two_factor=challenge-cookie' }),
                                response: { twoFactorRedirect: true, twoFactorMethods: ['otp'] },
                            }),
                        }],
                    },
                }),
                authCookies: { sessionToken: { name: 'better-auth.session_token' } },
                internalAdapter: { deleteSession: vi.fn(async () => undefined) },
            },
            redirect: (url: string) => {
                throw new Error(`redirect:${url}`)
            },
        }
    }

    function findHook(path: string) {
        const plugin = twoFactorCoveragePlugin()
        const hooks = (plugin.hooks as { after: Array<{ matcher: (ctx: { path?: string }) => boolean, handler: (ctx: unknown) => Promise<unknown> }> }).after
        return hooks.find((hook) => hook.matcher({ path }))!
    }

    it('redirects the SAML ACS path to the login challenge with copied cookies', async () => {
        const context = createHookContext('/sso/saml2/sp/acs/fixture')
        const hook = findHook('/sso/saml2/sp/acs/fixture')

        const error = await hook.handler(context).catch((caught) => caught) as { status?: string, headers?: Headers }
        expect(error.status).toBe('FOUND')
        expect(error.headers?.get('location')).toContain('/login?twoFactor=1')
        expect(error.headers?.get('location')).toContain('channel=sso-saml')
        expect(error.headers?.getSetCookie()).toContain('better-auth.two_factor=challenge-cookie')
    })

    it('returns twoFactorRedirect for the social idToken path', async () => {
        const context = createHookContext('/sign-in/social')
        const hook = findHook('/sign-in/social')

        const result = await hook.handler(context) as { headers: Headers, response: Record<string, unknown> }
        expect(result.response).toMatchObject({
            twoFactorRedirect: true,
            channel: 'social-id-token',
        })
        expect(result.headers.getSetCookie()).toContain('better-auth.two_factor=challenge-cookie')
    })
})


describe('two-factor coverage channel definitions', () => {
    it('matches every user sign-in channel and ignores unrelated paths', () => {
        expect(findTwoFactorCoverageChannel('/sign-in/email-otp')?.id).toBe('email-otp')
        expect(findTwoFactorCoverageChannel('/phone-number/verify')?.id).toBe('phone-otp')
        expect(findTwoFactorCoverageChannel('/email-otp/verify-email')?.id).toBe('email-otp-verification')
        expect(findTwoFactorCoverageChannel('/verify-email')?.id).toBe('email-link-verification')
        expect(findTwoFactorCoverageChannel('/magic-link/verify')?.id).toBe('magic-link')
        expect(findTwoFactorCoverageChannel('/callback/github')?.id).toBe('social-callback')
        expect(findTwoFactorCoverageChannel('/sign-in/social')?.id).toBe('social-id-token')
        expect(findTwoFactorCoverageChannel('/sso/callback/fixture')?.id).toBe('sso-oidc')
        expect(findTwoFactorCoverageChannel('/sso/callback')?.id).toBe('sso-oidc-shared')
        expect(findTwoFactorCoverageChannel('/sso/saml2/sp/acs/fixture')?.id).toBe('sso-saml')
        expect(findTwoFactorCoverageChannel('/sign-in/email')).toBeUndefined()
        expect(findTwoFactorCoverageChannel('/sign-in/anonymous')).toBeUndefined()
        expect(findTwoFactorCoverageChannel('/admin/impersonate-user')).toBeUndefined()
    })

    it('keeps the server channel list and the shared id whitelist in sync', () => {
        expect(TWO_FACTOR_COVERAGE_CHANNELS.map((channel) => channel.id).sort()).toEqual([...TWO_FACTOR_COVERAGE_CHANNEL_IDS].sort())
    })

    it('only accepts same-site redirect targets', () => {
        expect(resolveSafeRedirect('/profile')).toBe('/profile')
        expect(resolveSafeRedirect('//evil.example')).toBe('/')
        expect(resolveSafeRedirect('/\\evil.example')).toBe('/')
        expect(resolveSafeRedirect('https://evil.example')).toBe('/')
        expect(resolveSafeRedirect(undefined)).toBe('/')
        expect(buildChallengeRedirect('magic-link', '/profile?tab=security')).toBe('/login?twoFactor=1&channel=magic-link&redirect=%2Fprofile%3Ftab%3Dsecurity')
        expect(buildChallengeRedirect('sso-saml', 'https://evil.example')).toBe('/login?twoFactor=1&channel=sso-saml&redirect=%2F')
    })
})
