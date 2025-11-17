import { authClient } from '@/lib/auth-client'
import { navigateTo, useFetch } from '#imports'

type NavigateHandler = typeof navigateTo
type UseFetchHandler = typeof useFetch

let navigateHandler: NavigateHandler = navigateTo
let useFetchHandler: UseFetchHandler = useFetch

export function setNavigationDependencies(deps: {
    navigate?: NavigateHandler
    useFetch?: UseFetchHandler
} = {}) {
    if (deps.navigate) {
        navigateHandler = deps.navigate
    }

    if (deps.useFetch) {
        useFetchHandler = deps.useFetch
    }
}

export function resetNavigationDependencies() {
    navigateHandler = navigateTo
    useFetchHandler = useFetch
}

/**
 * 登录后的统一跳转逻辑
 * 如果是管理员，跳转到管理后台；否则跳转到个人中心
 */
export async function navigateAfterLogin() {
    try {
        // 获取当前用户会话
        const { data: session } = await authClient.useSession(useFetchHandler)

        // 检查用户是否为管理员
        if (session.value?.user?.role?.includes('admin')) {
            // 管理员跳转到用户管理页
            navigateHandler('/admin/users')
        } else {
            // 普通用户跳转到个人中心
            navigateHandler('/profile')
        }
    } catch (error) {
        // 如果获取会话失败，默认跳转到个人中心
        console.warn('获取用户会话失败，使用默认跳转:', error)
        navigateHandler('/profile')
    }
}

/**
 * 带延迟的登录后跳转
 * @param delay 延迟时间（毫秒），默认 1200ms
 */
export function navigateAfterLoginWithDelay(delay: number = 1200) {
    setTimeout(() => {
        navigateAfterLogin()
    }, delay)
}
