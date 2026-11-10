import type { H3Event } from 'h3'
import { getUserSession } from './get-user-session'
import { hasAdminRole } from './admin-role-sync'
import { getDemoConfig } from './demo-data-generator'
import { createLocalizedError } from './i18n'
import { DEMO_MODE } from '@/utils/shared/env'

export async function checkAdmin(event: H3Event) {
    const session = await getUserSession(event)
    if (!session?.userId) {
        throw await createLocalizedError(event, { statusCode: 401, key: 'errors.auth.unauthorized' })
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
        throw await createLocalizedError(event, { statusCode: 403, key: 'errors.auth.demoAdminRequired' })
    }

    if (!hasAdminRole(session.session.user?.role)) {
        // 如果不是管理员用户，返回无权限访问
        throw await createLocalizedError(event, { statusCode: 403, key: 'errors.auth.forbidden' })
    }

    return {
        status: 200,
        success: true,
        data: session,
        demoMode: false,
    }
}
