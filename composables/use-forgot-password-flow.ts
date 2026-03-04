import { ref, onMounted, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import {
    forgotPasswordEmailFormSchema,
    forgotPasswordPhoneFormSchema,
    resetPasswordFormSchema,
} from '@/utils/shared/schemas'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import type { CaptchaExpose } from '@/utils/web/captcha'

// Helper function to get first Zod error
function getFirstZodError(result: { success: boolean, error?: { issues: { message: string }[] } }): string | null {
    if (result.success) { return null }
    return result.error?.issues[0]?.message || '校验失败'
}

export function useForgotPasswordFlow() {
    const config = useRuntimeConfig().public
    const phoneEnabled = config.phoneEnabled

    const email = ref('')
    const phone = ref('')
    const emailCode = ref('')
    const phoneCode = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const errors = ref<Record<string, string>>({})
    const toast = useToast()
    const captcha = ref<CaptchaExpose | null>(null)

    // 使用 useUrlSearchParams 获取 URL 参数
    const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
    const activeTab = ref<'email' | 'phone'>('email')

    onMounted(() => {
        // 如果短信功能未启用，强制使用邮箱方式
        if (!phoneEnabled) {
            activeTab.value = 'email'
            params.mode = 'email'
            return
        }
        // 支持通过 query 传递初始 tab
        if (params.mode === 'phone') {
            activeTab.value = 'phone'
        } else {
            activeTab.value = 'email'
        }
        params.mode = activeTab.value
    })

    const { send: sendEmailOtp, sending: emailCodeSending } = useEmailOtp()
    const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

    const canSendEmailCode = computed(() => !!(email.value.trim() && emailSchema.safeParse(email.value).success && !errors.value.email))

    const canSendPhoneCode = computed(() => !!(phone.value.trim() && phoneSchema.safeParse(phone.value).success && !errors.value.phone))

    const sendEmailCode = async () => {
        await sendEmailOtp(
            email.value,
            'forget-password',
            captcha,
            () => {
                const res = emailSchema.safeParse(email.value)
                if (!res.success) {
                    errors.value.email = res.error.issues[0]?.message || '请输入有效的邮箱地址'
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
            'forget-password',
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

    // 切换找回密码模式并更新 URL
    const changeMode = (mode: 'email' | 'phone') => {
        activeTab.value = mode
        params.mode = mode
    }

    async function resetPassword() {
        errors.value = {}

        // 校验邮箱/手机号和验证码
        if (activeTab.value === 'email') {
            const result = forgotPasswordEmailFormSchema.safeParse({
                email: email.value,
                code: emailCode.value,
            })
            if (!result.success) {
                const errorMsg = getFirstZodError(result)
                if (errorMsg) {
                    const path = result.error.issues[0]?.path[0] as string
                    errors.value[path] = errorMsg
                }
                return
            }
        } else if (activeTab.value === 'phone') {
            const result = forgotPasswordPhoneFormSchema.safeParse({
                phone: phone.value,
                code: phoneCode.value,
            })
            if (!result.success) {
                const errorMsg = getFirstZodError(result)
                if (errorMsg) {
                    const path = result.error.issues[0]?.path[0] as string
                    errors.value[path] = errorMsg
                }
                return
            }
        }

        // 使用 Zod schema 校验密码
        const passwordResult = resetPasswordFormSchema.safeParse({
            newPassword: newPassword.value,
            confirmPassword: confirmPassword.value,
        })
        if (!passwordResult.success) {
            const errorMsg = getFirstZodError(passwordResult)
            if (errorMsg) {
                const path = passwordResult.error.issues[0]?.path[0] as string
                errors.value[path] = errorMsg
            }
            return
        }

        try {
            if (activeTab.value === 'email') {
                const { error } = await authClient.emailOtp.resetPassword({
                    email: email.value,
                    otp: emailCode.value,
                    password: newPassword.value,
                })
                if (error) {
                    throw new Error(error.message || '密码重置失败')
                }
            } else if (activeTab.value === 'phone') {
                const isVerified = await authClient.phoneNumber.resetPassword({
                    otp: phoneCode.value,
                    phoneNumber: phone.value,
                    newPassword: newPassword.value,
                })
                if (!isVerified.data?.status) {
                    throw new Error('密码重置失败')
                }
            }
            toast.add({ severity: 'success', summary: '密码重置成功', detail: '请使用新密码登录', life: 2500 })
            setTimeout(() => {
                navigateTo(`/login?mode=${activeTab.value}`)
            }, 1500)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '密码重置失败'
            toast.add({
                severity: 'error',
                summary: '重置失败',
                detail: errorMessage,
                life: 5000,
            })
        }
    }

    return {
        email,
        phone,
        emailCode,
        phoneCode,
        newPassword,
        confirmPassword,
        errors,
        activeTab,
        captcha,
        emailCodeSending,
        phoneCodeSending,
        phoneEnabled,
        canSendEmailCode,
        canSendPhoneCode,
        sendEmailCode,
        sendPhoneCode,
        changeMode,
        resetPassword,
    }
}
