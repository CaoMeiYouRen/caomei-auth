import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import { authClient } from '@/lib/auth-client'
import { useLoginFlow } from '@/composables/use-login-flow'
import { resolveCaptchaToken } from '@/utils/web/captcha'
import { navigateAfterLoginWithDelay } from '@/utils/web/navigation'

// Mock Nuxt composables
const { config, useToastMock, useFetchMock, useNuxtAppMock, toastAddMock } = vi.hoisted(() => {
    const addMock = vi.fn()
    return {
        config: {
            public: {
                phoneEnabled: true,
                usernameEnabled: true,
            },
        },
        toastAddMock: addMock,
        useToastMock: vi.fn(() => ({
            add: addMock,
        })),
        useFetchMock: vi.fn(() => ({
            data: ref({ providers: [] }),
        })),
        useNuxtAppMock: vi.fn(() => ({
            $clarity: {},
        })),
    }
})

vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return {
        ...actual,
        useRuntimeConfig: () => config,
        useNuxtApp: useNuxtAppMock,
    }
})

mockNuxtImport('useFetch', () => useFetchMock)

vi.mock('primevue/usetoast', () => ({
    useToast: useToastMock,
}))

vi.mock('@vueuse/core', () => ({
    useUrlSearchParams: vi.fn(() => reactive({ mode: 'username' })),
    useColorMode: vi.fn(() => ref('light')),
    usePreferredDark: vi.fn(() => ref(false)),
}))

vi.mock('@/composables/use-clarity', () => ({
    useClarity: vi.fn(() => ({
        event: vi.fn(),
        setTag: vi.fn(),
    })),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            email: vi.fn(),
            username: vi.fn(),
            phoneNumber: vi.fn(),
        },
    },
}))

vi.mock('@/composables/use-otp', () => ({
    useEmailOtp: vi.fn(() => ({ send: vi.fn(), sending: ref(false) })),
    usePhoneOtp: vi.fn(() => ({ send: vi.fn(), sending: ref(false) })),
}))

vi.mock('@/utils/web/captcha', () => ({
    resolveCaptchaToken: vi.fn(),
}))

vi.mock('@/utils/web/navigation', () => ({
    navigateAfterLoginWithDelay: vi.fn(),
}))

