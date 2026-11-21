// @vitest-environment node
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { betterAuth } from 'better-auth'
import { genericOAuth, twoFactor } from 'better-auth/plugins'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { twoFactorCoveragePlugin } from '@/server/utils/two-factor-coverage/plugin'

const TEST_SECRET = 'two-factor-coverage-social-test-secret-0123456789'

function createMemoryDatabase() {
    return {
        user: [] as Record<string, unknown>[],
        session: [] as Record<string, unknown>[],
        account: [] as Record<string, unknown>[],
        verification: [] as Record<string, unknown>[],
        twoFactor: [] as Record<string, unknown>[],
    }
}

function createTestAuth(database: ReturnType<typeof createMemoryDatabase>, captured: { twoFactorCode?: string }) {
    return betterAuth({
        baseURL: 'http://localhost:3000',
        secret: TEST_SECRET,
        database: memoryAdapter(database as never),
        emailAndPassword: { enabled: true },
        account: {
            accountLinking: {
                enabled: true,
                allowDifferentEmails: true,
            },
        },
        plugins: [
            genericOAuth({
                config: [{
                    providerId: 'fixture',
                    clientId: 'fixture-client',
                    clientSecret: 'fixture-secret',
                    authorizationUrl: 'https://idp.example/authorize',
                    tokenUrl: 'https://idp.example/token',
                    userInfoUrl: 'https://idp.example/userinfo',
                    scopes: ['openid', 'email', 'profile'],
                    pkce: false,
                }],
            }),
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
                id: 'fixture-user',
                email: 'fixture@example.com',
                name: 'Fixture User',
                email_verified: true,
            }), { headers: { 'content-type': 'application/json' } })
        }
        throw new Error(`unexpected fetch: ${url}`)
    }))
}

async function startSocialSignIn(client: TestClient): Promise<string> {
    const start = await client.request('/sign-in/social', { body: { provider: 'fixture', callbackURL: '/profile' } })
    expect(start.response.status).toBe(200)
    const url = start.json?.url
    expect(typeof url).toBe('string')
    return url as string
}

describe('two-factor coverage for generic social callback', () => {
    let database: ReturnType<typeof createMemoryDatabase>
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

    it('challenges a 2FA user signing in through the social callback', async () => {
        const firstUrl = await startSocialSignIn(client)
        const firstCallback = await client.request(`/callback/fixture?code=fixture-code&state=${new URL(firstUrl).searchParams.get('state')}`, { method: 'GET' })
        expect(firstCallback.response.status).toBe(302)
        expect(client.hasCookie('session_token')).toBe(true)

        const enable = await client.request('/two-factor/enable', { body: { method: 'otp' } })
        expect(enable.response.status).toBe(200)
        expect(database.user[0]?.twoFactorEnabled).toBe(true)
        await client.request('/sign-out')

        const secondUrl = await startSocialSignIn(client)
        const challenged = await client.request(`/callback/fixture?code=fixture-code&state=${new URL(secondUrl).searchParams.get('state')}`, { method: 'GET' })

        expect(challenged.response.status).toBe(302)
        expect(challenged.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(false)
        expect(client.hasCookie('two_factor')).toBe(true)
        expect(database.session).toHaveLength(0)
        expect(challenged.response.headers.getSetCookie().some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
    })

    it('keeps the social callback unchanged for users without 2FA', async () => {
        const url = await startSocialSignIn(client)
        const callback = await client.request(`/callback/fixture?code=fixture-code&state=${new URL(url).searchParams.get('state')}`, { method: 'GET' })

        expect(callback.response.status).toBe(302)
        expect(callback.response.headers.get('location')).not.toContain('twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(true)
        expect(database.session).toHaveLength(1)
    })
})
