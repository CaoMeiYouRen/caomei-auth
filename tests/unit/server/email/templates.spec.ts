import { describe, it, expect, vi } from 'vitest'
import { emailTemplateEngine } from '@/server/utils/email/templates'

// Mock dependencies
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>()
    return {
        ...actual,
        existsSync: vi.fn(() => false), // Force fallback templates
        readFileSync: vi.fn(() => ''),
    }
})

vi.mock('@/utils/shared/env', () => ({
    APP_NAME: 'TestApp',
    AUTH_BASE_URL: 'http://localhost',
    CONTACT_EMAIL: 'support@example.com',
}))

describe('server/utils/email/templates', () => {
    it('should generate code email template', async () => {
        const result = await emailTemplateEngine.generateCodeEmailTemplate(
            {
                headerIcon: '🔒',
                message: 'Your code is:',
                verificationCode: '123456',
                expiresIn: 10,
            },
            {
                title: 'Verification Code',
            },
        )

        expect(result.html).toContain('123456')
        expect(result.html).toContain('TestApp')
        expect(result.html).toContain('10')
        expect(result.text).toContain('123456')
    })

    it('should generate action email template', async () => {
        const result = await emailTemplateEngine.generateActionEmailTemplate(
            {
                headerIcon: '🔗',
                message: 'Click link:',
                buttonText: 'Verify',
                actionUrl: 'http://verify.com',
                reminderContent: 'Expires soon',
            },
            {
                title: 'Verify Email',
            },
        )

        expect(result.html).toContain('http://verify.com')
        expect(result.html).toContain('Verify')
    })

    it('should generate simple message template', async () => {
        const result = await emailTemplateEngine.generateSimpleMessageTemplate(
            {
                headerIcon: '👋',
                message: 'Welcome!',
            },
            {
                title: 'Welcome',
            },
        )

        expect(result.html).toContain('Welcome!')
    })
})
