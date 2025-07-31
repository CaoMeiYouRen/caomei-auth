import { checkAndSyncAdminRole, checkAndSyncAdminRoleWithUser, setUserAdminRole, removeUserAdminRole } from '@/server/utils/admin-role-sync'
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

    // 获取当前用户的完整信息以验证管理员权限
    const userRepo = dataSource.getRepository(User)
    const currentUser = await userRepo.findOne({ where: { id: session.user.id } })

    if (!currentUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: '当前用户不存在',
        })
    }

    // 验证用户是否有管理员权限（使用已有的用户对象优化）
    const isCurrentUserAdmin = await checkAndSyncAdminRoleWithUser(currentUser)
    if (!isCurrentUserAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            message: '仅管理员可以执行此操作',
        })
    }

    const body = await readBody(event)
    const { userId, action } = body

    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: '缺少必要参数 userId',
        })
    }

    if (!action || !['sync', 'add', 'remove'].includes(action)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'action 参数必须是 sync、add 或 remove 之一',
        })
    }

    try {
        let result: boolean
        let message: string

        switch (action) {
            case 'sync':
                // 对于同步操作，如果目标用户和当前用户是同一个，直接使用已有的用户对象
                if (userId === session.user.id) {
                    result = await checkAndSyncAdminRoleWithUser(currentUser)
                } else {
                    result = await checkAndSyncAdminRole(userId)
                }
                message = result ? '管理员角色同步成功' : '同步失败，用户不存在或非管理员'
                break
            case 'add':
                result = await setUserAdminRole(userId)
                message = result ? '管理员角色添加成功' : '添加失败，用户不存在'
                break
            case 'remove':
                // 防止管理员移除自己的权限
                if (userId === session.user.id) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'Bad Request',
                        message: '不能移除自己的管理员权限',
                    })
                }
                result = await removeUserAdminRole(userId, session.user.id)
                message = result ? '管理员角色移除成功' : '移除失败，用户不存在或操作被拒绝'
                break
            default:
                throw new Error('不支持的操作')
        }

        return {
            success: result,
            message,
            data: {
                userId,
                action,
            },
        }
    } catch (error) {
        console.error('管理员角色操作失败:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: '管理员角色操作失败',
        })
    }
})
