import { ref, onMounted, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import type { z } from 'zod'
import { registerEmailFormSchema, registerPhoneFormSchema } from '@/utils/shared/schemas'
import { usePhoneOtp } from '@/composables/use-otp'
import { authClient } from '@/lib/auth-client'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'

export function useRegisterFlow() {
    const config = useRuntimeConfig().public
    const phoneEnabled = config.phoneEnabled
    const usernameEnabled = config.usernameEnabled

    const toast = useToast()
    const captcha = ref<CaptchaExpose | null>(null)

    // URL params
    const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
    const activeTab = ref<'email' | 'phone'>('email')

    const { values, errors, submitting: loading, handleSubmit, setErrors, setField } = useForm({
        initialValues: {
            nickname: '',
            username: '',
            email: '',
            phone: '',
            code: '',
            password: '',
            confirmPassword: '',
            agreement: false,
        },
        validate: (vals) => {
            const newErrors: Record<string, string> = {}
            let schema: z.ZodType<any>

            if (activeTab.value === 'email') {
                schema = registerEmailFormSchema
            } else {
                schema = registerPhoneFormSchema
            }

            const result = schema.safeParse(vals)
            if (!result.success) {
                result.error.issues.forEach((err) => {
                    const path = err.path.join('.')
                    if (path) {
                        newErrors[path] = err.message
                    } else {
                        newErrors._form = err.message
                    }
                })
            }

            if (!vals.agreement) {
                newErrors.agreement = '请阅读并同意服务条款和隐私政策'
            }

            return newErrors
        },
    })

    // Computed proxies for backward compatibility
    const nickname = computed({ get: () => values.value.nickname, set: (v) => setField('nickname', v) })
    const username = computed({ get: () => values.value.username || '', set: (v) => setField('username', v) })
    const email = computed({ get: () => values.value.email || '', set: (v) => setField('email', v) })
    const phone = computed({ get: () => values.value.phone || '', set: (v) => setField('phone', v) })
    const phoneCode = computed({ get: () => values.value.code || '', set: (v) => setField('code', v) })
    const password = computed({ get: () => values.value.password || '', set: (v) => setField('password', v) })
    const confirmPassword = computed({ get: () => values.value.confirmPassword || '', set: (v) => setField('confirmPassword', v) })
    const agreedToTerms = computed({ get: () => values.value.agreement, set: (v) => setField('agreement', v) })

    const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

    const sendPhoneCode = async () => {
        await sendPhoneOtp(
            phone.value,
            'sign-in',
            captcha,
            () => {
                const res = registerPhoneFormSchema.shape.phone.safeParse(phone.value)
                if (!res.success) {
                    setErrors({ ...errors.value, phone: res.error.issues[0]?.message || '请输入有效的手机号' })
                    return false
                }
                return true
            },
            (field, msg) => {
                setErrors({ ...errors.value, [field]: msg })
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
        if (mode === 'phone' && !phoneEnabled) {
            toast.add({ severity: 'error', summary: '功能未启用', detail: '短信功能未启用，请使用其他方式注册', life: 3000 })
            return
        }
        params.mode = mode
        activeTab.value = mode
        setErrors({})
        captcha.value?.reset()
    }

    const register = async () => {
        await handleSubmit(async (vals) => {
            errors.value.captcha = ''
            let captchaContext: ResolvedCaptchaToken | null = null

            try {
                if (activeTab.value === 'email') {
                    try {
                        captchaContext = await resolveCaptchaToken(captcha)
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
                        errors.value.captcha = errorMessage
                        toast.add({ severity: 'warn', summary: '需要验证码', detail: errorMessage, life: 2500 })
                        return
                    }

                    const signUpData: any = {
                        email: vals.email,
                        password: vals.password,
                        name: vals.nickname,
                    }

                    if (usernameEnabled) {
                        signUpData.username = vals.username?.trim()
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
                        phoneNumber: vals.phone!,
                        code: vals.code!,
                    })

                    if (!isVerified.data?.status) {
                        throw new Error('手机号码验证失败')
                    }

                    const updateData: any = {
                        name: vals.nickname,
                    }

                    if (usernameEnabled) {
                        updateData.username = vals.username?.trim()
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
                // Re-throw to let useForm know it failed? useForm doesn't handle errors from onSubmit unless we throw.
                // But here we handled it with toast.
            }
        })
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
