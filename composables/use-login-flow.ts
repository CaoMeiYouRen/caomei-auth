import { ref, computed, onMounted, unref } from 'vue'
import { useToast } from 'caomei-ui'
import { useUrlSearchParams } from '@vueuse/core'
import { authClient } from '@/lib/auth-client'
import { emailSchema, phoneSchema, usernameSchema } from '@/utils/shared/validators'
import {
    loginEmailFormSchema,
    loginEmailOtpFormSchema,
    loginUsernameFormSchema,
    loginPhoneFormSchema,
    loginPhoneOtpFormSchema,
} from '@/utils/shared/schemas'
import { navigateAfterLoginWithDelay } from '@/utils/web/navigation'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/web/captcha'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import { getSocialColor } from '@/utils/web/social-colors'
import type { SocialProvider } from '@/types/social'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'
import { useValidationMessage } from '@/composables/utils/use-validation-message'
import { useI18nText } from '@/composables/utils/use-i18n-text'

// Helper function to get first Zod error
function getFirstZodError(result: { success: boolean, error?: { issues: { message: string }[] } }, translate?: (message?: string | null) => string): string | null {
    if (result.success) { return null }
    const message = result.error?.issues[0]?.message
    return translate ? translate(message) : resolveValidationMessage(message) || message || ''
}

