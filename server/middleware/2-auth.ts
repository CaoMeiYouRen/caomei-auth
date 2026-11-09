import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'
import {
    isOAuthClientManagementAuthPath,
    isOAuthRegistrationAuthPath,
    normalizeAuthPath,
} from '@/utils/shared/auth-paths'
import { isSsoManagementAuthPath } from '@/utils/shared/sso-management-paths'
import { checkAndSyncAdminRoleWithUser, isUserAdmin } from '@/server/utils/admin-role-sync'
import { createLocalizedError } from '@/server/utils/i18n'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // h3 的 event.path 保留 req.url 的点段，而 better-auth 路由按 WHATWG URL 折叠点段。
    // 所有基于路径的鉴权判断都必须使用归一化结果，否则 `/api/auth/oauth2/./register`
    // 会在路由层命中端点却绕过门禁（GHSA-2r7m-492j-p8xm）。
    const normalizedPath = normalizeAuthPath(event.path)

    // 白名单路径（同样使用归一化路径，避免 `/login/../api/auth/...` 提前放行）
    if (publicPaths.some((path) => normalizedPath.startsWith(path))) {
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
    if (isOAuthRegistrationAuthPath(normalizedPath)) {
        // 使用轻量级的权限检查，避免额外的数据库查询
        if (!session?.user || !isUserAdmin(session.user, session.user.id)) {
            // 如果不是管理员，拒绝访问
            throw await createLocalizedError(event, {
                statusCode: 403,
                statusMessage: 'Forbidden',
                key: 'errors.auth.oauthRegisterAdminOnly',
            })
        }
    }

    // OAuth 客户端自助管理端点的纵深防御：这些上游端点只校验登录态，
    // `/oauth2/create-client` 可被任意会话（含匿名）用于注册攻击者 redirect_uri 的客户端。
    // 端点本身已在 AUTH_DISABLED_PATHS 关闭，此处确保 disabledPaths 被误删时仍拦截。
    // 详见 utils/shared/auth-paths.ts 与 GHSA-2r7m-492j-p8xm。
    if (isOAuthClientManagementAuthPath(normalizedPath)) {
        if (!session?.user || !isUserAdmin(session.user, session.user.id)) {
            if (session?.user) {
                logger.warn('非管理员访问 OAuth 客户端管理接口', {
                    userId: session.user.id,
                    path: event.path,
                })
            }
            throw await createLocalizedError(event, {
                statusCode: 403,
                statusMessage: 'Forbidden',
                key: 'errors.auth.oauthManageAdminOnly',
            })
        }
    }

    // SSO 提供商管理端点的纵深防御：即使 disabledPaths 被误删，也不允许普通用户访问。
    // 详见 utils/shared/sso-management-paths.ts 与 GHSA-785j-54p4-vxw9。
    if (isSsoManagementAuthPath(normalizedPath)) {
        if (!session?.user || !isUserAdmin(session.user, session.user.id)) {
            // 已登录用户的越权尝试需要留痕；未登录命中多为探测，避免日志放大。
            if (session?.user) {
                logger.warn('非管理员访问 SSO 提供商管理接口', {
                    userId: session.user.id,
                    path: event.path,
                })
            }
            throw await createLocalizedError(event, {
                statusCode: 403,
                statusMessage: 'Forbidden',
                key: 'errors.auth.ssoManageAdminOnly',
            })
        }
    }

    // 其他 auth API 路径的处理可以在这里添加
    // if (event.path.startsWith('/api/auth') && !event.path.startsWith('/api/auth/admin')) {
    //     // 预留的处理逻辑
    // }
})
