import { isUserAdmin, checkAndSyncAdminRoleWithUser } from '@/server/utils/admin-role-sync'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'

export default defineEventHandler(async (event) => {
    // 验证用户是否已登录
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: '用户未登录',
        })
    }

    try {
        // 获取用户详细信息
        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: session.user.id } })

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: '用户不存在',
            })
        }

        // 检查用户是否为管理员（轻量级检查，不进行数据库同步）
        const isAdminByCheck = isUserAdmin(user, session.user.id)

        // 使用已有的用户对象执行同步操作，避免重复查询
        const isSyncedAdmin = await checkAndSyncAdminRoleWithUser(user)

        return {
            success: true,
            data: {
                userId: session.user.id,
                userRole: user.role,
                isAdmin: isSyncedAdmin,
                isAdminByRole: user.role?.includes('admin') || false,
                isAdminByConfig: isAdminByCheck,
                adminStatus: {
                    syncRequired: isAdminByCheck !== (user.role?.includes('admin') || false),
                    lastSyncResult: isSyncedAdmin,
                },
            },
        }
    } catch (error) {
        console.error('获取管理员状态失败:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: '获取管理员状态失败',
        })
    }
})
