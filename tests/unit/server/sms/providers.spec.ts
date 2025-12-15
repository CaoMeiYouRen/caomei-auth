import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpugSmsProvider } from '@/server/utils/sms/providers/spug'
import { TwilioSmsProvider } from '@/server/utils/sms/providers/twilio'

// Mock fetch for Spug
const fetchMock = vi.fn()
global.fetch = fetchMock

// Mock Twilio
const mockTwilioCreate = vi.fn()
vi.mock('twilio', () => ({
    default: () => ({
        messages: {
            create: mockTwilioCreate,
        },
    }),
}))

// Mock env
vi.mock('@/utils/shared/env', () => ({
    PHONE_SENDER_NAME: 'TestApp',
    SPUG_TEMPLATE_ID: 'spug-123',
    TWILIO_ACCOUNT_SID: 'AC123',
    TWILIO_AUTH_TOKEN: 'token123',
    TWILIO_PHONE_NUMBER: '+15005550006',
}))

describe('server/utils/sms/providers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('SpugSmsProvider', () => {
        const provider = new SpugSmsProvider()

        it('should validate CN phone numbers', () => {
            // Strict mode requires +86
            expect(provider.validatePhoneNumber('+8613800138000')).toBe(true)
            expect(provider.validatePhoneNumber('13800138000')).toBe(false) // Missing +86
            expect(provider.validatePhoneNumber('123456')).toBe(false)
        })

        it('should send OTP correctly', async () => {
            fetchMock.mockResolvedValueOnce({
                json: () => Promise.resolve({ code: 200, msg: 'OK', request_id: 'req-1' }),
            })

            const result = await provider.sendOtp('+8613800138000', '123456', 5)

            expect(fetchMock).toHaveBeenCalledWith(
                'https://push.spug.cc/send/spug-123',
                expect.objectContaining({
                    method: 'post',
                    body: expect.stringContaining('"key2":"123456"'),
                }),
            )
            expect(result.success).toBe(true)
        })

        it('should handle API errors', async () => {
            fetchMock.mockResolvedValueOnce({
                json: () => Promise.resolve({ code: 500, msg: 'Error' }),
            })

            await expect(provider.sendOtp('+8613800138000', '123456', 5))
                .rejects.toThrow('短信发送失败: Error')
        })
    })

    describe('TwilioSmsProvider', () => {
        const provider = new TwilioSmsProvider()

        it('should validate global phone numbers', () => {
            expect(provider.validatePhoneNumber('+15005550006')).toBe(true) // Valid US number
            expect(provider.validatePhoneNumber('invalid')).toBe(false)
        })

        it('should send OTP correctly', async () => {
            mockTwilioCreate.mockResolvedValueOnce({
                sid: 'SM123',
                status: 'queued',
            })

            const result = await provider.sendOtp('+15005550006', '123456', 5)

            expect(mockTwilioCreate).toHaveBeenCalledWith({
                body: expect.stringContaining('123456'),
                from: '+15005550006',
                to: '+15005550006',
            })
            expect(result.success).toBe(true)
            expect(result.sid).toBe('SM123')
        })
    })
})
