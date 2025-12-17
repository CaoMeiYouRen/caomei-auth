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

    it('should fail if sending verification email fails', async () => {
        // Mock sendEmail to fail
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
