import logger from '@/server/utils/logger'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    // 只记录 API 请求
    if (!event.path.startsWith('/api')) {
        return
    }

    const startTime = Date.now()
    const method = event.method
    const path = event.path
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || ''
    const locale = detectUserLocale(event)

    // 尝试获取用户信息（如果用户已登录）
    let userId: string | undefined
    try {
        const session = await auth.api.getSession({
            headers: event.headers,
        })
        userId = session?.user?.id
    } catch {
        // 忽略错误，继续记录请求
    }

    // 记录请求
    logger.api.request({
        method,
        path,
        ip,
        userAgent,
        userId,
        locale,
    })

    // 监听响应完成
    event.context.logStartTime = startTime

    // 记录响应
    if (!event.context.logResponseAdded) {
        event.context.logResponseAdded = true

        // 监听响应完成事件
        event.node.res.on('finish', () => {
            const responseTime = Date.now() - startTime
            const statusCode = event.node.res.statusCode || 200

            // 记录响应
            logger.api.response({
                method,
                path,
                statusCode,
                responseTime,
                userId,
            })

            // 如果是错误状态码，额外记录错误信息
            if (statusCode >= 400) {
                logger.api.error({
                    method,
                    path,
                    error: `HTTP ${statusCode}`,
                    userId,
                })
            }
        })
    }
})
