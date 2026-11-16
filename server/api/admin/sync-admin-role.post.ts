import { checkAndSyncAdminRole, checkAndSyncAdminRoleWithUser, setUserAdminRole, removeUserAdminRole } from '@/server/utils/admin-role-sync'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import logger from '@/server/utils/logger'
import { adminRoleSyncSchema } from '@/utils/shared/schemas'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

export default defineEventHandler(async (event) => {
    const { t } = await getServerI18n(event)

    // 验证用户是否已登录
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw await createLocalizedError(event, {
            statusCode: 401,
            key: 'errors.auth.unauthorized',
        })
    }

    // 获取当前用户的完整信息以验证管理员权限
    const userRepo = dataSource.getRepository(User)
    const currentUser = await userRepo.findOne({ where: { id: session.user.id } })

    if (!currentUser) {
        throw await createLocalizedError(event, {
            statusCode: 404,
            key: 'errors.admin.userNotFound',
        })
    }

    // 验证用户是否有管理员权限（使用已有的用户对象优化）
    const isCurrentUserAdmin = await checkAndSyncAdminRoleWithUser(currentUser)
    if (!isCurrentUserAdmin) {
        throw await createLocalizedError(event, {
            statusCode: 403,
            key: 'errors.admin.adminOnly',
        })
    }

    const body = await readBody(event)
    const validationResult = adminRoleSyncSchema.safeParse(body, { error: createZodErrorMap(t) })

    if (!validationResult.success) {
        throw createError({
            statusCode: 400,
            statusMessage: resolveValidationMessage(validationResult.error?.issues[0]?.message, t) || t('errors.admin.paramsInvalid'),
        })
    }

    const { userId, action } = validationResult.data

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
                message = result ? t('errors.admin.roleSyncSucceeded') : t('errors.admin.roleSyncFailedDescription')
                break
            case 'add':
                result = await setUserAdminRole(userId)
                message = result ? t('errors.admin.roleAddSucceeded') : t('errors.admin.roleAddFailed')
                break
            case 'remove':
                // 防止管理员移除自己的权限
                if (userId === session.user.id) {
                    throw await createLocalizedError(event, {
                        statusCode: 400,
                        key: 'errors.admin.cannotRemoveSelf',
                    })
                }
                result = await removeUserAdminRole(userId, session.user.id)
                message = result ? t('errors.admin.roleRemoveSucceeded') : t('errors.admin.roleRemoveFailed')
                break
            default:
                throw new Error(t('errors.admin.unsupportedAction'))
        }

        return {
            success: result,
            message,
            data: {
                userId,
                action,
            },
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }
        logger.error('Admin role operation failed', {
            error,
            userId,
            action,
        })
        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.admin.roleSyncFailed',
        })
    }
})
