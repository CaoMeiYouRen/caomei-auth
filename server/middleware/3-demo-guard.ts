/**
 * Demo 模式守卫中间件
 * 用于在 Demo 模式下拦截写操作，防止对数据的修改
 */

import logger from '@/server/utils/logger'
import { DEMO_MODE } from '@/utils/env'

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
 * 检查是否为被允许的 Demo 模式操作
 */
function isAllowedDemoOperation(url: string, method: string): boolean {
    // 允许的只读操作
    if (method.toUpperCase() === 'GET') {
        return true
    }

    // 允许的特定操作（如登录验证等）
    const allowedOperations = [
        '/api/auth/sign-in',
        '/api/auth/sign-out',
        '/api/auth/session',
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

    // 如果是写操作且为管理后台 API，且不是被允许的操作
    if (isWriteOperation(method) && isAdminAPI(url) && !isAllowedDemoOperation(url, method)) {
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

    // 如果是特定的危险操作，也需要阻止
    const dangerousOperations = [
        '/api/auth/sign-up', // 禁止注册新用户
        '/api/upload', // 禁止文件上传
        '/api/send-email', // 禁止发送邮件
        '/api/send-sms', // 禁止发送短信
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
