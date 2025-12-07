import { ref, onMounted } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { emailSchema, phoneSchema, nicknameSchema, usernameSchema } from '@/utils/shared/validators'
import { usePhoneOtp } from '@/composables/use-otp'
import { authClient } from '@/lib/auth-client'
import { validatePasswordForm } from '@/utils/password-validator'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/captcha'

export function useRegisterFlow() {
    const config = useRuntimeConfig().public
    const phoneEnabled = config.phoneEnabled
    const usernameEnabled = config.usernameEnabled

    const nickname = ref('')
    const username = ref('')
    const email = ref('')
    const phone = ref('')
    const phoneCode = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const agreedToTerms = ref(false)
    const errors = ref<Record<string, string>>({})
    const toast = useToast()
    const loading = ref(false)
    const captcha = ref<CaptchaExpose | null>(null)

    // URL params
    const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
    const activeTab = ref<'email' | 'phone'>('email')

    const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

    const sendPhoneCode = async () => {
        await sendPhoneOtp(
            phone.value,
            'sign-in',
            captcha,
            () => {
                const res = phoneSchema.safeParse(phone.value)
                if (!res.success) {
                    errors.value.phone = res.error.issues[0]?.message || '请输入有效的手机号'
                    return false
                }
                return true
            },
            (field, msg) => {
                errors.value[field] = msg
            },
        )
    }

    onMounted(() => {
        if (!phoneEnabled) {
            activeTab.value = 'email'
            params.mode = 'email'
            return
        }
        if (!['email', 'phone'].includes(params.mode as string)) {
            params.mode = 'email'
        }
        activeTab.value = params.mode
    })

    const changeMode = (mode: 'email' | 'phone') => {
        params.mode = mode
        activeTab.value = mode
        errors.value.captcha = ''
        captcha.value?.reset()
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        const nicknameValidation = nicknameSchema.safeParse(nickname.value)
        if (!nicknameValidation.success) {
            newErrors.nickname = nicknameValidation.error!.issues[0]?.message || '请输入有效的昵称'
        }

        if (usernameEnabled) {
            const usernameValidation = usernameSchema.safeParse(username.value)
            if (!usernameValidation.success) {
                newErrors.username = usernameValidation.error!.issues[0]?.message || '请输入有效的用户名'
            }
        }

        if (activeTab.value === 'email') {
            const emailValidation = emailSchema.safeParse(email.value)
            if (!emailValidation.success) {
                newErrors.email = emailValidation.error!.issues[0]?.message || '请输入有效的邮箱'
            }

            const passwordErrors = validatePasswordForm({
                password: password.value,
                confirmPassword: confirmPassword.value,
            })
            Object.assign(newErrors, passwordErrors)
        } else if (activeTab.value === 'phone') {
            const phoneValidation = phoneSchema.safeParse(phone.value)
            if (!phoneValidation.success) {
                newErrors.phone = phoneValidation.error!.issues[0]?.message || '请输入有效的手机号'
            }
            if (!phoneCode.value) {
                newErrors.phoneCode = '请输入短信验证码'
            }
        }

        if (!agreedToTerms.value) {
            newErrors.agreement = '请阅读并同意服务条款和隐私政策'
        }

        errors.value = newErrors
        return Object.keys(newErrors).length === 0
    }

    const register = async () => {
        if (!validateForm()) {
            return
        }

        errors.value.captcha = ''
        let captchaContext: ResolvedCaptchaToken | null = null

        try {
            loading.value = true

            if (activeTab.value === 'email') {
                try {
                    captchaContext = await resolveCaptchaToken(captcha)
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
                    errors.value.captcha = errorMessage
                    toast.add({ severity: 'warn', summary: '需要验证码', detail: errorMessage, life: 2500 })
                    loading.value = false
                    return
                }

                const signUpData: any = {
                    email: email.value,
                    password: password.value,
                    name: nickname.value,
                }

                if (usernameEnabled) {
                    signUpData.username = username.value.trim()
                }

                const requestOptions = captchaContext
                    ? { headers: { 'x-captcha-response': captchaContext.token } }
                    : undefined

                const { error } = await authClient.signUp.email(signUpData, requestOptions)

                if (error) {
                    throw new Error(error.message || '注册失败')
                }
            } else if (activeTab.value === 'phone') {
                const isVerified = await authClient.phoneNumber.verify({
                    phoneNumber: phone.value,
                    code: phoneCode.value,
                })

                if (!isVerified.data?.status) {
                    throw new Error('手机号码验证失败')
                }

                const updateData: any = {
                    name: nickname.value,
                }

                if (usernameEnabled) {
                    updateData.username = username.value.trim()
                }

                const { error } = await authClient.updateUser(updateData)

                if (error) {
                    throw new Error(error.message || '更新用户信息失败')
                }
            }

            toast.add({
                severity: 'success',
                summary: '注册成功',
                detail: activeTab.value === 'email' ? '验证邮件已发送，请前往邮箱激活账号' : '注册成功，请登录',
                life: 2500,
            })

            setTimeout(() => {
                navigateTo(`/login?mode=${activeTab.value}`)
            }, 500)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '注册过程中发生未知错误'
            toast.add({
                severity: 'error',
                summary: '注册失败',
                detail: errorMessage,
                life: 5000,
            })
        } finally {
            loading.value = false
            if (captchaContext) {
                captchaContext.instance.reset()
            } else {
                captcha.value?.reset()
            }
        }
    }

    return {
        // State
        nickname,
        username,
        email,
        phone,
        phoneCode,
        password,
        confirmPassword,
        agreedToTerms,
        errors,
        loading,
        captcha,
        activeTab,
        phoneCodeSending,

        // Config
        phoneEnabled,
        usernameEnabled,

        // Actions
        changeMode,
        sendPhoneCode,
        register,
    }
}
