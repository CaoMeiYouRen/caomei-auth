import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useSendEmailCode, useSendPhoneCode } from '@/utils/code'

const { toastAddMock, toastStub, emailOtpMock, phoneNumberMock, resolveCaptchaTokenMock } = vi.hoisted(() => {
    const hoistedToastAddMock = vi.fn()
    const hoistedEmailOtpMock = {
        sendVerificationOtp: vi.fn(),
    }
    const hoistedPhoneNumberMock = {
        requestPasswordReset: vi.fn(),
        sendOtp: vi.fn(),
    }
    const hoistedResolveCaptchaTokenMock = vi.fn()

    return {
        toastAddMock: hoistedToastAddMock,
        toastStub: { add: hoistedToastAddMock },
        emailOtpMock: hoistedEmailOtpMock,
        phoneNumberMock: hoistedPhoneNumberMock,
        resolveCaptchaTokenMock: hoistedResolveCaptchaTokenMock,
    }
})

vi.mock('primevue/usetoast', () => ({
    useToast: () => toastStub,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        emailOtp: emailOtpMock,
        phoneNumber: phoneNumberMock,
    },
}))

vi.mock('@/utils/captcha', () => ({
    resolveCaptchaToken: resolveCaptchaTokenMock,
}))

beforeEach(() => {
    toastAddMock.mockClear()
    emailOtpMock.sendVerificationOtp.mockReset()
    phoneNumberMock.requestPasswordReset.mockReset()
    phoneNumberMock.sendOtp.mockReset()
    resolveCaptchaTokenMock.mockReset()
    vi.useRealTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('utils/code', () => {
    describe('useSendEmailCode', () => {
        it('rejects invalid email input', async () => {
            const email = ref('invalid email')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            const sendCode = useSendEmailCode({
                email,
                type: 'sign-in',
                validateEmail: () => false,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(errors.value.email).toBe('请输入有效的邮箱地址')
            expect(resolveCaptchaTokenMock).not.toHaveBeenCalled()
            expect(emailOtpMock.sendVerificationOtp).not.toHaveBeenCalled()
            expect(sending.value).toBe(false)
        })

        it('handles captcha validation failure gracefully', async () => {
            const email = ref('user@example.com')
            const errors = ref<Record<string, string>>({ captcha: '' })
            const sending = ref(false)
            const failure = new Error('Captcha needed')
            resolveCaptchaTokenMock.mockRejectedValueOnce(failure)
            const sendCode = useSendEmailCode({
                email,
                type: 'sign-in',
                validateEmail: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(errors.value.captcha).toBe('Captcha needed')
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'warn',
                summary: '验证码未完成',
                detail: 'Captcha needed',
                life: 2000,
            })
            expect(emailOtpMock.sendVerificationOtp).not.toHaveBeenCalled()
            expect(sending.value).toBe(false)
        })

        it('sends verification email and applies cooldown when successful', async () => {
            vi.useFakeTimers()
            const email = ref('user@example.com')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            const resetMock = vi.fn()
            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: { reset: resetMock },
            })
            emailOtpMock.sendVerificationOtp.mockResolvedValueOnce({ data: {}, error: null })

            const sendCode = useSendEmailCode({
                email,
                type: 'email-verification',
                validateEmail: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(true)
            expect(resolveCaptchaTokenMock).toHaveBeenCalled()
            expect(emailOtpMock.sendVerificationOtp).toHaveBeenCalledWith({
                email: 'user@example.com',
                type: 'email-verification',
                fetchOptions: {
                    headers: { 'x-captcha-response': 'captcha token' },
                },
            })
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'info',
                summary: '验证码已发送',
                detail: '请查收您的邮箱',
                life: 2000,
            })
            expect(sending.value).toBe(true)
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
            expect(resetMock).toHaveBeenCalled()
        })

        it('notifies about backend failures during send', async () => {
            vi.useFakeTimers()
            const email = ref('user@example.com')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: { reset: vi.fn() },
            })
            emailOtpMock.sendVerificationOtp.mockResolvedValueOnce({
                data: null,
                error: { message: '验证码发送失败' },
            })

            const sendCode = useSendEmailCode({
                email,
                type: 'forget-password',
                validateEmail: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'error',
                summary: '发送失败',
                detail: '验证码发送失败',
                life: 2000,
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
        })
    })

    describe('useSendPhoneCode', () => {
        it('rejects invalid phone numbers', async () => {
            const phone = ref('123')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)

            const sendCode = useSendPhoneCode({
                phone,
                type: 'sign-in',
                validatePhone: () => false,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(errors.value.phone).toBe('请输入有效的手机号')
            expect(resolveCaptchaTokenMock).not.toHaveBeenCalled()
            expect(phoneNumberMock.sendOtp).not.toHaveBeenCalled()
        })

        it('handles captcha errors when sending phone code', async () => {
            const phone = ref('13500000000')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            resolveCaptchaTokenMock.mockRejectedValueOnce(new Error('Captcha missing'))

            const sendCode = useSendPhoneCode({
                phone,
                type: 'sign-in',
                validatePhone: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(errors.value.captcha).toBe('Captcha missing')
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'warn',
                summary: '验证码未完成',
                detail: 'Captcha missing',
                life: 2000,
            })
            expect(phoneNumberMock.sendOtp).not.toHaveBeenCalled()
        })

        it('requests password reset when type is forget-password', async () => {
            vi.useFakeTimers()
            const phone = ref('13500000000')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            const resetMock = vi.fn()
            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: { reset: resetMock },
            })
            phoneNumberMock.requestPasswordReset.mockResolvedValueOnce({ data: {}, error: null })

            const sendCode = useSendPhoneCode({
                phone,
                type: 'forget-password',
                validatePhone: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(true)
            expect(phoneNumberMock.requestPasswordReset).toHaveBeenCalledWith({
                phoneNumber: '13500000000',
                fetchOptions: {
                    headers: { 'x-captcha-response': 'captcha token' },
                },
            })
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'info',
                summary: '验证码已发送',
                detail: '请查收您的短信',
                life: 2000,
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
            expect(resetMock).toHaveBeenCalled()
        })

        it('bubbles backend error messages for OTP sends', async () => {
            vi.useFakeTimers()
            const phone = ref('13500000000')
            const errors = ref<Record<string, string>>({})
            const sending = ref(false)
            resolveCaptchaTokenMock.mockResolvedValueOnce({
                token: 'captcha token',
                instance: { reset: vi.fn() },
            })
            phoneNumberMock.sendOtp.mockResolvedValueOnce({
                data: null,
                error: { message: '短信发送失败' },
            })

            const sendCode = useSendPhoneCode({
                phone,
                type: 'sign-in',
                validatePhone: () => true,
                errors,
                sending,
                captcha: ref(null),
            })

            const result = await sendCode()

            expect(result).toBe(false)
            expect(toastAddMock).toHaveBeenCalledWith({
                severity: 'error',
                summary: '发送失败',
                detail: '短信发送失败',
                life: 2000,
            })
            await vi.runAllTimersAsync()
            expect(sending.value).toBe(false)
        })
    })
})
