import { ref, computed } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@/composables/core/use-form'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { changePasswordFormSchema } from '@/utils/shared/schemas'
import { throwIfAuthError } from '@/utils/shared/api-error'

export function useChangePasswordFlow() {
    const toast = useToast()
    const t = useI18nText()
    const revokeOtherSessions = ref(true)

    const { values, errors, submitting, handleSubmit, setField } = useForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        zodSchema: changePasswordFormSchema,
    })

    // Computed proxies for backward compatibility
    const currentPassword = computed({ get: () => values.value.currentPassword, set: (v) => setField('currentPassword', v) })
    const newPassword = computed({ get: () => values.value.newPassword, set: (v) => setField('newPassword', v) })
    const confirmPassword = computed({ get: () => values.value.confirmPassword, set: (v) => setField('confirmPassword', v) })

    async function changePassword() {
        await handleSubmit(async (vals) => {
            try {
                const response = await authClient.changePassword({
                    newPassword: vals.newPassword,
                    currentPassword: vals.currentPassword,
                    revokeOtherSessions: revokeOtherSessions.value,
                })
                // better-auth 的 4xx / 5xx 返回 `{ error }` 而不抛错，必须显式校验，避免误报成功
                throwIfAuthError(response, t('auth.changePassword.unknownError'))
                toast.success({ title: t('auth.changePassword.success'), description: t('auth.common.useNewPassword'), duration: 2500 })
                setTimeout(() => {
                    window.location.href = '/login'
                }, 1500)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('auth.changePassword.unknownError')
                toast.danger({ title: t('auth.changePassword.failed'), description: errorMessage, duration: 5000 })
            }
        })
    }

    return {
        currentPassword,
        newPassword,
        confirmPassword,
        errors,
        revokeOtherSessions,
        changePassword,
        submitting,
    }
}
