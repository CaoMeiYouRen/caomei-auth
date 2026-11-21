// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { betterAuth } from 'better-auth'
import { twoFactor } from 'better-auth/plugins'
import { sso } from '@better-auth/sso'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { twoFactorCoveragePlugin } from '@/server/utils/two-factor-coverage/plugin'

const TEST_SECRET = 'two-factor-coverage-sso-test-secret-0123456789'

interface SsoDatabase {
    user: Record<string, unknown>[]
    session: Record<string, unknown>[]
    account: Record<string, unknown>[]
    verification: Record<string, unknown>[]
    twoFactor: Record<string, unknown>[]
    ssoProvider: Record<string, unknown>[]
}

function createMemoryDatabase(): SsoDatabase {
    return {
        user: [],
        session: [],
        account: [],
        verification: [],
        twoFactor: [],
        ssoProvider: [{
            id: 'sso-fixture-1',
            issuer: 'https://idp.example',
            domain: 'example.com',
            providerId: 'fixture',
            userId: 'sso-owner',
            name: 'Fixture SSO',
            enabled: true,
            type: 'oidc',
            oidcConfig: JSON.stringify({
                issuer: 'https://idp.example',
                clientId: 'fixture-client',
                clientSecret: 'fixture-secret',
                authorizationEndpoint: 'https://idp.example/authorize',
                tokenEndpoint: 'https://idp.example/token',
                userInfoEndpoint: 'https://idp.example/userinfo',
                jwksEndpoint: 'https://idp.example/jwks',
                pkce: false,
                scopes: ['openid', 'email', 'profile'],
            }),
        }],
    }
}

function createTestAuth(database: SsoDatabase, captured: { twoFactorCode?: string }) {
    return betterAuth({
        baseURL: 'http://localhost:3000',
        secret: TEST_SECRET,
        database: memoryAdapter(database as never),
        emailAndPassword: { enabled: true },
        plugins: [
            sso({ trustEmailVerified: true }),
            twoFactor({
                allowPasswordless: true,
                otpOptions: {
                    async sendOTP({ otp }) {
                        captured.twoFactorCode = otp
                    },
                },
            }),
            twoFactorCoveragePlugin(),
        ],
    })
}

class TestClient {
    private readonly cookies = new Map<string, string>()

    constructor(private readonly auth: ReturnType<typeof createTestAuth>) {}

    private cookieHeader(): string {
        return [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ')
    }

    private storeCookies(response: Response): void {
        for (const raw of response.headers.getSetCookie()) {
            const [pair, ...attributes] = raw.split(';')
            const index = pair?.indexOf('=') ?? -1
            if (!pair || index <= 0) {
                continue
            }
            const name = pair.slice(0, index).trim()
            const value = pair.slice(index + 1)
            if (attributes.some((attribute) => /^\s*max-age=0\s*$/iu.test(attribute))) {
                this.cookies.delete(name)
            } else {
                this.cookies.set(name, value)
            }
        }
    }

    async request(path: string, options: { method?: 'GET' | 'POST', body?: Record<string, unknown> } = {}) {
        const method = options.method ?? 'POST'
        const response = await this.auth.handler(new Request(`http://localhost:3000/api/auth${path}`, {
            method,
            headers: {
                'content-type': 'application/json',
                origin: 'http://localhost:3000',
                cookie: this.cookieHeader(),
            },
            body: method === 'GET' ? undefined : JSON.stringify(options.body ?? {}),
        }))
        this.storeCookies(response)
        const text = await response.text()
        let json: Record<string, unknown> | null = null
        try {
            json = text ? JSON.parse(text) as Record<string, unknown> : null
        } catch {
            json = null
        }
        return { response, json, text }
    }

    hasCookie(namePart: string): boolean {
        return [...this.cookies.keys()].some((name) => name.includes(namePart))
    }
}

function mockIdpFetch() {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        let url: string
        if (typeof input === 'string') {
            url = input
        } else if (input instanceof URL) {
            url = input.toString()
        } else {
            url = input.url
        }
        if (url.startsWith('https://idp.example/token')) {
            return new Response(JSON.stringify({
                access_token: 'fixture-access-token',
                token_type: 'Bearer',
                expires_in: 3600,
            }), { headers: { 'content-type': 'application/json' } })
        }
        if (url.startsWith('https://idp.example/userinfo')) {
            return new Response(JSON.stringify({
                sub: 'sso-fixture-user',
                email: 'sso-fixture@example.com',
                name: 'SSO Fixture',
                email_verified: true,
            }), { headers: { 'content-type': 'application/json' } })
        }
        if (url.startsWith('https://idp.example/jwks')) {
            return new Response(JSON.stringify({ keys: [] }), { headers: { 'content-type': 'application/json' } })
        }
        throw new Error(`unexpected fetch: ${url}`)
    }))
}

async function startSsoSignIn(client: TestClient): Promise<URL> {
    const start = await client.request('/sign-in/sso', { body: { providerId: 'fixture', callbackURL: '/profile' } })
    expect(start.response.status).toBe(200)
    const url = start.json?.url
    expect(typeof url).toBe('string')
    return new URL(url as string)
}

describe('two-factor coverage for SSO OIDC callbacks', () => {
    let database: SsoDatabase
    let captured: { twoFactorCode?: string }
    let client: TestClient

    beforeEach(() => {
        database = createMemoryDatabase()
        captured = {}
        client = new TestClient(createTestAuth(database, captured))
        mockIdpFetch()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('challenges a 2FA user on the provider-specific OIDC callback', async () => {
        const first = await startSsoSignIn(client)
        const firstCallback = await client.request(`/sso/callback/fixture?code=fixture-code&state=${first.searchParams.get('state')}`, { method: 'GET' })
        expect(firstCallback.response.status).toBe(302)
        expect(client.hasCookie('session_token')).toBe(true)

        const enable = await client.request('/two-factor/enable', { body: { method: 'otp' } })
        expect(enable.response.status).toBe(200)
        await client.request('/sign-out')

        const second = await startSsoSignIn(client)
        const challenged = await client.request(`/sso/callback/fixture?code=fixture-code&state=${second.searchParams.get('state')}`, { method: 'GET' })

        expect(challenged.response.status).toBe(302)
        expect(challenged.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(false)
        expect(client.hasCookie('two_factor')).toBe(true)
        expect(database.session).toHaveLength(0)
        expect(challenged.response.headers.getSetCookie().some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
    })

    it('challenges a 2FA user on the shared OIDC callback', async () => {
        const first = await startSsoSignIn(client)
        await client.request(`/sso/callback?code=fixture-code&state=${first.searchParams.get('state')}`, { method: 'GET' })
        expect(client.hasCookie('session_token')).toBe(true)
        await client.request('/two-factor/enable', { body: { method: 'otp' } })
        await client.request('/sign-out')

        const second = await startSsoSignIn(client)
        const challenged = await client.request(`/sso/callback?code=fixture-code&state=${second.searchParams.get('state')}`, { method: 'GET' })

        expect(challenged.response.status).toBe(302)
        expect(challenged.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(false)
        expect(database.session).toHaveLength(0)
        expect(challenged.response.headers.getSetCookie().some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
    })
})
