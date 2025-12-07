import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useUrlSearchParams, useDark } from '@vueuse/core'
import { authClient } from '@/lib/auth-client'
import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import { navigateAfterLoginWithDelay } from '@/utils/navigation'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/captcha'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import { getSocialColor } from '@/utils/social-colors'
import type { SocialProvider } from '@/types/social'

export function useLoginFlow() {
    const config = useRuntimeConfig().public
    const phoneEnabled = config.phoneEnabled
    const usernameEnabled = config.usernameEnabled
    const toast = useToast()
    const isDark = useDark()
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
    const socialProviders = ref<SocialProvider[]>([])
    const { data: providersData } = useFetch('/api/social/providers')

    // URL Params
    const params = useUrlSearchParams<{ mode: 'username' | 'email' | 'phone' }>('history', { initialValue: { mode: 'username' } })

    // Methods
    const changeSocialColor = (darkMode: boolean) => {
        socialProviders.value = providersData?.value?.providers?.map((provider: any) => {
            const theme = darkMode ? 'dark' : 'light'
            const color = getSocialColor(provider.provider, theme)
            return {
                ...provider,
                color,
            }
        }) || []
    }

    const changeMode = (mode: 'username' | 'email' | 'phone') => {
        if (mode === 'phone' && !phoneEnabled) {
            toast.add({ severity: 'error', summary: '功能未启用', detail: '短信功能未启用，请使用其他方式登录', life: 3000 })
            return
        }
        if (mode === 'username' && !usernameEnabled) {
            toast.add({ severity: 'error', summary: '功能未启用', detail: '用户名登录功能未启用，请使用其他方式登录', life: 3000 })
            return
        }
        params.mode = mode
        activeTab.value = mode
        errors.value.captcha = ''
        captcha.value?.reset()

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
                const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
                errors.value.captcha = errorMessage
                toast.add({
                    severity: 'warn',
                    summary: '需要验证码',
                    detail: errorMessage,
                    life: 2500,
                })
                return false
            }
            const { error } = await authClient.twoFactor.sendOtp({
                fetchOptions: {
                    headers: captchaContext ? { 'x-captcha-response': captchaContext.token } : {},
                },
            })
            if (error) {
                throw new Error(error.message || '发送验证码失败')
            }
            toast.add({
                severity: 'success',
                summary: '发送成功',
                detail: '验证码已发送，请检查您的邮箱',
                life: 3000,
            })
            return true
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : '发送验证码失败'
            toast.add({
                severity: 'error',
                summary: '发送失败',
                detail: errorMessage,
                life: 5000,
            })
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
            twoFactorError.value = '请输入验证码'
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
                    throw new Error('未知的验证方式')
            }

            if (result.error) {
                throw new Error(result.error.message || '验证失败')
            }

            reset2FAState()
            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '即将跳转到首页',
                life: 2000,
            })
            navigateAfterLoginWithDelay(600)
        } catch (error: any) {
            twoFactorError.value = error.message || '验证失败'
        } finally {
            verifying2FA.value = false
        }
    }

    const login = async () => {
        errors.value = {}

        if (activeTab.value === 'email') {
            if (!email.value) {
                errors.value.email = '请输入邮箱'
                return
            }
            const emailValidation = emailSchema.safeParse(email.value)
            if (!emailValidation.success) {
                errors.value.email = emailValidation.error.issues[0]?.message || '请输入有效的邮箱地址'
                return
            }

            if (emailUseCode.value) {
                if (!emailCode.value) {
                    errors.value.emailCode = '请输入验证码'
                    return
                }
            } else if (!emailPassword.value) {
                errors.value.emailPassword = '请输入密码'
                return
            }

            try {
                const result = emailUseCode.value
                    ? await authClient.signIn.emailOtp({
                        email: email.value,
                        otp: emailCode.value,
                    })
                    : await authClient.signIn.email({
                        email: email.value,
                        password: emailPassword.value,
                        rememberMe: rememberMe.value,
                    })

                if (result.error) {
                    throw new Error(result.error.message || '登录失败')
                }

                if (handle2FA(result)) {
                    return
                }

                toast.add({
                    severity: 'success',
                    summary: '登录成功',
                    detail: '即将跳转到首页',
                    life: 2000,
                })
                navigateAfterLoginWithDelay(600)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
                toast.add({
                    severity: 'error',
                    summary: '登录失败',
                    detail: errorMessage,
                    life: 5000,
                })
            }
            return
        }

        if (activeTab.value === 'username') {
            if (!username.value) {
                errors.value.username = '请输入用户名'
                return
            }
            if (!usernamePassword.value) {
                errors.value.usernamePassword = '请输入密码'
                return
            }

            try {
                const result = await authClient.signIn.username({
                    username: username.value,
                    password: usernamePassword.value,
                    rememberMe: rememberMe.value,
                })
                if (result.error) {
                    throw new Error(result.error.message || '登录失败')
                }

                if (handle2FA(result)) {
                    return
                }
                toast.add({
                    severity: 'success',
                    summary: '登录成功',
                    detail: '即将跳转到首页',
                    life: 2000,
                })

                navigateAfterLoginWithDelay(200)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
                toast.add({
                    severity: 'error',
                    summary: '登录失败',
                    detail: errorMessage,
                    life: 2000,
                })
            }
            return
        }

        if (activeTab.value === 'phone') {
            if (!phone.value) {
                errors.value.phone = '请输入手机号'
                return
            }
            const phoneValidation = phoneSchema.safeParse(phone.value)
            if (!phoneValidation.success) {
                errors.value.phone = phoneValidation.error.issues[0]?.message || '请输入有效的手机号'
                return
            }

            if (phoneUseCode.value) {
                if (!phoneCode.value) {
                    errors.value.phoneCode = '请输入验证码'
                    return
                }
            } else if (!phonePassword.value) {
                errors.value.phonePassword = '请输入密码'
                return
            }

            try {
                let result
                if (phoneUseCode.value) {
                    result = await authClient.phoneNumber.verify({
                        phoneNumber: phone.value,
                        code: phoneCode.value,
                    })
                } else {
                    result = await authClient.signIn.phoneNumber({
                        phoneNumber: phone.value,
                        password: phonePassword.value,
                        rememberMe: rememberMe.value,
                    })
                }

                if (result.error) {
                    throw new Error(result.error.message || '登录失败')
                }

                if (handle2FA(result)) {
                    return
                }

                toast.add({
                    severity: 'success',
                    summary: '登录成功',
                    detail: '即将跳转到首页',
                    life: 2000,
                })
                navigateAfterLoginWithDelay(600)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
                toast.add({
                    severity: 'error',
                    summary: '登录失败',
                    detail: errorMessage,
                    life: 2000,
                })
            }
        }
    }

    const loginAnonymously = async () => {
        try {
            const result = await authClient.signIn.anonymous()

            if (result.error) {
                throw new Error(result.error.message || '匿名登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '匿名登录成功',
                detail: '即将跳转到首页',
                life: 2000,
            })
            navigateAfterLoginWithDelay(600)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '匿名登录时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '匿名登录失败',
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    const loginWithSocial = async (socialProvider: SocialProvider) => {
        const { provider, name, social, oauth2, enabled } = socialProvider

        if (enabled === false) {
            toast.add({
                severity: 'warn',
                summary: '登录失败',
                detail: `${name} 登录方式未启用，请使用其他方式登录`,
                life: 5000,
            })
            return
        }

        if (provider === 'anonymous') {
            await loginAnonymously()
            return
        }
        try {
            let result: any
            if (social) {
                result = await authClient.signIn.social({
                    provider,
                    callbackURL: `${window.location.origin}/profile`,
                })
            } else if (oauth2) {
                result = await authClient.signIn.oauth2({
                    providerId: provider,
                    callbackURL: `${window.location.origin}/profile`,
                })
            }
            if (!result || result.error) {
                throw new Error(result?.error?.message || `${name} 登录失败`)
            }
            toast.add({
                severity: 'success',
                summary: `正在通过 ${name} 登录`,
                detail: '即将跳转到登录页',
                life: 2000,
            })
            navigateAfterLoginWithDelay(600)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `${name} 登录时发生未知错误`
            toast.add({
                severity: 'error',
                summary: `${name} 登录失败`,
                detail: errorMessage,
                life: 5000,
            })
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
                if (!validateEmail(email.value)) {
                    errors.value.email = '请输入有效的邮箱地址'
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
                if (!validatePhone(phone.value)) {
                    errors.value.phone = '请输入有效的手机号'
                    return false
                }
                return true
            },
            (field, msg) => {
                errors.value[field] = msg
            },
        )
    }

    // Watchers & Lifecycle
    watch(isDark, (newVal) => {
        changeSocialColor(newVal)
    }, { immediate: true })

    watch(providersData, () => {
        changeSocialColor(isDark.value)
    })

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

        changeSocialColor(isDark.value)
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
        validateEmail,
        validatePhone,
    }
}
