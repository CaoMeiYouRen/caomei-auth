import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/public-paths'
import { checkAndSyncAdminRole } from '@/server/utils/admin-role-sync'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // 如果用户已登录，检查并同步管理员角色
    if (session?.user?.id) {
        try {
            await checkAndSyncAdminRole(session.user.id)
        } catch (error) {
            console.error('管理员角色同步失败:', error)
        }
    }

    // // 调试 OAuth 授权请求
    // if (event.path.startsWith('/api/auth/oauth2/')) {
    //     console.log('OAuth2 Request Debug:', {
    //         path: event.path,
    //         query: getQuery(event),
    //         method: event.method,
    //         hasSession: !!session,
    //         userAgent: getHeader(event, 'user-agent'),
    //     })
    // }

    // 白名单路径
    if (publicPaths.some((path) => event.path.startsWith(path))) {
        return
    }
    // console.log('event.path', event.path)
    if (event.path.startsWith('/api/auth/oauth2/register')) {
        if (!session?.user?.role?.includes('admin')) {
            // 如果不是管理员，拒绝访问
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: '仅管理员可以访问注册应用接口',
            })
        }
    }

    // 其他 auth API 路径的处理可以在这里添加
    // if (event.path.startsWith('/api/auth') && !event.path.startsWith('/api/auth/admin')) {
    //     // 预留的处理逻辑
    // }
})
