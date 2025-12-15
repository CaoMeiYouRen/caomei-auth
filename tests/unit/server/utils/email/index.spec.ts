import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendEmail, injectEmailDeps, resetEmailDeps } from '@/server/utils/email/index'

// Mock dependencies
const { mockTransporter, mockCreateMailer, mockLimiter, mockLogger } = vi.hoisted(() => {
    const transporter = {
        verify: vi.fn(),
        sendMail: vi.fn(),
    }
    const createMailer = vi.fn(() => transporter)
    const limiter = {
        increment: vi.fn(),
    }
    const logger = {
        error: vi.fn(),
        email: {
            sent: vi.fn(),
            failed: vi.fn(),
            rateLimited: vi.fn(),
        },
    }
    return { mockTransporter: transporter, mockCreateMailer: createMailer, mockLimiter: limiter, mockLogger: logger }
})

// Mock storage
vi.mock('@/server/database/storage', () => ({
    limiterStorage: mockLimiter,
}))

// Mock env
vi.mock('@/utils/shared/env', () => ({
    EMAIL_DAILY_LIMIT: 100,
    EMAIL_SINGLE_USER_DAILY_LIMIT: 5,
    EMAIL_LIMIT_WINDOW: 86400,
    EMAIL_FROM: 'test@example.com',
    EMAIL_HOST: 'smtp.example.com',
    EMAIL_USER: 'user@example.com',
}))

describe('server/utils/email/index', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetEmailDeps()

        // Default successful setup
        mockTransporter.verify.mockResolvedValue(true)
        mockTransporter.sendMail.mockResolvedValue({ messageId: '123' })
        mockLimiter.increment.mockResolvedValue(1) // Within limit

        injectEmailDeps({
            createMailer: mockCreateMailer as any,
            limiter: mockLimiter as any,
            logger: mockLogger as any,
        })
    })

    afterEach(() => {
        resetEmailDeps()
    })

    it('should send email successfully', async () => {
        const options = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        }

        const result = await sendEmail(options)

        expect(mockLimiter.increment).toHaveBeenCalledTimes(2) // Global + User
        expect(mockCreateMailer).toHaveBeenCalled()
        expect(mockTransporter.verify).toHaveBeenCalled()
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'test@example.com',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: undefined,
        })
        expect(mockLogger.email.sent).toHaveBeenCalledWith({
            type: 'general',
            email: options.to,
            success: true,
        })
        expect(result).toEqual({ messageId: '123' })
    })

    it('should throw error if global rate limit exceeded', async () => {
        mockLimiter.increment.mockResolvedValueOnce(101) // Global limit exceeded

        const options = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        }

        await expect(sendEmail(options)).rejects.toThrow('今日邮箱发送次数已达全局上限')

        expect(mockLogger.email.rateLimited).toHaveBeenCalledWith(expect.objectContaining({
            limitType: 'global',
            email: options.to,
        }))
        expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    it('should throw error if user rate limit exceeded', async () => {
        mockLimiter.increment
            .mockResolvedValueOnce(1) // Global limit OK
            .mockResolvedValueOnce(6) // User limit exceeded

        const options = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        }

        await expect(sendEmail(options)).rejects.toThrow('您的邮箱今日发送次数已达上限')

        expect(mockLogger.email.rateLimited).toHaveBeenCalledWith(expect.objectContaining({
            limitType: 'user',
            email: options.to,
        }))
        expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    it('should throw error if transporter verification fails', async () => {
        mockTransporter.verify.mockResolvedValue(false)

        const options = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        }

        await expect(sendEmail(options)).rejects.toThrow('Email transporter configuration is invalid')

        expect(mockLogger.error).toHaveBeenCalledWith('Email transporter verification failed', expect.any(Object))
    })

    it('should handle sendMail error', async () => {
        const error = new Error('SMTP Error')
        mockTransporter.sendMail.mockRejectedValue(error)

        const options = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Body',
        }

        await expect(sendEmail(options)).rejects.toThrow('SMTP Error')

        expect(mockLogger.email.failed).toHaveBeenCalledWith({
            type: 'general',
            email: options.to,
            error: 'SMTP Error',
        })
    })
})
