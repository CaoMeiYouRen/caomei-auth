import type { Ref } from 'vue'
import { useToast } from 'primevue/usetoast'

export function useSendEmailCode(email: Ref<string>, validateEmail: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>) {
    const toast = useToast()
    return () => {
        if (!validateEmail(email.value)) {
            errors.value.email = '请输入有效的邮箱地址'
            return
        }
        sending.value = true
        toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的邮箱', life: 2000 })
        setTimeout(() => {
            sending.value = false
        }, 60000)
    }
}

export function useSendPhoneCode(phone: Ref<string>, validatePhone: (v: string) => boolean, errors: Ref<Record<string, string>>, sending: Ref<boolean>) {
    const toast = useToast()
    return () => {
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            return
        }
        sending.value = true
        toast.add({ severity: 'info', summary: '验证码已发送', detail: '请查收您的短信', life: 2000 })
        setTimeout(() => {
            sending.value = false
        }, 60000)
    }
}
