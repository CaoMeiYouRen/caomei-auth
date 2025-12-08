import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

export function useLogout() {
    const toast = useToast()
    const loading = ref(false)

    const logout = async (redirect = '/login') => {
        loading.value = true
        try {
            await authClient.signOut({})
            toast.add({ severity: 'success', summary: '登出成功', life: 2000 })
            if (redirect) {
                navigateTo(redirect)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登出时发生未知错误'
            toast.add({ severity: 'error', summary: '登出失败', detail: errorMessage, life: 5000 })
        } finally {
            loading.value = false
        }
    }

    return { logout, loading }
}
