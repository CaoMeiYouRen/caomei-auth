import { publicPaths } from '@/utils/shared/public-paths'
import { authClient } from '@/lib/auth-client'
import { stripLocalePrefix } from '@/i18n/config/locale-registry'

export default defineNuxtRouteMiddleware(async (to) => {
    const localePath = useLocalePath()
    // 路由守卫按业务路径判断，避免 `/en-US/...` 被当成未登录访问私有页
    const pathname = stripLocalePrefix(to.path)

    // 白名单路径
    if (publicPaths.some((path) => pathname === path)) {
        return true
    }
    if (pathname.startsWith('/api/auth') && !pathname.startsWith('/api/auth/admin')) {
        return true
    }
    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))
    // 检查用户是否登录
    if (!session.value) {
        // 重定向到当前语言对应的登录页
        const loginPath = localePath('/login')
        if (to.path !== loginPath) {
            return navigateTo(loginPath)
        }
        return false
    }
    // 如果访问管理界面，检查用户是否为管理员
    if (pathname.startsWith('/api/auth/admin') || pathname.startsWith('/admin')) {
        if (!session.value.user?.role?.includes('admin')) {
            // 如果不是管理员，拒绝访问
            return false
        }
        return true
    }
    // 如果是管理员，允许访问
    return true
})
