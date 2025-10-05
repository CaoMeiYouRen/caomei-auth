import type { Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/captcha'

export function useSendEmailCode({ email, type, validateEmail, errors, sending, captcha }: { email: Ref<string>, type: 'forget-password' | 'sign-in' | 'email-verification', validateEmail: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>, captcha?: Ref<CaptchaExpose | null> }) {
    const toast = useToast()
    return async () => {
        if (!validateEmail(email.value)) {
            errors.value.email = '请输入有效的邮箱地址'
            return false
        }
        let cooldown = false
        let resolvedCaptcha: ResolvedCaptchaToken | null = null
        try {
            sending.value = true
            try {
                resolvedCaptcha = await resolveCaptchaToken(captcha as Ref<CaptchaExpose | null>)
                errors.value.captcha = ''
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
                errors.value.captcha = errorMessage
                toast.add({ severity: 'warn', summary: '验证码未完成', detail: errorMessage, life: 2000 })
                return false
            }
            cooldown = true
            const headers: HeadersInit = resolvedCaptcha ? { 'x-captcha-response': resolvedCaptcha.token } : {}
            const { data, error } = await authClient.emailOtp.sendVerificationOtp({
                email: email.value,
                type,
                fetchOptions: {
                    headers,
                },
            })
            if (error) {
                throw new Error(error.message || '验证码发送失败')
            }
            toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的邮箱', life: 2000 })
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '验证码发送时发生未知错误'
            toast.add({ severity: 'error', summary: '发送失败', detail: errorMessage, life: 2000 })
            return false
        } finally {
            if (cooldown) {
                setTimeout(() => {
                    sending.value = false
                }, 60000)
            } else {
                sending.value = false
            }
            resolvedCaptcha?.instance.reset()
        }
    }
}

export function useSendPhoneCode({ phone, type, validatePhone, errors, sending, captcha }: { phone: Ref<string>, type: 'forget-password' | 'sign-in' | 'phone-verification', validatePhone: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>, captcha?: Ref<CaptchaExpose | null> }) {
    const toast = useToast()
    return async () => {
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            return false
        }
        let cooldown = false
        let resolvedCaptcha: ResolvedCaptchaToken | null = null
        try {
            sending.value = true
            try {
                resolvedCaptcha = await resolveCaptchaToken(captcha as Ref<CaptchaExpose | null>)
                errors.value.captcha = ''
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
                errors.value.captcha = errorMessage
                toast.add({ severity: 'warn', summary: '验证码未完成', detail: errorMessage, life: 2000 })
                return false
            }
            const fetchOptions = {
                headers: (resolvedCaptcha ? { 'x-captcha-response': resolvedCaptcha.token } : {}) as HeadersInit,
            }
            cooldown = true
            const { data, error } = await (async () => {
                switch (type) {
                    case 'forget-password':
                        return authClient.phoneNumber.requestPasswordReset({
                            phoneNumber: phone.value,
                            fetchOptions,
                        })
                    case 'sign-in': // 允许使用手机号码注册
                        return authClient.phoneNumber.sendOtp({
                            phoneNumber: phone.value,
                            fetchOptions,
                        })
                    case 'phone-verification': // 通过验证之后就可以登录
                        return authClient.phoneNumber.sendOtp({
                            phoneNumber: phone.value,
                            fetchOptions,
                        })
                    default:
                        throw new Error('不支持的验证码类型')
                }
            })()
            if (error) {
                throw new Error(error.message || '验证码发送失败')
            }
            toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的短信', life: 2000 })
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '验证码发送时发生未知错误'
            toast.add({ severity: 'error', summary: '发送失败', detail: errorMessage, life: 2000 })
            return false
        } finally {
            if (cooldown) {
                setTimeout(() => {
                    sending.value = false
                }, 60000)
            } else {
                sending.value = false
            }
            resolvedCaptcha?.instance.reset()
        }
    }
}
