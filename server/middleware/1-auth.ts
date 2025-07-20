import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })
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
})
