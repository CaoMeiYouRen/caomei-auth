import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { validatePasswordForm } from '@/utils/password-validator'

export function useChangePasswordFlow() {
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const errors = ref<Record<string, string>>({})
    const toast = useToast()
    const revokeOtherSessions = ref(true)

    async function changePassword() {
        errors.value = {}

        // 使用新的密码验证工具函数
        const validationErrors = validatePasswordForm({
            currentPassword: currentPassword.value,
            password: newPassword.value,
            confirmPassword: confirmPassword.value,
        })

        if (Object.keys(validationErrors).length > 0) {
            errors.value = validationErrors
            return
        }

        try {
            await authClient.changePassword({
                newPassword: newPassword.value,
                currentPassword: currentPassword.value,
                revokeOtherSessions: revokeOtherSessions.value,
            })
            toast.add({ severity: 'success', summary: '密码修改成功', detail: '请使用新密码登录', life: 2500 })
            // 可以添加跳转到登录页或其他操作
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
    }

    return {
        currentPassword,
        newPassword,
        confirmPassword,
        errors,
        revokeOtherSessions,
        changePassword,
    }
}
