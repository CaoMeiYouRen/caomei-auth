import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Transporter } from 'nodemailer'

import { sendEmail, injectEmailDeps, resetEmailDeps } from '@/server/utils/email'
import { EMAIL_DAILY_LIMIT } from '@/utils/env'

type LimiterDeps = NonNullable<Parameters<typeof injectEmailDeps>[0]>['limiter']

const verifyMock = vi.fn<() => Promise<boolean>>()
const sendMailMock = vi.fn<(mailOptions: any) => Promise<unknown>>()
const limiterIncrementMock = vi.fn<(key: string, ttl: number) => Promise<number>>()
const limiterMock: LimiterDeps = {
    increment: limiterIncrementMock,
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
}

function createMockTransporter(): Transporter {
    return {
        verify: verifyMock,
        sendMail: sendMailMock,
    } as unknown as Transporter
}

describe('server/utils/email', () => {
    beforeEach(() => {
        verifyMock.mockReset()
        sendMailMock.mockReset()
        limiterIncrementMock.mockReset()

        injectEmailDeps({
            createMailer: () => createMockTransporter(),
            limiter: limiterMock,
        })
    })

    afterEach(() => {
        resetEmailDeps()
    })

    it('sends email when limits are within bounds', async () => {
        verifyMock.mockResolvedValueOnce(true)
        limiterIncrementMock.mockResolvedValueOnce(1)
        limiterIncrementMock.mockResolvedValueOnce(1)
        sendMailMock.mockResolvedValueOnce({ messageId: 'test' })

        const result = await sendEmail({
            to: 'user@example.com',
            subject: 'Test',
            text: 'Hello',
        })

        expect(result).toEqual({ messageId: 'test' })
        expect(verifyMock).toHaveBeenCalledTimes(1)
        expect(sendMailMock).toHaveBeenCalledTimes(1)
        expect(limiterIncrementMock).toHaveBeenCalledTimes(2)
    })

    it('throws when hitting the global rate limit', async () => {
        verifyMock.mockResolvedValueOnce(true)
        limiterIncrementMock.mockResolvedValueOnce(EMAIL_DAILY_LIMIT + 1)

        await expect(sendEmail({
            to: 'user@example.com',
            subject: 'Test',
            text: 'Hello',
        })).rejects.toThrow('今日邮箱发送次数已达全局上限')

        expect(sendMailMock).not.toHaveBeenCalled()
    })
})
