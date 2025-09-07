import type { H3Event } from 'h3'
import { getUserSession } from './get-user-session'
import { getDemoConfig } from './demo-data-generator'
import { DEMO_MODE } from '@/utils/env'

export async function checkAdmin(event: H3Event) {
    const session = await getUserSession(event)
    if (!session?.userId) {
        throw createError({ statusCode: 401, message: '未登录用户' })
    }

    // Demo 模式下的特殊处理
    if (DEMO_MODE) {
        const demoConfig = getDemoConfig()
        // 检查是否为Demo管理员用户
        if (session.session.user?.name === demoConfig.adminUser.name) {
            return {
                status: 200,
                success: true,
                data: session,
                demoMode: true,
            }
        }
        // Demo 模式下非管理员用户也无权限
        throw createError({ statusCode: 403, message: 'Demo 模式：无管理员权限' })
    }

    if (!session.session.user?.role?.includes('admin')) {
        // 如果不是管理员用户，返回无权限访问
        throw createError({ statusCode: 403, message: '无权限访问' })
    }

    return {
        status: 200,
        success: true,
        data: session,
        demoMode: false,
    }
}
