import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/public-paths'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // 调试 OAuth 授权请求
    if (event.path.startsWith('/api/auth/oauth2/')) {
        console.log('OAuth2 Request Debug:', {
            path: event.path,
            query: getQuery(event),
            method: event.method,
            hasSession: !!session,
            userAgent: getHeader(event, 'user-agent'),
        })
    }

    // 白名单路径
    if (publicPaths.some((path) => event.path === path)) {
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
    if (event.path.startsWith('/api/auth') && !event.path.startsWith('/api/auth/admin')) {
        
    }
})
