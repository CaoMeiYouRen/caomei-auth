import { publicPaths } from '@/utils/shared/public-paths'
import { authClient } from '@/lib/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
    // if (to.path === '/') { // 首页路由直接放通
    //     return
    // }
    // 白名单路径
    if (publicPaths.some((path) => to.path === path)) {
        return true
    }
    if (to.path.startsWith('/api/auth') && !to.path.startsWith('/api/auth/admin')) {
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
        // 重定向到登录页面
        if (to.path !== '/login') {
            return navigateTo('/login')
        }
        return false
    }
    // 如果访问管理界面，检查用户是否为管理员
    if (to.path.startsWith('/api/auth/admin') || to.path.startsWith('/admin')) {
        if (!session.value.user?.role?.includes('admin')) {
            // 如果不是管理员，拒绝访问
            return false
        }
        return true
    }
    // 如果是管理员，允许访问
    return true

})
