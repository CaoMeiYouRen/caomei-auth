import { ref, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import {
    quickLoginEmailFormSchema,
    quickLoginPhoneFormSchema,
} from '@/utils/shared/schemas'
import { useEmailOtp, usePhoneOtp } from '@/composables/use-otp'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'
import { useValidationMessage } from '@/composables/utils/use-validation-message'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { navigateAfterLoginWithDelay } from '@/utils/web/navigation'
import type { CaptchaExpose } from '@/utils/web/captcha'

// Helper function to get first Zod error
function getFirstZodError(
    result: { success: boolean, error?: { issues: { message: string }[] } },
    translate?: (message?: string | null) => string,
    fallback = '',
): string | null {
    if (result.success) { return null }
    const message = result.error?.issues[0]?.message
    const translated = translate ? translate(message) : resolveValidationMessage(message)
    return translated || fallback || message || null
}

export function useQuickLoginFlow() {
    // 配置
    const config = useRuntimeConfig().public
    const translate = useValidationMessage()
    const t = useI18nText()
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
                errors.value.email = getFirstZodError(result, translate, t('auth.common.invalidEmail')) ?? t('auth.common.invalidEmail')
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
                errors.value.phone = getFirstZodError(result, translate, t('auth.common.invalidPhone')) ?? t('auth.common.invalidPhone')
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
            toast.danger({ title: t('auth.common.featureDisabled'), description: t('auth.quickLogin.smsDisabled'), duration: 3000 })
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
            const message = getFirstZodError(result, translate, t('auth.common.invalidEmail')) ?? t('auth.common.invalidEmail')
            errors.value.email = message
            toast.danger({ title: t('auth.common.sendFailed'), description: message, duration: 5000 })
            return false
        }

        const success = await sendEmailCode()

        if (success) {
            toast.success({ title: t('auth.quickLogin.codeSentTitle'), description: t('auth.quickLogin.codeSentEmail'), duration: 3000 })
            return true
        }

        if (!errors.value.email) {
            errors.value.email = errors.value.captcha || t('auth.quickLogin.codeSendFailed')
        }
        return false
    }

    const sendPhoneVerificationCode = async () => {
        errors.value.phone = ''

        const result = phoneSchema.safeParse(phone.value)
        if (!result.success) {
            const message = getFirstZodError(result, translate, t('auth.common.invalidPhone')) ?? t('auth.common.invalidPhone')
            errors.value.phone = message
            toast.danger({ title: t('auth.common.sendFailed'), description: message, duration: 5000 })
            return false
        }

        const success = await sendPhoneCode()

        if (success) {
            toast.success({ title: t('auth.quickLogin.codeSentTitle'), description: t('auth.quickLogin.codeSentPhone'), duration: 3000 })
            return true
        }

        if (!errors.value.phone) {
            errors.value.phone = errors.value.captcha || t('auth.quickLogin.codeSendFailed')
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
            const errorMsg = getFirstZodError(result, translate, t('auth.common.validationFailed'))
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
                throw new Error(error.message || t('auth.common.loginFailed'))
            }

            toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.quickLogin.welcomeBack'), duration: 2000 })

            navigateAfterLoginWithDelay()
        } catch (error: any) {
            const message = error.message || t('auth.quickLogin.invalidCode')
            errors.value.emailCode = message
            toast.danger({ title: t('auth.common.loginFailed'), description: message, duration: 5000 })
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
            const errorMsg = getFirstZodError(result, translate, t('auth.common.validationFailed'))
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
                throw new Error(error.message || t('auth.common.loginFailed'))
            }

            toast.success({ title: t('auth.common.loginSuccess'), description: t('auth.quickLogin.welcomeBack'), duration: 2000 })

            navigateAfterLoginWithDelay()
        } catch (error: any) {
            const message = error.message || t('auth.quickLogin.invalidCode')
            errors.value.phoneCode = message
            toast.danger({ title: t('auth.common.loginFailed'), description: message, duration: 5000 })
        } finally {
            isPhoneLoggingIn.value = false
        }
    }

    const handleEmailCodeInput = () => {
        // 表单组件换为 CaomeiInput 后，maxlength 落在外层容器上不再生效，这里补齐 6 位上限
        if (emailCode.value.length > 6) {
            emailCode.value = emailCode.value.slice(0, 6)
        }
        if (errors.value.emailCode) {
            errors.value.emailCode = ''
        }
    }

    const handlePhoneCodeInput = () => {
        if (phoneCode.value.length > 6) {
            phoneCode.value = phoneCode.value.slice(0, 6)
        }
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
