import { ref, onMounted, computed, unref } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'caomei-ui'
import type { z } from 'zod'
import { registerEmailFormSchema, registerPhoneFormSchema } from '@/utils/shared/schemas'
import { usePhoneOtp } from '@/composables/use-otp'
import { authClient } from '@/lib/auth-client'
import { useValidationMessage } from '@/composables/utils/use-validation-message'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'

export function useRegisterFlow() {
    const config = useRuntimeConfig().public
    const translate = useValidationMessage()
    const t = useI18nText()
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
                        newErrors[path] = translate(err.message)
                    } else {
                        newErrors._form = translate(err.message)
                    }
                })
            }

            if (!vals.agreement) {
                newErrors.agreement = t('auth.register.agreementRequired')
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
                    setErrors({ ...errors.value, phone: translate(res.error.issues[0]?.message) || t('auth.common.invalidPhone') })
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
            toast.danger({ title: t('auth.common.featureDisabled'), description: t('auth.register.smsDisabled'), duration: 3000 })
            return
        }
        params.mode = mode
        activeTab.value = mode
        setErrors({})
        const hasCaptchaToken = captcha.value ? Boolean(unref(captcha.value.token)) : false
        if (hasCaptchaToken) {
            captcha.value?.reset()
        }
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
                        const errorMessage = error instanceof Error ? error.message : t('auth.common.captchaRequired')
                        errors.value.captcha = errorMessage
                        toast.warning({ title: t('auth.common.captchaNeeded'), description: errorMessage, duration: 2500 })
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
                        throw new Error(error.message || t('auth.register.failed'))
                    }
                } else if (activeTab.value === 'phone') {
                    const isVerified = await authClient.phoneNumber.verify({
                        phoneNumber: vals.phone,
                        code: vals.code,
                    })

                    if (!isVerified.data?.status) {
                        throw new Error(t('auth.register.phoneVerifyFailed'))
                    }

                    const updateData: any = {
                        name: vals.nickname,
                    }

                    if (usernameEnabled) {
                        updateData.username = vals.username?.trim()
                    }

                    const { error } = await authClient.updateUser(updateData)

                    if (error) {
                        throw new Error(error.message || t('auth.register.profileUpdateFailed'))
                    }
                }

                toast.success({
                    title: t('auth.register.success'),
                    description: activeTab.value === 'email' ? t('auth.register.successEmail') : t('auth.register.successPhone'),
                    duration: 2500,
                })

                setTimeout(() => {
                    navigateTo(`/login?mode=${activeTab.value}`)
                }, 500)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.register.unknownError')
                toast.danger({ title: t('auth.register.failed'), description: errorMessage, duration: 5000 })
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
