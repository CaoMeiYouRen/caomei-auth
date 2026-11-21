// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryDatabase, createTestAuth, type CapturedCodes, generateTotp, pathFromUrl, setupTwoFactorUser, TestClient } from './helpers/two-factor-coverage'
import loggerMock from '@/tests/mocks/logger'

describe('two-factor coverage factors and abuse controls', () => {
    let captured: CapturedCodes
    let database: ReturnType<typeof createMemoryDatabase>
    let client: TestClient

    beforeEach(() => {
        captured = {}
        database = createMemoryDatabase()
        client = new TestClient(createTestAuth(captured, database))
    })

    it('allows a backup code to complete the challenge', async () => {
        await client.request('/sign-up/email', { body: { email: 'backup-code@example.com', password: 'passw0rd123', name: 'Backup Code' } })
        const enable = await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'totp' } })
        expect(enable.response.status).toBe(200)
        const backupCodes = enable.json?.backupCodes
        expect(Array.isArray(backupCodes)).toBe(true)
        await client.request('/sign-out')

        await client.request('/email-otp/send-verification-otp', { body: { email: 'backup-code@example.com', type: 'sign-in' } })
        const challenged = await client.request('/sign-in/email-otp', { body: { email: 'backup-code@example.com', otp: captured.emailCode } })
        expect(challenged.json).toMatchObject({ twoFactorRedirect: true })

        const verified = await client.request('/two-factor/verify-backup-code', { body: { code: (backupCodes as string[])[0] } })
        expect(verified.response.status).toBe(200)
        expect(database.session).toHaveLength(1)
    })

    it('rejects reuse of a consumed magic link', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/sign-in/magic-link', { body: { email: 'twofa@example.com' } })
        const verifyPath = pathFromUrl(captured.magicLinkUrl!)
        const first = await client.get(verifyPath)
        expect(first.response.status).toBe(302)
        expect(first.response.headers.get('location')).toContain('/login?twoFactor=1')

        client.clearCookies('two_factor')
        const replay = await client.get(verifyPath)
        expect(database.session).toHaveLength(0)
        expect(client.hasCookie('session_token')).toBe(false)
        expect(client.hasCookie('two_factor')).toBe(false)
        expect(replay.response.headers.get('location') ?? '').not.toContain('twoFactor=1')
    })

    it('rejects an expired magic link', async () => {
        const expiredDatabase = createMemoryDatabase()
        const expiredCaptured: CapturedCodes = {}
        const expiredClient = new TestClient(createTestAuth(expiredCaptured, expiredDatabase, { magicLinkExpiresIn: 2 }))
        await expiredClient.request('/sign-up/email', { body: { email: 'expired-link@example.com', password: 'passw0rd123', name: 'Expired Link' } })
        await expiredClient.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        await expiredClient.request('/sign-out')
        await expiredClient.request('/sign-in/magic-link', { body: { email: 'expired-link@example.com' } })
        await new Promise((resolve) => setTimeout(resolve, 2200))

        const expired = await expiredClient.get(pathFromUrl(expiredCaptured.magicLinkUrl!))
        expect(expiredDatabase.session).toHaveLength(0)
        expect(expiredClient.hasCookie('session_token')).toBe(false)
        expect(expiredClient.hasCookie('two_factor')).toBe(false)
        expect(expired.response.headers.get('location') ?? '').not.toContain('twoFactor=1')
    })

    it('allows TOTP to complete the challenge', async () => {
        await client.request('/sign-up/email', { body: { email: 'totp@example.com', password: 'passw0rd123', name: 'TOTP' } })
        const enable = await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'totp' } })
        expect(enable.response.status).toBe(200)
        const totpUri = enable.json?.totpURI
        expect(typeof totpUri).toBe('string')
        const secret = new URL(totpUri as string).searchParams.get('secret')
        expect(secret).toBeTruthy()
        await client.request('/sign-out')

        await client.request('/email-otp/send-verification-otp', { body: { email: 'totp@example.com', type: 'sign-in' } })
        const challenged = await client.request('/sign-in/email-otp', { body: { email: 'totp@example.com', otp: captured.emailCode } })
        expect(challenged.json).toMatchObject({ twoFactorRedirect: true })

        const verified = await client.request('/two-factor/verify-totp', { body: { code: generateTotp(secret!) } })
        expect(verified.response.status).toBe(200)
        expect(database.session).toHaveLength(1)
    })

    it('enforces the two-factor verification rate limit', async () => {
        const rateLimitedDatabase = createMemoryDatabase()
        const rateLimitedCaptured: CapturedCodes = {}
        const rateLimitedClient = new TestClient(createTestAuth(rateLimitedCaptured, rateLimitedDatabase, { rateLimit: true }))
        await rateLimitedClient.request('/sign-up/email', { body: { email: 'rate-limit@example.com', password: 'passw0rd123', name: 'Rate Limit' } })
        rateLimitedDatabase.user[0]!.twoFactorEnabled = true
        await rateLimitedClient.request('/sign-out')
        await rateLimitedClient.request('/email-otp/send-verification-otp', { body: { email: 'rate-limit@example.com', type: 'sign-in' } })
        await rateLimitedClient.request('/sign-in/email-otp', { body: { email: 'rate-limit@example.com', otp: rateLimitedCaptured.emailCode } })

        for (let attempt = 0; attempt < 3; attempt++) {
            const response = await rateLimitedClient.request('/two-factor/verify-totp', { body: { code: '000000' } })
            expect(response.response.status).not.toBe(429)
        }
        const limited = await rateLimitedClient.request('/two-factor/verify-totp', { body: { code: '000000' } })
        expect(limited.response.status).toBe(429)
    })

    it('records failed factor verification in the audit channel', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })

        await client.request('/two-factor/verify-otp', { body: { code: '999999', trustDevice: true } })
        expect(loggerMock.audit.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'twoFactor.verify',
            after: { factor: 'otp' },
            result: 'failure',
        }))
    })

    it('re-challenges after the trusted device expires', async () => {
        const expiringDatabase = createMemoryDatabase()
        const expiringCaptured: CapturedCodes = {}
        const expiringClient = new TestClient(createTestAuth(expiringCaptured, expiringDatabase, { trustDeviceMaxAge: 2 }))
        await setupTwoFactorUser(expiringClient, expiringDatabase)
        await expiringClient.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        await expiringClient.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: expiringCaptured.emailCode } })
        await expiringClient.request('/two-factor/send-otp')
        await expiringClient.request('/two-factor/verify-otp', { body: { code: expiringCaptured.twoFactorCode, trustDevice: true } })
        await expiringClient.request('/sign-out')
        await new Promise((resolve) => setTimeout(resolve, 2200))

        await expiringClient.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        const challenged = await expiringClient.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: expiringCaptured.emailCode } })
        expect(challenged.json).toMatchObject({ twoFactorRedirect: true })
        expect(expiringDatabase.session).toHaveLength(0)
    })

    it('rejects verification when the challenge record was revoked', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'sign-in' } })
        await client.request('/sign-in/email-otp', { body: { email: 'twofa@example.com', otp: captured.emailCode } })

        database.verification = database.verification.filter((row) => !String(row.identifier).startsWith('2fa-'))
        const verified = await client.request('/two-factor/verify-otp', { body: { code: captured.twoFactorCode } })
        expect([400, 401]).toContain(verified.response.status)
        expect(database.session).toHaveLength(0)
    })
})
