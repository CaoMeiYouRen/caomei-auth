import type { Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

export function useSendEmailCode(email: Ref<string>, type: 'forget-password' | 'sign-in' | 'email-verification', validateEmail: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>) {
    const toast = useToast()
    return async () => {
        if (!validateEmail(email.value)) {
            errors.value.email = '请输入有效的邮箱地址'
            return
        }
        try {
            sending.value = true
            const { data, error } = await authClient.emailOtp.sendVerificationOtp({
                email: email.value,
                type,
            })
            if (error) {
                throw new Error(error.message || '验证码发送失败')
            }
            toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的邮箱', life: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '验证码发送时发生未知错误'
            toast.add({ severity: 'error', summary: '发送失败', detail: errorMessage, life: 2000 })
        } finally {
            setTimeout(() => {
                sending.value = false
            }, 60000)
        }
    }
}

export function useSendPhoneCode(phone: Ref<string>, type: 'forget-password' | 'sign-in' | 'phone-verification', validatePhone: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>) {
    const toast = useToast()
    return async () => {
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            return
        }
        try {
            sending.value = true
            const { data, error } = await (async () => {
                switch (type) {
                    case 'forget-password':
                        return authClient.phoneNumber.forgetPassword({
                            phoneNumber: phone.value,
                        })
                    case 'sign-in': // 允许使用手机号码注册
                        return authClient.phoneNumber.sendOtp({
                            phoneNumber: phone.value,
                        })
                    case 'phone-verification': // 通过验证之后就可以登录
                        return authClient.phoneNumber.sendOtp({
                            phoneNumber: phone.value,
                        })
                    default:
                        throw new Error('不支持的验证码类型')
                }
            })()
            if (error) {
                throw new Error(error.message || '验证码发送失败')
            }
            toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的短信', life: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '验证码发送时发生未知错误'
            toast.add({ severity: 'error', summary: '发送失败', detail: errorMessage, life: 2000 })
        } finally {
            setTimeout(() => {
                sending.value = false
            }, 60000)
        }
    }
}
