// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryDatabase, createTestAuth, type CapturedCodes, pathFromUrl, setupTwoFactorUser, setupTwoFactorUserWithPhone, TestClient } from './helpers/two-factor-coverage'
import { TWO_FACTOR_COVERAGE } from '@/utils/shared/env'

describe('two-factor coverage for email / phone channels', () => {
    let captured: CapturedCodes
    let database: ReturnType<typeof createMemoryDatabase>
    let client: TestClient

    beforeEach(() => {
        captured = {}
        database = createMemoryDatabase()
        client = new TestClient(createTestAuth(captured, database))
    })

    it('redirects magic link verification to the login challenge', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/sign-in/magic-link', { body: { email: 'twofa@example.com' } })
        expect(captured.magicLinkUrl).toBeTruthy()

        const verify = await client.get(pathFromUrl(captured.magicLinkUrl!))
        expect(verify.response.status).toBe(302)
        expect(verify.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(false)
        expect(client.hasCookie('two_factor')).toBe(true)
        expect(database.session).toHaveLength(0)
        expect(verify.response.headers.getSetCookie().some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
    })

    it('redirects email verification link to the login challenge', async () => {
        const email = 'verify-link@example.com'
        await client.request('/sign-up/email', { body: { email, password: 'passw0rd123', name: 'Verify Link' } })
        expect(captured.verificationUrl).toBeTruthy()
        await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        await client.request('/sign-out')

        const verify = await client.get(pathFromUrl(captured.verificationUrl!))
        expect(verify.response.status).toBe(302)
        expect(verify.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(false)
        expect(database.session).toHaveLength(0)
        expect(verify.response.headers.getSetCookie().some((cookie) => /session_token=/u.test(cookie) && !/Max-Age=0/iu.test(cookie))).toBe(false)
    })

    it('challenges email OTP email verification', async () => {
        await setupTwoFactorUser(client, database)
        await client.request('/email-otp/send-verification-otp', { body: { email: 'twofa@example.com', type: 'email-verification' } })
        const verify = await client.request('/email-otp/verify-email', { body: { email: 'twofa@example.com', otp: captured.emailVerificationCode } })

        expect(verify.json).toMatchObject({ twoFactorRedirect: true, channel: 'email-otp-verification' })
        expect(client.hasCookie('session_token')).toBe(false)
        expect(database.session).toHaveLength(0)
    })

    it('skips the challenge when the same user verifies their own email with a live session', async () => {
        const email = 'same-user-verify@example.com'
        await client.request('/sign-up/email', { body: { email, password: 'passw0rd123', name: 'Same User' } })
        expect(captured.verificationUrl).toBeTruthy()
        await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        const session = await client.get('/get-session')
        expect(session.json).toMatchObject({ user: { email } })

        const verify = await client.get(pathFromUrl(captured.verificationUrl!))
        expect(verify.response.status).toBe(302)
        expect(verify.response.headers.get('location')).not.toContain('twoFactor=1')
        expect(client.hasCookie('session_token')).toBe(true)
        expect(client.hasCookie('two_factor')).toBe(false)
    })

    it('challenges when another user session opens a 2FA user verification link', async () => {
        await client.request('/sign-up/email', { body: { email: 'owner-session@example.com', password: 'passw0rd123', name: 'Owner' } })
        expect(client.hasCookie('session_token')).toBe(true)

        const secondCaptured: CapturedCodes = {}
        const secondClient = new TestClient(createTestAuth(secondCaptured, database))
        await secondClient.request('/sign-up/email', { body: { email: 'target-verify@example.com', password: 'passw0rd123', name: 'Target' } })
        expect(secondCaptured.verificationUrl).toBeTruthy()
        await secondClient.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        await secondClient.request('/sign-out')

        const verify = await client.get(pathFromUrl(secondCaptured.verificationUrl!))
        expect(verify.response.status).toBe(302)
        expect(verify.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(client.hasCookie('two_factor')).toBe(true)
        expect(database.session).toHaveLength(1)
    })

    it('does not challenge a logged-in 2FA user when binding a new phone', async () => {
        const email = 'phone-bind@example.com'
        await client.request('/sign-up/email', { body: { email, password: 'passw0rd123', name: 'Phone Bind' } })
        await client.request('/phone-number/send-otp', { body: { phoneNumber: '+8613900139000' } })
        const bind = await client.request('/phone-number/verify', { body: { phoneNumber: '+8613900139000', code: captured.phoneCode, updatePhoneNumber: true } })
        expect(bind.response.status).toBe(200)
        const enable = await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        expect(enable.response.status).toBe(200)

        await client.request('/phone-number/send-otp', { body: { phoneNumber: '+8613900139001' } })
        const update = await client.request('/phone-number/verify', { body: { phoneNumber: '+8613900139001', code: captured.phoneCode, updatePhoneNumber: true } })

        expect(update.json).not.toMatchObject({ twoFactorRedirect: true })
        expect(client.hasCookie('two_factor')).toBe(false)
    })


    it('turns off both email verification auto-sign-in paths with one switch', async () => {
        const email = 'verify-switch@example.com'
        await client.request('/sign-up/email', { body: { email, password: 'passw0rd123', name: 'Switch' } })
        const verificationUrl = captured.verificationUrl
        expect(verificationUrl).toBeTruthy()
        await client.request('/two-factor/enable', { body: { password: 'passw0rd123', method: 'otp' } })
        await client.request('/sign-out')

        const previous = TWO_FACTOR_COVERAGE.emailVerification
        TWO_FACTOR_COVERAGE.emailVerification = false
        try {
            const linkVerify = await client.get(pathFromUrl(verificationUrl!))
            expect(linkVerify.response.headers.get('location') ?? '').not.toContain('twoFactor=1')
            expect(client.hasCookie('session_token')).toBe(true)

            await client.request('/sign-out')
            await client.request('/email-otp/send-verification-otp', { body: { email, type: 'email-verification' } })
            const otpVerify = await client.request('/email-otp/verify-email', { body: { email, otp: captured.emailVerificationCode } })
            expect(otpVerify.json).not.toMatchObject({ twoFactorRedirect: true })
            expect(client.hasCookie('session_token')).toBe(true)
        } finally {
            TWO_FACTOR_COVERAGE.emailVerification = previous
        }
    })

    it('challenges phone OTP sign-in', async () => {
        await setupTwoFactorUserWithPhone(client, database, captured)
        await client.request('/phone-number/send-otp', { body: { phoneNumber: '+8613800138000' } })
        const signIn = await client.request('/phone-number/verify', { body: { phoneNumber: '+8613800138000', code: captured.phoneCode } })

        expect(signIn.json).toMatchObject({ twoFactorRedirect: true, channel: 'phone-otp' })
        expect(client.hasCookie('session_token')).toBe(false)
        expect(database.session).toHaveLength(0)
    })
})
