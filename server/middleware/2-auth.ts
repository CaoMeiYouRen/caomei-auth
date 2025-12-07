import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'
import { checkAndSyncAdminRoleWithUser, isUserAdmin } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // 白名单路径
    if (publicPaths.some((path) => event.path.startsWith(path))) {
        return
    }

    // 如果用户已登录，检查并同步管理员角色
    if (session?.user?.id) {
        try {
            await checkAndSyncAdminRoleWithUser(session.user as any)
        } catch (error) {
            logger.error('管理员角色同步失败', {
                error: error instanceof Error ? error.message : String(error),
                userId: session.user.id,
                path: event.path,
                stack: error instanceof Error ? error.stack : undefined,
            })
        }
    }
    // console.log('event.path', event.path)
    if (event.path.startsWith('/api/auth/oauth2/register')) {
        // 使用轻量级的权限检查，避免额外的数据库查询
        if (!session?.user || !isUserAdmin(session.user, session.user.id)) {
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
