import { auth } from '@/lib/auth'

/**
 * 获取当前请求的 session 和 userId，未认证时抛出 401
 */
export async function getUserSession(event: any) {
    const session = await auth.api.getSession({
        headers: event.headers,
    })
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: '未登录用户' })
    }
    return {
        session,
        user: session.user,
        userId: session.user.id,
    }
}
