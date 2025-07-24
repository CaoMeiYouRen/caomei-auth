import type { H3Event } from 'h3'
import { getUserSession } from './get-user-session'

export async function checkAdmin(event: H3Event) {
    const session = await getUserSession(event)
    if (!session?.userId) {
        throw createError({ statusCode: 401, message: '未登录用户' })
    }

    if (!session.session.user?.role?.includes('admin')) {
        // 如果不是管理员用户，返回无权限访问
        throw createError({ statusCode: 403, message: '无权限访问' })
    }

    return {
        status: 200,
        success: true,
        data: session,
    }
}
