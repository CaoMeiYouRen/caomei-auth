import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { resolveCaptchaToken, type CaptchaExpose } from '@/utils/captcha'
import { sendEmailOtpService, sendPhoneOtpService } from '@/utils/otp-service'

export function useEmailOtp() {
    const toast = useToast()
    const sending = ref(false)

    const send = async (
        email: string,
        type: 'forget-password' | 'sign-in' | 'email-verification',
        captchaRef?: Ref<CaptchaExpose | null>,
        validate?: () => boolean,
        onError?: (field: string, msg: string) => void,
    ) => {
        if (validate && !validate()) {
            return false
        }

        sending.value = true
        let cooldown = false
        try {
            let token: string | undefined
            if (captchaRef) {
                try {
                    const res = await resolveCaptchaToken(captchaRef)
                    if (res) {
                        token = res.token
                    }
                    if (onError) {
                        onError('captcha', '')
                    }
                } catch (e: any) {
                    const msg = e.message || '验证码错误'
                    if (onError) {
                        onError('captcha', msg)
                    }
                    toast.add({ severity: 'warn', summary: '验证码', detail: msg })
                    return false
                }
            }

            cooldown = true
            const { error } = await sendEmailOtpService(email, type, token)
            if (error) {
                throw new Error(error.message)
            }

            toast.add({ severity: 'success', summary: '发送成功', detail: '请查收邮件' })
            return true
        } catch (e: any) {
            toast.add({ severity: 'error', summary: '发送失败', detail: e.message })
            return false
        } finally {
            if (cooldown) {
                setTimeout(() => {
                    sending.value = false
                }, 60000)
            } else {
                sending.value = false
            }
            captchaRef?.value?.reset()
        }
    }

    return {
        sending,
        send,
    }
}

export function usePhoneOtp() {
    const toast = useToast()
    const sending = ref(false)

    const send = async (
        phone: string,
        type: 'forget-password' | 'sign-in' | 'phone-verification',
        captchaRef?: Ref<CaptchaExpose | null>,
        validate?: () => boolean,
        onError?: (field: string, msg: string) => void,
    ) => {
        if (validate && !validate()) {
            return false
        }

        sending.value = true
        let cooldown = false
        try {
            let token: string | undefined
            if (captchaRef) {
                try {
                    const res = await resolveCaptchaToken(captchaRef)
                    if (res) {
                        token = res.token
                    }
                    if (onError) {
                        onError('captcha', '')
                    }
                } catch (e: any) {
                    const msg = e.message || '验证码错误'
                    if (onError) {
                        onError('captcha', msg)
                    }
                    toast.add({ severity: 'warn', summary: '验证码', detail: msg })
                    return false
                }
            }

            cooldown = true
            const { error } = await sendPhoneOtpService(phone, type, token)
            if (error) {
                throw new Error(error.message)
            }

            toast.add({ severity: 'success', summary: '发送成功', detail: '请查收短信' })
            return true
        } catch (e: any) {
            toast.add({ severity: 'error', summary: '发送失败', detail: e.message })
            return false
        } finally {
            if (cooldown) {
                setTimeout(() => {
                    sending.value = false
                }, 60000)
            } else {
                sending.value = false
            }
            captchaRef?.value?.reset()
        }
    }

    return {
        sending,
        send,
    }
}