export function useLoginFlow() {
    const config = useRuntimeConfig().public
    const translate = useValidationMessage()
    const t = useI18nText()
    const phoneEnabled = config.phoneEnabled
    const usernameEnabled = config.usernameEnabled
    const toast = useToast()
    const clarity = useClarity()

    // State
    const activeTab = ref<'username' | 'email' | 'phone'>('username')
    const email = ref('')
    const emailPassword = ref('')
    const username = ref('')
    const usernamePassword = ref('')
    const phone = ref('')
    const phonePassword = ref('')
    const rememberMe = ref(true)
    const errors = ref<Record<string, string>>({})
    const emailUseCode = ref(false)
    const emailCode = ref('')
    const phoneUseCode = ref(false)
    const phoneCode = ref('')
    const captcha = ref<CaptchaExpose | null>(null)

    // 2FA State
    const show2FADialog = ref(false)
    const twoFactorCode = ref('')
    const twoFactorError = ref('')
    const verifying2FA = ref(false)
    const activeAuthTab = ref(0)
    const otpSending = ref(false)
    const pendingLoginData = ref<any>(null)

    // Social
    const { data: providersData } = useFetch('/api/social/providers')
    // 明暗品牌色都输出到 CSS 变量，由 .dark 选择器切换：
    // 服务端不需要知道系统主题，避免 SSR 与客户端配色不一致造成 hydration mismatch
    const socialProviders = computed<SocialProvider[]>(() => providersData?.value?.providers?.map((provider: any) => ({
        ...provider,
        color: getSocialColor(provider.provider, 'light'),
        colorDark: getSocialColor(provider.provider, 'dark'),
    })) || [])

    // URL Params
    const params = useUrlSearchParams<{ mode: 'username' | 'email' | 'phone' }>('history', { initialValue: { mode: 'username' } })

    // Methods
    const changeMode = (mode: 'username' | 'email' | 'phone') => {
        if (mode === 'phone' && !phoneEnabled) {
            toast.danger({ title: t('auth.common.featureDisabled'), description: t('auth.login.smsDisabled'), duration: 3000 })
            return
        }
        if (mode === 'username' && !usernameEnabled) {
            toast.danger({ title: t('auth.common.featureDisabled'), description: t('auth.login.usernameDisabled'), duration: 3000 })
            return
        }
        params.mode = mode
        activeTab.value = mode
        errors.value.captcha = ''
        const hasCaptchaToken = captcha.value ? Boolean(unref(captcha.value.token)) : false
        if (hasCaptchaToken) {
            captcha.value?.reset()
        }

        clarity.event('login_method_switch')
        clarity.setTag('switched_to_method', mode)
    }

    const handle2FA = (result: any) => {
        if (result.data?.twoFactorRedirect) {
            pendingLoginData.value = result.data
            show2FADialog.value = true
            return true
        }
        return false
    }

    const reset2FAState = () => {
        twoFactorCode.value = ''
        twoFactorError.value = ''
        activeAuthTab.value = 0
        show2FADialog.value = false
        verifying2FA.value = false
        pendingLoginData.value = null
    }

    const sendOtp = async () => {
        let captchaContext: ResolvedCaptchaToken | null = null
        try {
            otpSending.value = true
            try {
                captchaContext = await resolveCaptchaToken(captcha)
                errors.value.captcha = ''
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.common.captchaRequired')
                errors.value.captcha = errorMessage
                toast.warning({ title: t('auth.common.captchaNeeded'), description: errorMessage, duration: 2500 })
                return false
            }
            const { error } = await authClient.twoFactor.sendOtp({
                fetchOptions: {
                    headers: captchaContext ? { 'x-captcha-response': captchaContext.token } : {},
                },
            })
            if (error) {
                throw new Error(error.message || t('auth.login.codeSendFailed'))
            }
            toast.success({ title: t('auth.common.sendSuccess'), description: t('auth.login.codeSent'), duration: 3000 })
            return true
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : t('auth.login.codeSendFailed')
            toast.danger({ title: t('auth.common.sendFailed'), description: errorMessage, duration: 5000 })
            return false
        } finally {
            otpSending.value = false
            if (captchaContext) {
                captchaContext.instance.reset()
            } else {
                captcha.value?.reset()
            }
        }
    }

    const verify2FA = async () => {
        if (!twoFactorCode.value) {
            twoFactorError.value = t('auth.login.enterCode')
            return
        }

        verifying2FA.value = true
        twoFactorError.value = ''

        try {
            let result
            switch (activeAuthTab.value) {
                case 0: // TOTP
                    result = await authClient.twoFactor.verifyTotp({
                        code: twoFactorCode.value,
                        trustDevice: rememberMe.value,
                    })
                    break
                case 1: // OTP
                    result = await authClient.twoFactor.verifyOtp({
                        code: twoFactorCode.value,
                        trustDevice: rememberMe.value,
                    })
                    break
                case 2: // Backup Code
                    result = await authClient.twoFactor.verifyBackupCode({
                        code: twoFactorCode.value,
                        trustDevice: rememberMe.value,
                    })
                    break
                default:
                    throw new Error(t('auth.login.unknownTwoFactorMethod'))
            }

            if (result.error) {
                throw new Error(result.error.message || t('auth.login.verifyFailed'))
            }

            reset2FAState()
            toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.common.redirectHome'), duration: 2000 })
            navigateAfterLoginWithDelay(600)
        } catch (error: any) {
            twoFactorError.value = error.message || t('auth.login.verifyFailed')
        } finally {
            verifying2FA.value = false
        }
    }

    const login = async () => {
        errors.value = {}

        if (activeTab.value === 'email') {
            // 使用 Zod schema 校验邮箱登录
            const schema = emailUseCode.value ? loginEmailOtpFormSchema : loginEmailFormSchema
            const formData = emailUseCode.value
                ? { email: email.value, code: emailCode.value }
                : { email: email.value, password: emailPassword.value }

            const result = schema.safeParse(formData)
            if (!result.success) {
                const errorMsg = getFirstZodError(result, translate)
                if (errorMsg) {
                    // 根据 error path 设置对应的错误字段
                    const path = result.error.issues[0]?.path[0] as string
                    errors.value[path] = errorMsg
                }
                return
            }

            try {
                const authResult = emailUseCode.value
                    ? await authClient.signIn.emailOtp({
                        email: email.value,
                        otp: emailCode.value,
                    })
                    : await authClient.signIn.email({
                        email: email.value,
                        password: emailPassword.value,
                        rememberMe: rememberMe.value,
                    })

                if (authResult.error) {
                    throw new Error(authResult.error.message || t('auth.common.loginFailed'))
                }

                if (handle2FA(authResult)) {
                    return
                }

                toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.common.redirectHome'), duration: 2000 })
                navigateAfterLoginWithDelay(600)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.common.loginError')
                toast.danger({ title: t('auth.common.loginFailed'), description: errorMessage, duration: 5000 })
            }
            return
        }

        if (activeTab.value === 'username') {
            // 使用 Zod schema 校验用户名登录
            const result = loginUsernameFormSchema.safeParse({
                username: username.value,
                password: usernamePassword.value,
            })
            if (!result.success) {
                const errorMsg = getFirstZodError(result, translate)
                if (errorMsg) {
                    const path = result.error.issues[0]?.path[0] as string
                    errors.value[path] = errorMsg
                }
                return
            }

            try {
                const authResult = await authClient.signIn.username({
                    username: username.value,
                    password: usernamePassword.value,
                    rememberMe: rememberMe.value,
                })
                if (authResult.error) {
                    throw new Error(authResult.error.message || t('auth.common.loginFailed'))
                }

                if (handle2FA(authResult)) {
                    return
                }
                toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.common.redirectHome'), duration: 2000 })

                navigateAfterLoginWithDelay(200)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.common.loginError')
                toast.danger({ title: t('auth.common.loginFailed'), description: errorMessage, duration: 2000 })
            }
            return
        }

        if (activeTab.value === 'phone') {
            // 使用 Zod schema 校验手机号登录
            const schema = phoneUseCode.value ? loginPhoneOtpFormSchema : loginPhoneFormSchema
            const formData = phoneUseCode.value
                ? { phone: phone.value, code: phoneCode.value }
                : { phone: phone.value, password: phonePassword.value }

            const result = schema.safeParse(formData)
            if (!result.success) {
                const errorMsg = getFirstZodError(result, translate)
                if (errorMsg) {
                    const path = result.error.issues[0]?.path[0] as string
                    errors.value[path] = errorMsg
                }
                return
            }

            try {
                let authResult
                if (phoneUseCode.value) {
                    authResult = await authClient.phoneNumber.verify({
                        phoneNumber: phone.value,
                        code: phoneCode.value,
                    })
                } else {
                    authResult = await authClient.signIn.phoneNumber({
                        phoneNumber: phone.value,
                        password: phonePassword.value,
                        rememberMe: rememberMe.value,
                    })
                }

                if (authResult.error) {
                    throw new Error(authResult.error.message || t('auth.common.loginFailed'))
                }

                if (handle2FA(authResult)) {
                    return
                }

                toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.common.redirectHome'), duration: 2000 })
                navigateAfterLoginWithDelay(600)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.common.loginError')
                toast.danger({ title: t('auth.common.loginFailed'), description: errorMessage, duration: 2000 })
            }
        }
    }

    const loginAnonymously = async () => {
        try {
            const result = await authClient.signIn.anonymous()

            if (result.error) {
                throw new Error(result.error.message || t('auth.login.anonymousFailed'))
            }

            toast.success({ title: t('auth.login.anonymousSuccess'), description: t('auth.common.redirectHome'), duration: 2000 })
            navigateAfterLoginWithDelay(600)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('auth.login.anonymousError')
            toast.danger({ title: t('auth.login.anonymousFailed'), description: errorMessage, duration: 5000 })
        }
    }

    const loginWithSocial = async (socialProvider: SocialProvider) => {
        const { provider, name, enabled } = socialProvider

        if (enabled === false) {
            toast.warning({ title: t('auth.common.loginFailed'), description: t('auth.login.socialDisabled', { name }), duration: 5000 })
            return
        }

        if (provider === 'anonymous') {
            await loginAnonymously()
            return
        }
        try {
            const result = await authClient.signIn.social({
                provider,
                callbackURL: `${window.location.origin}/profile`,
            })
            if (!result || result.error) {
                throw new Error(result?.error?.message || t('auth.login.socialFailed', { name }))
            }
            toast.success({ title: t('auth.login.socialLoggingIn', { name }), description: t('auth.login.socialRedirect'), duration: 2000 })
            navigateAfterLoginWithDelay(600)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('auth.common.loginError')
            toast.danger({ title: t('auth.login.socialFailed', { name }), description: errorMessage, duration: 5000 })
        }
    }

    const { send: sendEmailOtp, sending: emailCodeSending } = useEmailOtp()
    const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

    const sendEmailCode = async () => {
        await sendEmailOtp(
            email.value,
            'sign-in',
            captcha,
            () => {
                const result = emailSchema.safeParse(email.value)
                if (!result.success) {
                    errors.value.email = getFirstZodError(result, translate) || t('auth.common.invalidEmail')
                    return false
                }
                return true
            },
            (field, msg) => {
                errors.value[field] = msg
            },
        )
    }

    const sendPhoneCode = async () => {
        await sendPhoneOtp(
            phone.value,
            'sign-in',
            captcha,
            () => {
                const result = phoneSchema.safeParse(phone.value)
                if (!result.success) {
                    errors.value.phone = getFirstZodError(result, translate) || t('auth.common.invalidPhone')
                    return false
                }
                return true
            },
            (field, msg) => {
                errors.value[field] = msg
            },
        )
    }

    // Lifecycle
    onMounted(() => {
        if (!['username', 'email', 'phone'].includes(params.mode as string)) {
            params.mode = usernameEnabled ? 'username' : 'email'
        }

        if (params.mode === 'username' && !usernameEnabled) {
            params.mode = 'email'
        }

        if (params.mode === 'phone' && !phoneEnabled) {
            params.mode = usernameEnabled ? 'username' : 'email'
        }

        activeTab.value = params.mode

        clarity.setTag('page_type', 'login')
        clarity.setTag('initial_login_method', params.mode)
    })

    return {
        // State
        activeTab,
        email,
        emailPassword,
        username,
        usernamePassword,
        phone,
        phonePassword,
        rememberMe,
        errors,
        emailUseCode,
        emailCode,
        emailCodeSending,
        phoneUseCode,
        phoneCode,
        phoneCodeSending,
        captcha,
        show2FADialog,
        twoFactorCode,
        twoFactorError,
        verifying2FA,
        activeAuthTab,
        otpSending,
        socialProviders,
        phoneEnabled,
        usernameEnabled,

        // Methods
        changeMode,
        sendOtp,
        verify2FA,
        login,
        loginWithSocial,
        sendEmailCode,
        sendPhoneCode,

        // Validation helpers
        validateEmail: (value: string) => emailSchema.safeParse(value).success,
        validatePhone: (value: string) => phoneSchema.safeParse(value).success,
    }
}
