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

vi.mock('@/utils/shared/env', () => ({
    APP_NAME: 'Test App',
}))

describe('Server Utils: Email Service', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should send verification email successfully', async () => {
        vi.mocked(sendEmail).mockResolvedValue(undefined as any)

        await emailService.sendVerificationEmail('test@example.com', 'http://verify.com')

        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(logger.email.sent).toHaveBeenCalledWith({ type: 'verification', email: 'test@example.com' })
    })

    it('should retry sending verification email on failure', async () => {
        // Mock sendEmail to fail once then succeed
        vi.mocked(sendEmail)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(undefined as any)

        const promise = emailService.sendVerificationEmail('test@example.com', 'http://verify.com')

        // Advance timers to trigger retry
        await vi.advanceTimersByTimeAsync(1000)

        await promise

        expect(sendEmail).toHaveBeenCalledTimes(2)
        expect(logger.email.sent).toHaveBeenCalledWith({ type: 'verification', email: 'test@example.com' })
    })

    it('should fail after max retries', async () => {
        // Mock sendEmail to fail always
        vi.mocked(sendEmail).mockRejectedValue(new Error('Persistent error'))

        const promise = emailService.sendVerificationEmail('test@example.com', 'http://verify.com')

        // Attach error handler immediately to avoid UnhandledRejection
        const resultPromise = expect(promise).rejects.toThrow('Persistent error')

        // Advance timers for all retries (3 retries * 1000ms)
        await vi.advanceTimersByTimeAsync(10000)

        await resultPromise

        // Initial + 3 retries = 4 calls
        expect(sendEmail).toHaveBeenCalledTimes(4)
        expect(logger.email.failed).toHaveBeenCalledWith(expect.objectContaining({
            type: 'verification',
            email: 'test@example.com',
            error: 'Persistent error',
        }))
    })
})
