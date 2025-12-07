import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendPhoneOtp, injectSmsDeps, resetSmsDeps } from '@/server/utils/phone'

// Mock dependencies
const mockLimiter = {
    increment: vi.fn(),
}

const mockLogger = {
    phone: {
        rateLimited: vi.fn(),
        sent: vi.fn(),
        failed: vi.fn(),
    },
}

const mockSmsProvider = {
    validatePhoneNumber: vi.fn(),
    sendOtp: vi.fn(),
}

const mockResolveProvider = vi.fn().mockReturnValue(mockSmsProvider)

// Mock env
vi.mock('@/utils/env', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        PHONE_CHANNEL: 'mock-channel',
        PHONE_DAILY_LIMIT: 100,
        PHONE_SINGLE_USER_DAILY_LIMIT: 10,
        PHONE_LIMIT_WINDOW: 3600,
    }
})

describe('server/utils/phone', () => {
    beforeEach(() => {
        injectSmsDeps({
            limiter: mockLimiter as any,
            logger: mockLogger as any,
            resolveProvider: mockResolveProvider as any,
        })
        mockLimiter.increment.mockReset()
        mockLogger.phone.rateLimited.mockReset()
        mockLogger.phone.sent.mockReset()
        mockLogger.phone.failed.mockReset()
        mockSmsProvider.validatePhoneNumber.mockReset()
        mockSmsProvider.sendOtp.mockReset()
        mockResolveProvider.mockClear()
    })

    afterEach(() => {
        resetSmsDeps()
        vi.clearAllMocks()
    })

    it('should send OTP successfully', async () => {
        const phoneNumber = '13800138000'
        const code = '123456'

        mockSmsProvider.validatePhoneNumber.mockReturnValue(true)
        mockLimiter.increment.mockResolvedValue(1)
        mockSmsProvider.sendOtp.mockResolvedValue({
            success: true,
            message: 'Success',
            sid: '123',
        })

        const result = await sendPhoneOtp(phoneNumber, code)

        expect(mockResolveProvider).toHaveBeenCalledWith('mock-channel')
        expect(mockSmsProvider.validatePhoneNumber).toHaveBeenCalledWith(phoneNumber)
        expect(mockLimiter.increment).toHaveBeenCalledTimes(2)
        expect(mockSmsProvider.sendOtp).toHaveBeenCalledWith(phoneNumber, code, 5) // Default 300s / 60 = 5m
        expect(mockLogger.phone.sent).toHaveBeenCalled()
        expect(result).toEqual({
            success: true,
            message: 'Success',
            sid: '123',
        })
    })

    it('should throw error if phone number is invalid', async () => {
        const phoneNumber = 'invalid-phone'
        mockSmsProvider.validatePhoneNumber.mockReturnValue(false)

        await expect(sendPhoneOtp(phoneNumber, '123456')).rejects.toThrow('不支持的国家或地区手机号格式')
        expect(mockLimiter.increment).not.toHaveBeenCalled()
    })

    it('should throw error if global rate limit exceeded', async () => {
        const phoneNumber = '13800138000'
        mockSmsProvider.validatePhoneNumber.mockReturnValue(true)
        mockLimiter.increment.mockResolvedValueOnce(101) // Global limit exceeded

        await expect(sendPhoneOtp(phoneNumber, '123456')).rejects.toThrow('今日短信验证码发送次数已达全局上限')
        expect(mockLogger.phone.rateLimited).toHaveBeenCalledWith(expect.objectContaining({ limitType: 'global' }))
    })

    it('should throw error if user rate limit exceeded', async () => {
        const phoneNumber = '13800138000'
        mockSmsProvider.validatePhoneNumber.mockReturnValue(true)
        mockLimiter.increment.mockResolvedValueOnce(1) // Global ok
        mockLimiter.increment.mockResolvedValueOnce(11) // User limit exceeded

        await expect(sendPhoneOtp(phoneNumber, '123456')).rejects.toThrow('您的手机号今日验证码发送次数已达上限')
        expect(mockLogger.phone.rateLimited).toHaveBeenCalledWith(expect.objectContaining({ limitType: 'user' }))
    })

    it('should log failure and throw error if provider fails', async () => {
        const phoneNumber = '13800138000'
        mockSmsProvider.validatePhoneNumber.mockReturnValue(true)
        mockLimiter.increment.mockResolvedValue(1)
        mockSmsProvider.sendOtp.mockRejectedValue(new Error('Provider error'))

        await expect(sendPhoneOtp(phoneNumber, '123456')).rejects.toThrow('Provider error')
        expect(mockLogger.phone.failed).toHaveBeenCalled()
    })
})
