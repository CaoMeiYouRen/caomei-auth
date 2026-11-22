import { createHmac } from 'node:crypto'
import { expect } from 'vitest'
import { betterAuth, type BetterAuthPlugin } from 'better-auth'
import { emailOTP, magicLink, phoneNumber, twoFactor } from 'better-auth/plugins'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { twoFactorCoveragePlugin } from '@/server/utils/two-factor-coverage/plugin'

export interface CapturedCodes {
    emailCode?: string
    emailVerificationCode?: string
    magicLinkUrl?: string
    verificationUrl?: string
    phoneCode?: string
    twoFactorCode?: string
}

export const TEST_SECRET = 'two-factor-coverage-test-secret-0123456789'

export function createMemoryDatabase() {
    return {
        user: [] as Record<string, unknown>[],
        session: [] as Record<string, unknown>[],
        account: [] as Record<string, unknown>[],
        verification: [] as Record<string, unknown>[],
        twoFactor: [] as Record<string, unknown>[],
    }
}

export function createTestAuth(
    captured: CapturedCodes,
    database: ReturnType<typeof createMemoryDatabase>,
    options: { rateLimit?: boolean, magicLinkExpiresIn?: number, trustDeviceMaxAge?: number, extraPlugins?: BetterAuthPlugin[] } = {},
) {
    return betterAuth({
        baseURL: 'http://localhost:3000',
        secret: TEST_SECRET,
        database: memoryAdapter(database as never),
        emailAndPassword: { enabled: true },
        ...options.rateLimit
            ? {
                rateLimit: {
                    enabled: true,
                    window: 60,
                    max: 60,
                    customRules: {
                        '/two-factor/*': { window: 60, max: 3 },
                    },
                },
            }
            : {},
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ url }) => {
                captured.verificationUrl = url
            },
        },
        plugins: [
            emailOTP({
                async sendVerificationOTP({ otp, type }) {
                    if (type === 'email-verification') {
                        captured.emailVerificationCode = otp
                        return
                    }
                    captured.emailCode = otp
                },
            }),
            magicLink({
                expiresIn: options.magicLinkExpiresIn,
                async sendMagicLink({ url }) {
                    captured.magicLinkUrl = url
                },
            }),
            phoneNumber({
                async sendOTP({ code }) {
                    captured.phoneCode = code
                },
                signUpOnVerification: {
                    getTempEmail: () => `temp-${Date.now()}@example.com`,
                    getTempName: () => 'Temp User',
                },
            }),
            twoFactor({
                issuer: 'caomei-auth-test',
                skipVerificationOnEnable: true,
                trustDeviceMaxAge: options.trustDeviceMaxAge,
                otpOptions: {
                    async sendOTP({ otp }) {
                        captured.twoFactorCode = otp
                    },
                },
            }),
            twoFactorCoveragePlugin(),
            ...(options.extraPlugins ?? []),
        ],
    })
}

export class TestClient {
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

    async get(path: string) {
        return this.request(path, { method: 'GET' })
    }

    hasCookie(namePart: string): boolean {
        return [...this.cookies.keys()].some((name) => name.includes(namePart))
    }

    clearCookies(namePart: string): void {
        for (const name of [...this.cookies.keys()]) {
            if (name.includes(namePart)) {
                this.cookies.delete(name)
            }
        }
    }
}

function decodeBase32(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let bits = 0
    let value = 0
    const bytes: number[] = []
    for (const character of input.replace(/[=]+$/u, '').toUpperCase()) {
        const index = alphabet.indexOf(character)
        if (index < 0) {
            continue
        }
        value = (value << 5) | index
        bits += 5
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xFF)
            bits -= 8
        }
    }
    return Buffer.from(bytes)
}

export function generateTotp(secret: string): string {
    const counter = Math.floor(Date.now() / 1000 / 30)
    const counterBuffer = Buffer.alloc(8)
    counterBuffer.writeBigUInt64BE(BigInt(counter))
    const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest()
    const offset = digest[digest.length - 1]! & 0x0F
    const code = ((digest.readUInt32BE(offset) & 0x7FFFFFFF) % 1_000_000).toString().padStart(6, '0')
    return code
}

export function pathFromUrl(url: string): string {
    const parsed = new URL(url)
    return `${parsed.pathname.replace(/^\/api\/auth/u, '')}${parsed.search}`
}

export async function setupTwoFactorUser(client: TestClient, database: ReturnType<typeof createMemoryDatabase>, email = 'twofa@example.com') {
    await client.request('/sign-up/email', { body: { email, password: 'passw0rd123', name: 'Two Factor' } })
    const enable = await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
    expect(enable.response.status).toBe(200)
    expect(database.user[0]?.twoFactorEnabled).toBe(true)
    await client.request('/sign-out')
    expect(database.session).toHaveLength(0)
}

export async function setupTwoFactorUserWithPhone(client: TestClient, database: ReturnType<typeof createMemoryDatabase>, captured: CapturedCodes, phone = '+8613800138000') {
    await client.request('/sign-up/email', { body: { email: 'phone-twofa@example.com', password: 'passw0rd123', name: 'Phone Two Factor' } })
    await client.request('/phone-number/send-otp', { body: { phoneNumber: phone } })
    const bind = await client.request('/phone-number/verify', { body: { phoneNumber: phone, code: captured.phoneCode, updatePhoneNumber: true } })
    expect(bind.response.status).toBe(200)
    const enable = await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
    expect(enable.response.status).toBe(200)
    await client.request('/sign-out')
}

