import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emailService } from '@/server/utils/email/service'
import { sendEmail } from '@/server/utils/email/index'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('@/server/utils/email/index', () => ({
    sendEmail: vi.fn(),
}))

vi.mock('@/server/utils/email/templates', () => ({
    emailTemplateEngine: {
        generateActionEmailTemplate: vi.fn().mockResolvedValue({ html: '<p>html</p>', text: 'text' }),
        generateCodeEmailTemplate: vi.fn().mockResolvedValue({ html: '<p>html</p>', text: 'text' }),
        generateSimpleMessageTemplate: vi.fn().mockResolvedValue({ html: '<p>html</p>', text: 'text' }),
    },
}))

vi.mock('@/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/shared/env')>()
    return {
        ...actual,
        APP_NAME: 'Test App',
    }
})

describe('Server Utils: Email Service', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('Verification Email', () => {
        it('should send verification email successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendVerificationEmail('test@example.com', 'http://verify.com')

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'verification', email: 'test@example.com' })
        })

        it('should fail if sending verification email fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Network error'))

            await expect(emailService.sendVerificationEmail('test@example.com', 'http://verify.com'))
                .rejects.toThrow('Network error')

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'verification',
                email: 'test@example.com',
                error: 'Network error',
            }))
        })
    })

    describe('Locale handling', () => {
        it('sends English copy when the locale is en-US', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendVerificationEmail('test@example.com', 'http://verify.com', { locale: 'en-US' })

            const payload = vi.mocked(sendEmail).mock.calls.at(-1)?.[0] as { subject: string, html: string }
            expect(payload.subject).toBe('Verify your Test App email address')
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'verification', email: 'test@example.com' })
        })

        it('sends Chinese copy by default', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendVerificationEmail('test@example.com', 'http://verify.com', { locale: 'zh-CN' })

            const payload = vi.mocked(sendEmail).mock.calls.at(-1)?.[0] as { subject: string }
            expect(payload.subject).toBe('验证您的 Test App 邮箱地址')
        })

        it('forwards the locale through every email method', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)
            const engine = await import('@/server/utils/email/templates')

            await emailService.sendVerificationEmail('a@example.com', 'https://x/verify', { locale: 'en-US' })
            await emailService.sendLoginOTP('a@example.com', '111111', 5, { locale: 'en-US' })
            await emailService.sendEmailVerificationOTP('a@example.com', '222222', 5, { locale: 'en-US' })
            await emailService.sendPasswordResetOTP('a@example.com', '333333', 5, { locale: 'en-US' })
            await emailService.sendMagicLink('a@example.com', 'https://x/magic', { locale: 'en-US' })
            await emailService.sendEmailChangeVerification('a@example.com', 'b@example.com', 'https://x/change', { locale: 'en-US' })
            await emailService.sendSecurityNotification('a@example.com', 'Password changed', 'details', { locale: 'en-US' })

            const calls = [
                ...vi.mocked(engine.emailTemplateEngine.generateActionEmailTemplate).mock.calls,
                ...vi.mocked(engine.emailTemplateEngine.generateCodeEmailTemplate).mock.calls,
                ...vi.mocked(engine.emailTemplateEngine.generateSimpleMessageTemplate).mock.calls,
            ]
            expect(calls.length).toBeGreaterThanOrEqual(7)
            expect(calls.every((call) => call[2] === 'en-US')).toBe(true)

            const subjects = vi.mocked(sendEmail).mock.calls.map((call) => (call[0] as { subject: string }).subject)
            expect(subjects.some((subject) => /[\u4e00-\u9fa5]/u.test(subject))).toBe(false)
        })

        it('passes the locale through to the template engine', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendMagicLink('test@example.com', 'http://magic.com', { locale: 'en-US' })

            const engine = await import('@/server/utils/email/templates')
            const args = vi.mocked(engine.emailTemplateEngine.generateActionEmailTemplate).mock.calls.at(-1)
            expect(args?.[1].title).toBe('Your Test App sign-in link')
            expect(args?.[2]).toBe('en-US')
        })
    })

    describe('Login OTP Email', () => {
        it('should send login OTP email successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendLoginOTP('test@example.com', '123456', 5)

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'login-otp', email: 'test@example.com' })
        })

        it('should fail if sending login OTP email fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Rate limited'))

            await expect(emailService.sendLoginOTP('test@example.com', '123456'))
                .rejects.toThrow('Rate limited')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'login-otp',
                email: 'test@example.com',
                error: 'Rate limited',
            }))
        })
    })

    describe('Email Verification OTP', () => {
        it('should send email verification OTP successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendEmailVerificationOTP('test@example.com', '654321', 10)

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'email-verification-otp', email: 'test@example.com' })
        })

        it('should fail if sending email verification OTP fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Template error'))

            await expect(emailService.sendEmailVerificationOTP('test@example.com', '654321'))
                .rejects.toThrow('Template error')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'email-verification-otp',
                email: 'test@example.com',
                error: 'Template error',
            }))
        })
    })

    describe('Password Reset OTP', () => {
        it('should send password reset OTP successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendPasswordResetOTP('test@example.com', '789012', 5)

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'password-reset-otp', email: 'test@example.com' })
        })

        it('should fail if sending password reset OTP fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Connection timeout'))

            await expect(emailService.sendPasswordResetOTP('test@example.com', '789012'))
                .rejects.toThrow('Connection timeout')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'password-reset-otp',
                email: 'test@example.com',
                error: 'Connection timeout',
            }))
        })
    })

    describe('Magic Link Email', () => {
        it('should send magic link email successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendMagicLink('test@example.com', 'http://magic.com')

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'magic-link', email: 'test@example.com' })
        })

        it('should fail if sending magic link email fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Invalid URL'))

            await expect(emailService.sendMagicLink('test@example.com', 'http://magic.com'))
                .rejects.toThrow('Invalid URL')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'magic-link',
                email: 'test@example.com',
                error: 'Invalid URL',
            }))
        })
    })

    describe('Email Change Verification', () => {
        it('should send email change verification successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendEmailChangeVerification('old@example.com', 'new@example.com', 'http://change.com')

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'email-change', email: 'old@example.com' })
        })

        it('should fail if sending email change verification fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Email bounce'))

            await expect(emailService.sendEmailChangeVerification('old@example.com', 'new@example.com', 'http://change.com'))
                .rejects.toThrow('Email bounce')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'email-change',
                email: 'old@example.com',
                error: 'Email bounce',
            }))
        })
    })

    describe('Security Notification', () => {
        it('should send security notification successfully', async () => {
            vi.mocked(sendEmail).mockResolvedValue(undefined as any)

            await emailService.sendSecurityNotification('test@example.com', 'Password changed', 'Your password was changed from IP: 127.0.0.1')

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(logger.email.sent).toHaveBeenCalledWith({ type: 'security-notification', email: 'test@example.com' })
        })

        it('should fail if sending security notification fails', async () => {
            vi.mocked(sendEmail).mockRejectedValue(new Error('Blocked'))

            await expect(emailService.sendSecurityNotification('test@example.com', 'Test action', 'Test details'))
                .rejects.toThrow('Blocked')

            expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
                type: 'security-notification',
                email: 'test@example.com',
                error: 'Blocked',
            }))
        })
    })
})
