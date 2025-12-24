import { authClient } from '@/lib/auth-client'

export async function useIndexFlow() {
    // 使用 SSR 渲染，解决界面刷新时的 UI 重渲染问题
    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

    function toLogin() {
        navigateTo('/login')
    }

    function toQuickLogin() {
        navigateTo('/quick-login')
    }

    function toRegister() {
        navigateTo('/register')
    }

    function toForgotPassword() {
        navigateTo('/forgot-password')
    }

    function toProfile() {
        navigateTo('/profile')
    }

    function toAdmin() {
        navigateTo('/admin/users')
    }

    return {
        session,
        toLogin,
        toQuickLogin,
        toRegister,
        toForgotPassword,
        toProfile,
        toAdmin,
    }
}
