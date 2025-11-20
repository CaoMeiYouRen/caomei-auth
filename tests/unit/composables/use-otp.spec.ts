import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'

const { toastAddMock, toastStub, emailOtpServiceMock, phoneOtpServiceMock, resolveCaptchaTokenMock } = vi.hoisted(() => {
    const hoistedToastAddMock = vi.fn()
    const hoistedEmailOtpServiceMock = vi.fn()
    const hoistedPhoneOtpServiceMock = vi.fn()
    const hoistedResolveCaptchaTokenMock = vi.fn()

    return {
        toastAddMock: hoistedToastAddMock,
        toastStub: { add: hoistedToastAddMock },
        emailOtpServiceMock: hoistedEmailOtpServiceMock,
        phoneOtpServiceMock: hoistedPhoneOtpServiceMock,
        resolveCaptchaTokenMock: hoistedResolveCaptchaTokenMock,
    }
})

vi.mock('primevue/usetoast', () => ({
    useToast: () => toastStub,
}))

vi.mock('@/utils/otp-service', () => ({
    sendEmailOtpService: emailOtpServiceMock,
    sendPhoneOtpService: phoneOtpServiceMock,
}))

vi.mock('@/utils/captcha', () => ({
    resolveCaptchaToken: resolveCaptchaTokenMock,
}))

beforeEach(() => {
    toastAddMock.mockClear()
    emailOtpServiceMock.mockReset()
    phoneOtpServiceMock.mockReset()
    resolveCaptchaTokenMock.mockReset()
    vi.useRealTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('composables/use-otp', () => {
    describe('useEmailOtp', () => {
        it('rejects invalid email input', async () => {
            const { send, sending } = useEmailOtp()
            const email = 'invalid email'
            const errors = ref<Record<string, string>>({})

            const result = await send(
                email,
                'sign-in',
                ref(null),
                () => false, // validate fails
                (field, msg) => { errors.value[field] = msg },
            )

            expect(result).toBe(false)
            expect(resolveCaptchaTokenMock).not.toHaveBeenCalled()
            expect(emailOtpServiceMock).not.toHaveBeenCalled()
            expect(sending.value).toBe(false)
        })

        it('handles captcha validation failure gracefully', async () => {
            const { send, sending } = useEmailOtp()
            const email = 'user@example.com'
            const errors = ref<Record<string, string>>({})
            const failure = new Error('Captcha needed')
            resolveCaptchaTokenMock.mockRejectedValueOnce(failure)

            const result = await send(
                email,
                'sign-in',
                ref(null),
                () => true,
                (field, msg) => { errors.value[field] = msg },
            )

            expect(result).toBe(false)
            expect(errors.value.captcha).toBe('Captcha needed')
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'warn',
                summary: '验证码',
                detail: 'Captcha needed',
            })
            expect(emailOtpServiceMock).not.toHaveBeenCalled()
            expect(sending.value).toBe(false)
        })

        it('sends verification email and applies cooldown when successful', async () => {
            vi.useFakeTimers()
            const { send, sending } = useEmailOtp()
            const email = 'user@example.com'
            const resetMock = vi.fn()
            const captchaInstance = { reset: resetMock, token: 'captcha token', loading: false }
            const captchaRef = ref(captchaInstance)

            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: captchaInstance,
            })
            emailOtpServiceMock.mockResolvedValueOnce({ data: {}, error: null })

            const result = await send(
                email,
                'email-verification',
                captchaRef,
                () => true,
            )

            expect(result).toBe(true)
            expect(resolveCaptchaTokenMock).toHaveBeenCalled()
            expect(emailOtpServiceMock).toHaveBeenCalledWith(
                'user@example.com',
                'email-verification',
                'captcha token',
            )
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'success',
                summary: '发送成功',
                detail: '请查收邮件',
            })
            expect(sending.value).toBe(true)
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
            expect(resetMock).toHaveBeenCalled()
        })

        it('notifies about backend failures during send', async () => {
            vi.useFakeTimers()
            const { send, sending } = useEmailOtp()
            const email = 'user@example.com'
            const resetMock = vi.fn()
            const captchaInstance = { reset: resetMock, token: 'captcha token', loading: false }
            const captchaRef = ref(captchaInstance)

            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: captchaInstance,
            })
            emailOtpServiceMock.mockResolvedValueOnce({
                data: null,
                error: { message: '验证码发送失败' },
            })

            const result = await send(
                email,
                'forget-password',
                captchaRef,
                () => true,
            )

            expect(result).toBe(false)
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'error',
                summary: '发送失败',
                detail: '验证码发送失败',
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
        })
    })

    describe('usePhoneOtp', () => {
        it('rejects invalid phone numbers', async () => {
            const { send, sending } = usePhoneOtp()
            const phone = '123'
            const errors = ref<Record<string, string>>({})

            const result = await send(
                phone,
                'sign-in',
                ref(null),
                () => false,
                (field, msg) => { errors.value[field] = msg },
            )

            expect(result).toBe(false)
            expect(resolveCaptchaTokenMock).not.toHaveBeenCalled()
            expect(phoneOtpServiceMock).not.toHaveBeenCalled()
            expect(sending.value).toBe(false)
        })

        it('handles captcha errors when sending phone code', async () => {
            const { send, sending } = usePhoneOtp()
            const phone = '13500000000'
            const errors = ref<Record<string, string>>({})
            resolveCaptchaTokenMock.mockRejectedValueOnce(new Error('Captcha missing'))

            const result = await send(
                phone,
                'sign-in',
                ref(null),
                () => true,
                (field, msg) => { errors.value[field] = msg },
            )

            expect(result).toBe(false)
            expect(errors.value.captcha).toBe('Captcha missing')
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'warn',
                summary: '验证码',
                detail: 'Captcha missing',
            })
            expect(phoneOtpServiceMock).not.toHaveBeenCalled()
        })

        it('sends phone otp successfully', async () => {
            vi.useFakeTimers()
            const { send, sending } = usePhoneOtp()
            const phone = '13500000000'
            const resetMock = vi.fn()
            const captchaInstance = { reset: resetMock, token: 'captcha token', loading: false }
            const captchaRef = ref(captchaInstance)

            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: captchaInstance,
            })
            phoneOtpServiceMock.mockResolvedValueOnce({ data: {}, error: null })

            const result = await send(
                phone,
                'forget-password',
                captchaRef,
                () => true,
            )

            expect(result).toBe(true)
            expect(phoneOtpServiceMock).toHaveBeenCalledWith(
                '13500000000',
                'forget-password',
                'captcha token',
            )
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'success',
                summary: '发送成功',
                detail: '请查收短信',
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
            expect(resetMock).toHaveBeenCalled()
        })

        it('bubbles backend error messages for OTP sends', async () => {
            vi.useFakeTimers()
            const { send, sending } = usePhoneOtp()
            const phone = '13500000000'
            const resetMock = vi.fn()
            const captchaInstance = { reset: resetMock, token: 'captcha token', loading: false }
            const captchaRef = ref(captchaInstance)

            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: captchaInstance,
            })
            phoneOtpServiceMock.mockResolvedValueOnce({
                data: null,
                error: { message: '短信发送失败' },
            })

            const result = await send(
                phone,
                'sign-in',
                captchaRef,
                () => true,
            )

            expect(result).toBe(false)
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'error',
                summary: '发送失败',
                detail: '短信发送失败',
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
        })
    })
})
