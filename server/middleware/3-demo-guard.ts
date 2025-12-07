/**
 * Demo 模式守卫中间件
 * 用于在 Demo 模式下拦截写操作，防止对数据的修改
 */

import logger from '@/server/utils/logger'
import { DEMO_MODE } from '@/utils/shared/env'

/**
 * 检查是否为 Demo 模式
 */
export function isDemoMode(): boolean {
    return DEMO_MODE
}

/**
 * 检查是否为写操作
 */
function isWriteOperation(method: string): boolean {
    const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    return writeMethods.includes(method.toUpperCase())
}

/**
 * 检查是否为管理后台 API
 */
function isAdminAPI(url: string): boolean {
    return url.startsWith('/api/admin/')
}

/**
 * 检查是否为危险的管理后台操作
 */
function isDangerousAdminOperation(url: string, method: string): boolean {
    // 管理后台的危险操作
    const dangerousAdminPaths = [
        // 用户管理 - 写操作
        '/api/admin/create-user',
        '/api/admin/update-user',
        '/api/admin/remove-user',
        '/api/admin/ban-user',
        '/api/admin/unban-user',
        '/api/admin/set-role',
        '/api/admin/set-user-password',
        '/api/admin/revoke-user-session',
        '/api/admin/revoke-user-sessions',
        '/api/admin/impersonate-user',

        // OAuth应用管理 - 写操作
        '/api/admin/oauth/applications', // POST
        // 以下使用 PUT/DELETE 的接口
        // '/api/admin/oauth/applications/[id]' 会在下面的方法检查中处理

        // SSO提供商管理 - 写操作
        '/api/admin/sso/providers', // POST
        // 以下使用 PUT/DELETE 的接口
        // '/api/admin/sso/providers/[id]' 会在下面的方法检查中处理

        // 系统同步操作
        '/api/admin/sync-admin-role',
    ]

    // 检查是否匹配危险路径（对于 POST 请求）
    if (method.toUpperCase() === 'POST') {
        return dangerousAdminPaths.some((path) => url.startsWith(path))
    }

    // 检查是否为 PUT/DELETE 方法的管理接口
    if (['PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
        return url.startsWith('/api/admin/')
    }

    return false
}

/**
 * 检查是否为被允许的 Demo 模式操作
 */
function isAllowedDemoOperation(url: string, method: string): boolean {
    // 允许的只读操作
    if (method.toUpperCase() === 'GET') {
        return true
    }

    // 允许的特定操作（Demo模式下可以体验的功能）
    const allowedOperations = [
        // 基础认证操作（允许登录演示账号）
        '/api/auth/sign-in/email',
        '/api/auth/sign-in/username',
        '/api/auth/sign-out',
        '/api/auth/get-session',
        '/api/auth/list-sessions',

        // 允许的社交登录验证（但不会真正创建账号）
        '/api/auth/sign-in/social',

        // 允许查看但不修改的操作
        '/api/auth/list-accounts',
        '/api/oauth/consents',

        // 允许的只读管理操作（已通过GET方法过滤）
        // 这里主要是为了明确列出可访问的管理接口
    ]

    return allowedOperations.some((op) => url.startsWith(op))
}

/**
 * Demo 模式守卫中间件
 */
export default defineEventHandler(async (event) => {
    // 如果不是 Demo 模式，直接放行
    if (!isDemoMode()) {
        return
    }

    const { method, url } = getServerContext(event)

    // 管理后台接口的处理
    if (isAdminAPI(url)) {
        // 检查是否为危险的管理后台操作
        if (isDangerousAdminOperation(url, method)) {
            logger.warn(`Demo 模式阻止管理后台危险操作: ${method} ${url}`)

            throw createError({
                statusCode: 403,
                statusMessage: 'Demo Mode',
                data: {
                    error: 'DEMO_MODE_ADMIN_RESTRICTION',
                    message: 'Demo 模式下不允许执行管理后台的修改操作',
                    operation: `${method} ${url}`,
                },
            })
        }
        // 允许 GET 请求访问管理后台（查看数据）
        return
    }

    // 检查是否为写操作但不是被允许的操作
    if (isWriteOperation(method) && !isAllowedDemoOperation(url, method)) {
        logger.warn(`Demo 模式阻止写操作: ${method} ${url}`)

        throw createError({
            statusCode: 403,
            statusMessage: 'Demo Mode',
            data: {
                error: 'DEMO_MODE_RESTRICTION',
                message: 'Demo 模式下不允许执行此操作',
                operation: `${method} ${url}`,
            },
        })
    }

    // 检查是否为特定的危险操作
    const dangerousOperations = [
        // 用户注册和账户管理
        '/api/auth/sign-up', // 禁止注册新用户
        '/api/auth/delete-user', // 禁止删除用户
        '/api/auth/update-user', // 禁止更新用户信息
        '/api/auth/change-email', // 禁止更改邮箱
        '/api/auth/change-password', // 禁止更改密码

        // 邮件和短信发送
        '/api/auth/send-verification-email', // 禁止发送验证邮件
        '/api/auth/email-otp/send-verification-otp', // 禁止发送邮箱验证码
        '/api/auth/magic-link', // 禁止发送魔法链接
        '/api/auth/phone-number/send-otp', // 禁止发送短信验证码
        '/api/auth/forget-password', // 禁止发送密码重置邮件
        '/api/auth/phone-number/forget-password', // 禁止发送密码重置短信

        // 两步验证相关
        '/api/auth/two-factor/send-otp', // 禁止发送两步验证码
        '/api/auth/two-factor/enable', // 禁止启用两步验证
        '/api/auth/two-factor/disable', // 禁止禁用两步验证

        // 账户绑定
        '/api/auth/link-social', // 禁止绑定社交账号
        '/api/auth/unlink-account', // 禁止解绑账号

        // OAuth应用注册
        '/api/auth/oauth2/register', // 禁止注册OAuth应用

        // 文件上传
        '/api/file/upload', // 禁止文件上传
    ]

    if (dangerousOperations.some((op) => url.startsWith(op))) {
        logger.warn(`Demo 模式阻止危险操作: ${method} ${url}`)

        throw createError({
            statusCode: 403,
            statusMessage: 'Demo Mode Restriction',
            data: {
                error: 'DEMO_MODE_DANGEROUS_OPERATION',
                message: 'Demo 模式下不允许执行此危险操作',
                operation: `${method} ${url}`,
            },
        })
    }
})

/**
 * 获取服务器上下文信息
 */
function getServerContext(event: any) {
    return {
        method: event.node?.req?.method || 'GET',
        url: event.node?.req?.url || '',
    }
}
