import { ref, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import {
    quickLoginEmailFormSchema,
    quickLoginPhoneFormSchema,
} from '@/utils/shared/schemas'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import { navigateAfterLoginWithDelay } from '@/utils/web/navigation'
import type { CaptchaExpose } from '@/utils/web/captcha'

// Helper function to get first Zod error
function getFirstZodError(result: { success: boolean, error?: { issues: { message: string }[] } }): string | null {
    if (result.success) { return null }
    return result.error?.issues[0]?.message || '校验失败'
}

export function useQuickLoginFlow() {
    // 配置
    const config = useRuntimeConfig().public
    const phoneEnabled = config.phoneEnabled

    // 响应式数据
    const activeTab = ref<'email' | 'phone'>('email')

    // 邮箱相关
    const email = ref('')
    const emailCode = ref('')
    const isEmailLoggingIn = ref(false)

    // 手机相关
    const phone = ref('')
    const phoneCode = ref('')
    const isPhoneLoggingIn = ref(false)

    // 错误状态
    const errors = ref<Record<string, string>>({})

    // 发送验证码状态
    const captcha = ref<CaptchaExpose | null>(null)

    // 组件
    const toast = useToast()

    // 使用 URL 参数
    const params = useUrlSearchParams<{ tab: 'email' | 'phone' }>('history', { initialValue: { tab: 'email' } })

    // 邮箱验证码发送工具
    const { send: sendEmailOtp, sending: emailCodeSending } = useEmailOtp()
    const sendEmailCode = async () => await sendEmailOtp(
        email.value,
        'sign-in',
        captcha,
        () => {
            const result = emailSchema.safeParse(email.value)
            if (!result.success) {
                errors.value.email = getFirstZodError(result) || '请输入有效的邮箱地址'
                return false
            }
            return true
        },
        (field, msg) => {
            errors.value[field] = msg
        },
    )

    // 手机验证码发送工具
    const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()
    const sendPhoneCode = async () => await sendPhoneOtp(
        phone.value,
        'sign-in',
        captcha,
        () => {
            const result = phoneSchema.safeParse(phone.value)
            if (!result.success) {
                errors.value.phone = getFirstZodError(result) || '请输入有效的手机号'
                return false
            }
            return true
        },
        (field, msg) => {
            errors.value[field] = msg
        },
    )

    // 计算属性
    const canSendEmailCode = computed(() => Boolean(email.value.trim() && emailSchema.safeParse(email.value).success && !errors.value.email))

    const canSendPhoneCode = computed(() => Boolean(phone.value.trim() && phoneSchema.safeParse(phone.value).success && !errors.value.phone))

    // 方法
    const changeTab = (tab: 'email' | 'phone') => {
        // 如果短信功能未启用且尝试切换到手机登录，提示错误并阻止切换
        if (tab === 'phone' && !phoneEnabled) {
            toast.add({
                severity: 'error',
                summary: '功能未启用',
                detail: '短信功能未启用，请使用邮箱验证码登录',
                life: 3000,
            })
            return
        }

        params.tab = tab
        activeTab.value = tab

        // 清除错误状态
        errors.value = {}
        captcha.value?.reset()
    }

    const sendEmailVerificationCode = async () => {
        errors.value.email = ''

        const result = emailSchema.safeParse(email.value)
        if (!result.success) {
            const message = getFirstZodError(result) || '请输入有效的邮箱地址'
            errors.value.email = message
            toast.add({
                severity: 'error',
                summary: '发送失败',
                detail: message,
                life: 5000,
            })
            return false
        }

        const success = await sendEmailCode()

        if (success) {
            toast.add({
                severity: 'success',
                summary: '验证码已发送',
                detail: '验证码已发送到您的邮箱，请注意查收',
                life: 3000,
            })
            return true
        }

        if (!errors.value.email) {
            errors.value.email = errors.value.captcha || '验证码发送失败'
        }
        return false
    }

    const sendPhoneVerificationCode = async () => {
        errors.value.phone = ''

        const result = phoneSchema.safeParse(phone.value)
        if (!result.success) {
            const message = getFirstZodError(result) || '请输入有效的手机号'
            errors.value.phone = message
            toast.add({
                severity: 'error',
                summary: '发送失败',
                detail: message,
                life: 5000,
            })
            return false
        }

        const success = await sendPhoneCode()

        if (success) {
            toast.add({
                severity: 'success',
                summary: '验证码已发送',
                detail: '验证码已发送到您的手机，请注意查收',
                life: 3000,
            })
            return true
        }

        if (!errors.value.phone) {
            errors.value.phone = errors.value.captcha || '验证码发送失败'
        }
        return false
    }

    const loginWithEmail = async () => {
        errors.value = {}

        // 使用 Zod schema 校验
        const result = quickLoginEmailFormSchema.safeParse({
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

        try {
            isEmailLoggingIn.value = true
            const { error } = await authClient.signIn.emailOtp({
                email: email.value,
                otp: emailCode.value,
            })

            if (error) {
                throw new Error(error.message || '登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '欢迎回来！',
                life: 2000,
            })

            navigateAfterLoginWithDelay()
        } catch (error: any) {
            const message = error.message || '登录失败，请检查验证码是否正确'
            errors.value.emailCode = message
            toast.add({
                severity: 'error',
                summary: '登录失败',
                detail: message,
                life: 5000,
            })
        } finally {
            isEmailLoggingIn.value = false
        }
    }

    const loginWithPhone = async () => {
        errors.value = {}

        // 使用 Zod schema 校验
        const result = quickLoginPhoneFormSchema.safeParse({
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

        try {
            isPhoneLoggingIn.value = true
            const { error } = await authClient.phoneNumber.verify({
                phoneNumber: phone.value,
                code: phoneCode.value,
            })
            if (error) {
                throw new Error(error.message || '登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '欢迎回来！',
                life: 2000,
            })

            navigateAfterLoginWithDelay()
        } catch (error: any) {
            const message = error.message || '登录失败，请检查验证码是否正确'
            errors.value.phoneCode = message
            toast.add({
                severity: 'error',
                summary: '登录失败',
                detail: message,
                life: 5000,
            })
        } finally {
            isPhoneLoggingIn.value = false
        }
    }

    const handleEmailCodeInput = () => {
        if (errors.value.emailCode) {
            errors.value.emailCode = ''
        }
    }

    const handlePhoneCodeInput = () => {
        if (errors.value.phoneCode) {
            errors.value.phoneCode = ''
        }
    }

    return {
        activeTab,
        email,
        emailCode,
        isEmailLoggingIn,
        phone,
        phoneCode,
        isPhoneLoggingIn,
        errors,
        captcha,
        emailCodeSending,
        phoneCodeSending,
        phoneEnabled,
        canSendEmailCode,
        canSendPhoneCode,
        changeTab,
        sendEmailVerificationCode,
        sendPhoneVerificationCode,
        loginWithEmail,
        loginWithPhone,
        handleEmailCodeInput,
        handlePhoneCodeInput,
    }
}