describe('useLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with default values', () => {
        const { activeTab, email, username, phone } = useLoginFlow()
        expect(activeTab.value).toBe('username')
        expect(email.value).toBe('')
        expect(username.value).toBe('')
        expect(phone.value).toBe('')
    })

    it('changes mode correctly', () => {
        const { activeTab, changeMode } = useLoginFlow()

        changeMode('email')
        expect(activeTab.value).toBe('email')

        changeMode('phone')
        expect(activeTab.value).toBe('phone')
    })

    it('resets captcha only when a token exists', () => {
        const { captcha, changeMode } = useLoginFlow()
        const reset = vi.fn()

        captcha.value = { token: '', reset, loading: false } as never
        changeMode('email')
        expect(reset).not.toHaveBeenCalled()

        captcha.value = { token: ref('captcha-token'), reset, loading: false } as never
        changeMode('phone')
        expect(reset).toHaveBeenCalledOnce()
    })

    it('validates disabled modes', () => {
        config.public.phoneEnabled = false
        config.public.usernameEnabled = false

        const { activeTab, changeMode } = useLoginFlow()

        changeMode('phone')
        expect(activeTab.value).toBe('username') // Should not change
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))

        // Reset config
        config.public.phoneEnabled = true
        config.public.usernameEnabled = true
    })

    it('handles username login success', async () => {
        const { activeTab, username, usernamePassword, login } = useLoginFlow()
        activeTab.value = 'username'
        username.value = 'testuser'
        usernamePassword.value = 'password123'

        // Mock authClient.signIn.username to resolve
        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        authClient.signIn.username = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            username: 'testuser',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles login validation error', async () => {
        const { activeTab, username, login, errors } = useLoginFlow()
        activeTab.value = 'username'
        username.value = '' // Empty username

        await login()

        expect(errors.value.username).toBeTruthy()
    })

    it('handles email login success with password', async () => {
        const { activeTab, email, emailPassword, login } = useLoginFlow()
        activeTab.value = 'email'
        email.value = 'test@example.com'
        emailPassword.value = 'password123'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        authClient.signIn.email = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles email login success with OTP', async () => {
        const { activeTab, email, emailCode, emailUseCode, login } = useLoginFlow()
        activeTab.value = 'email'
        emailUseCode.value = true
        email.value = 'test@example.com'
        emailCode.value = '123456'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        authClient.signIn.emailOtp = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            email: 'test@example.com',
            otp: '123456',
        })
    })

    it('handles phone login success with password', async () => {
        const { activeTab, phone, phonePassword, login } = useLoginFlow()
        activeTab.value = 'phone'
        phone.value = '+8613800138000'
        phonePassword.value = 'password123'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        authClient.signIn.phoneNumber = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            phoneNumber: '+8613800138000',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles phone login success with OTP', async () => {
        const { activeTab, phone, phoneCode, phoneUseCode, login } = useLoginFlow()
        activeTab.value = 'phone'
        phoneUseCode.value = true
        phone.value = '+8613800138000'
        phoneCode.value = '123456'

        const verifyMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        authClient.phoneNumber = { verify: verifyMock } as any

        await login()

        expect(verifyMock).toHaveBeenCalledWith({
            phoneNumber: '+8613800138000',
            code: '123456',
        })
    })

    it('handles login error', async () => {
        const { activeTab, username, usernamePassword, login } = useLoginFlow()
        activeTab.value = 'username'
        username.value = 'testuser'
        usernamePassword.value = 'wrongpassword'

        const signInMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } })
        authClient.signIn.username = signInMock

        await login()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid credentials',
        }))
    })

    it('maps social providers with colors', () => {
        useFetchMock.mockReturnValue({ data: ref({ providers: [{ provider: 'github', name: 'GitHub', enabled: true }] }) } as any)

        const { socialProviders } = useLoginFlow()

        expect(socialProviders.value).toHaveLength(1)
        expect(socialProviders.value[0]?.provider).toBe('github')
        expect(socialProviders.value[0]?.color).toBeTruthy()

        useFetchMock.mockReturnValue({ data: ref({ providers: [] }) } as any)
    })

    it('opens the 2FA dialog when login redirects to two factor', async () => {
        const { activeTab, username, usernamePassword, login, show2FADialog } = useLoginFlow()
        activeTab.value = 'username'
        username.value = 'testuser'
        usernamePassword.value = 'password123'

        authClient.signIn.username = vi.fn().mockResolvedValue({ data: { twoFactorRedirect: true }, error: null })

        await login()

        expect(show2FADialog.value).toBe(true)
        expect(navigateAfterLoginWithDelay).not.toHaveBeenCalled()
    })

    it('sends otp with resolved captcha token', async () => {
        const reset = vi.fn()
        vi.mocked(resolveCaptchaToken).mockResolvedValue({ token: 'captcha-token', instance: { reset } } as any)
        const sendOtpMock = vi.fn().mockResolvedValue({ error: null })
        ;(authClient as any).twoFactor = { sendOtp: sendOtpMock }

        const { sendOtp, otpSending } = useLoginFlow()
        const sent = await sendOtp()

        expect(sent).toBe(true)
        expect(sendOtpMock).toHaveBeenCalledWith({ fetchOptions: { headers: { 'x-captcha-response': 'captcha-token' } } })
        expect(reset).toHaveBeenCalled()
        expect(otpSending.value).toBe(false)
    })

    it('reports captcha failure when sending otp', async () => {
        vi.mocked(resolveCaptchaToken).mockRejectedValue(new Error('请先完成验证码验证'))

        const { sendOtp, errors } = useLoginFlow()
        const sent = await sendOtp()

        expect(sent).toBe(false)
        expect(errors.value.captcha).toBe('请先完成验证码验证')
    })

    it('reports api failure when sending otp', async () => {
        vi.mocked(resolveCaptchaToken).mockResolvedValue(null)
        ;(authClient as any).twoFactor = {
            sendOtp: vi.fn().mockResolvedValue({ error: { message: '发送失败' } }),
        }

        const { sendOtp } = useLoginFlow()

        expect(await sendOtp()).toBe(false)
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: '发送失败' }))
    })

    it('requires a 2FA code before verifying', async () => {
        const { verify2FA, twoFactorError } = useLoginFlow()

        await verify2FA()

        expect(twoFactorError.value).toBe('请输入验证码')
    })

    it('verifies 2FA with the selected method', async () => {
        const verifyTotp = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const verifyOtp = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const verifyBackupCode = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        ;(authClient as any).twoFactor = { verifyTotp, verifyOtp, verifyBackupCode }

        const { verify2FA, twoFactorCode, activeAuthTab, show2FADialog, verifying2FA } = useLoginFlow()
        twoFactorCode.value = '123456'
        activeAuthTab.value = 0
        await verify2FA()

        expect(verifyTotp).toHaveBeenCalledWith({ code: '123456', trustDevice: true })
        expect(show2FADialog.value).toBe(false)
        expect(verifying2FA.value).toBe(false)
        expect(navigateAfterLoginWithDelay).toHaveBeenCalledWith(600)

        twoFactorCode.value = '654321'
        activeAuthTab.value = 1
        await verify2FA()
        expect(verifyOtp).toHaveBeenCalledWith({ code: '654321', trustDevice: true })

        twoFactorCode.value = 'backup-code'
        activeAuthTab.value = 2
        await verify2FA()
        expect(verifyBackupCode).toHaveBeenCalledWith({ code: 'backup-code', trustDevice: true })
    })

    it('keeps the 2FA dialog open when verification fails', async () => {
        ;(authClient as any).twoFactor = {
            verifyTotp: vi.fn().mockResolvedValue({ data: null, error: { message: '验证码错误' } }),
        }

        const { verify2FA, twoFactorCode, twoFactorError, show2FADialog } = useLoginFlow()
        twoFactorCode.value = '000000'
        await verify2FA()

        expect(twoFactorError.value).toBe('验证码错误')
        expect(show2FADialog.value).toBe(false)
    })

    it('rejects disabled social provider', async () => {
        const { loginWithSocial } = useLoginFlow()

        await loginWithSocial({ provider: 'github', name: 'GitHub', enabled: false } as any)

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: expect.stringContaining('GitHub') }))
    })

    it('delegates anonymous provider to anonymous login', async () => {
        const anonymousMock = vi.fn().mockResolvedValue({ data: { user: { id: 'anon' } }, error: null })
        ;(authClient.signIn as any).anonymous = anonymousMock

        const { loginWithSocial } = useLoginFlow()
        await loginWithSocial({ provider: 'anonymous', name: '匿名', enabled: true } as any)

        expect(anonymousMock).toHaveBeenCalled()
        expect(navigateAfterLoginWithDelay).toHaveBeenCalledWith(600)
    })

    it('reports social login failure', async () => {
        ;(authClient.signIn as any).social = vi.fn().mockResolvedValue({ error: { message: 'OAuth 失败' } })

        const { loginWithSocial } = useLoginFlow()
        await loginWithSocial({ provider: 'github', name: 'GitHub', enabled: true } as any)

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'OAuth 失败' }))
    })

    it('validates email before sending the login code', async () => {
        const emailSend = vi.fn()
        vi.mocked(useEmailOtp).mockReturnValue({ send: emailSend, sending: ref(false) } as any)

        const { sendEmailCode, email, errors } = useLoginFlow()
        email.value = 'not-an-email'
        await sendEmailCode()

        expect(emailSend).toHaveBeenCalledTimes(1)
        const validate = emailSend.mock.calls[0]?.[3] as () => boolean
        expect(validate()).toBe(false)
        expect(errors.value.email).toBeTruthy()
    })

    it('validates phone before sending the login code', async () => {
        const phoneSend = vi.fn()
        vi.mocked(usePhoneOtp).mockReturnValue({ send: phoneSend, sending: ref(false) } as any)

        const { sendPhoneCode, phone, errors } = useLoginFlow()
        phone.value = '123'
        await sendPhoneCode()

        expect(phoneSend).toHaveBeenCalledTimes(1)
        const validate = phoneSend.mock.calls[0]?.[3] as () => boolean
        expect(validate()).toBe(false)
        expect(errors.value.phone).toBeTruthy()
    })

    it('exposes validation helpers', () => {
        const { validateEmail, validatePhone } = useLoginFlow()

        expect(validateEmail('user@example.com')).toBe(true)
        expect(validateEmail('invalid')).toBe(false)
        expect(validatePhone('+8613800138000')).toBe(true)
        expect(validatePhone('123')).toBe(false)
    })
})
