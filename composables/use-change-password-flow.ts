import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@/composables/core/use-form'
import { changePasswordFormSchema } from '@/utils/shared/schemas'

export function useChangePasswordFlow() {
    const toast = useToast()
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
                await authClient.changePassword({
                    newPassword: vals.newPassword,
                    currentPassword: vals.currentPassword,
                    revokeOtherSessions: revokeOtherSessions.value,
                })
                toast.add({ severity: 'success', summary: '密码修改成功', detail: '请使用新密码登录', life: 2500 })
                setTimeout(() => {
                    window.location.href = '/login'
                }, 1500)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '密码修改时发生未知错误'
                toast.add({
                    severity: 'error',
                    summary: '修改失败',
                    detail: errorMessage,
                    life: 5000,
                })
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
