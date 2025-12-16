import { describe, it, expect, vi, beforeEach } from 'vitest'
import { emailService } from '@/server/utils/email/service'
import { emailTemplateEngine } from '@/server/utils/email/templates'
import { sendEmail } from '@/server/utils/email/index'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('@/server/utils/email/templates', () => ({
    emailTemplateEngine: {
        generateActionEmailTemplate: vi.fn().mockResolvedValue({ html: '<p>html</p>', text: 'text' }),
        generateCodeEmailTemplate: vi.fn().mockResolvedValue({ html: '<p>html</p>', text: 'text' }),
    },
}))

vi.mock('@/server/utils/email/index', () => ({
    sendEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        email: {
            sent: vi.fn(),
            failed: vi.fn(),
        },
    },
}))

vi.mock('@/utils/shared/env', () => ({
    APP_NAME: 'TestApp',
}))

describe('emailService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('sendVerificationEmail', () => {
        it('sends verification email successfully', async () => {
            await emailService.sendVerificationEmail('test@example.com', 'http://verify.url')

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionUrl: 'http://verify.url',
                }),
                expect.any(Object),
            )

            expect(sendEmail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: expect.stringContaining('验证您的 TestApp 邮箱地址'),
                html: '<p>html</p>',
                text: 'text',
            })

            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'verification',
                email: 'test@example.com',
            })
        })

        it('handles error when sending verification email', async () => {
            const error = new Error('Send failed')
            vi.mocked(sendEmail).mockRejectedValueOnce(error)

            await expect(emailService.sendVerificationEmail('test@example.com', 'http://verify.url'))
                .rejects.toThrow('Send failed')

            expect(logger.email.failed).toHaveBeenCalledWith({
                type: 'verification',
                email: 'test@example.com',
                error: 'Send failed',
            })
        })
    })

    describe('sendPasswordResetEmail', () => {
        it('sends password reset email successfully', async () => {
            await emailService.sendPasswordResetEmail('test@example.com', 'http://reset.url')

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionUrl: 'http://reset.url',
                }),
                expect.any(Object),
            )

            expect(sendEmail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: expect.stringContaining('重置您的 TestApp 密码'),
                html: '<p>html</p>',
                text: 'text',
            })

            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'password-reset',
                email: 'test@example.com',
            })
        })
    })

    describe('sendLoginOTP', () => {
        it('sends login OTP email successfully', async () => {
            await emailService.sendLoginOTP('test@example.com', '123456')

            expect(emailTemplateEngine.generateCodeEmailTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                    verificationCode: '123456',
                }),
                expect.any(Object),
            )

            expect(sendEmail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: expect.stringContaining('您的 TestApp 登录验证码'),
                html: '<p>html</p>',
                text: 'text',
            })

            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'login-otp',
                email: 'test@example.com',
            })
        })
    })
})
