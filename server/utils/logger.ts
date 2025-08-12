import { createConsola, type ConsolaInstance } from 'consola'

// 创建自定义的 consola 实例
const baseLogger = createConsola({
    level: process.env.NODE_ENV === 'development' ? 4 : 3, // 开发环境显示 debug 日志
    formatOptions: {
        date: true,
        colors: true,
        compact: false,
    },
})

// 基础日志方法
const logger = {
    debug: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.debug(message, meta)
        } else {
            baseLogger.debug(message)
        }
    },
    info: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.info(message, meta)
        } else {
            baseLogger.info(message)
        }
    },
    warn: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.warn(message, meta)
        } else {
            baseLogger.warn(message)
        }
    },
    error: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.error(message, meta)
        } else {
            baseLogger.error(message)
        }
    },
    http: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.info(`🌐 ${message}`, meta)
        } else {
            baseLogger.info(`🌐 ${message}`)
        }
    },
    success: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.success(message, meta)
        } else {
            baseLogger.success(message)
        }
    },
    start: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.start(message, meta)
        } else {
            baseLogger.start(message)
        }
    },
    ready: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.ready(message, meta)
        } else {
            baseLogger.ready(message)
        }
    },
    fatal: (message: string, meta?: any) => {
        if (meta) {
            baseLogger.fatal(message, meta)
        } else {
            baseLogger.fatal(message)
        }
    },
}

// 扩展 logger 接口类型定义
interface ExtendedLogger {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
    http: (message: string, meta?: any) => void
    success: (message: string, meta?: any) => void
    start: (message: string, meta?: any) => void
    ready: (message: string, meta?: any) => void
    fatal: (message: string, meta?: any) => void

    // 安全相关日志
    security: {
        loginAttempt: (data: { userId?: string, email?: string, ip?: string, userAgent?: string, success: boolean, provider?: string }) => void
        loginSuccess: (data: { userId: string, email: string, ip?: string, userAgent?: string, provider?: string }) => void
        loginFailure: (data: { email?: string, ip?: string, userAgent?: string, reason: string, provider?: string }) => void
        passwordReset: (data: { userId?: string, email?: string, ip?: string }) => void
        accountLocked: (data: { userId?: string, email?: string, ip?: string, reason?: string }) => void
        permissionDenied: (data: { userId?: string, resource: string, action: string, ip?: string }) => void
    }

    // API 相关日志
    api: {
        request: (data: { method: string, path: string, ip?: string, userAgent?: string, userId?: string }) => void
        response: (data: { method: string, path: string, statusCode: number, responseTime?: number, userId?: string }) => void
        error: (data: { method: string, path: string, error: string, stack?: string, userId?: string }) => void
    }

    // 数据库相关日志
    database: {
        query: (data: { query: string, params?: any, duration?: number }) => void
        error: (data: { query?: string, error: string, stack?: string }) => void
        migration: (data: { name: string, direction: 'up' | 'down', duration?: number }) => void
    }

    // 系统相关日志
    system: {
        startup: (data: { port?: number, env?: string, dbType?: string }) => void
        shutdown: (data: { reason?: string, graceful?: boolean }) => void
        healthCheck: (data: { status: 'healthy' | 'unhealthy', checks?: Record<string, boolean> }) => void
    }

    // 业务相关日志
    business: {
        userRegistered: (data: { userId: string, email: string, provider?: string }) => void
        userDeleted: (data: { userId: string, email: string, adminId?: string }) => void
        oauthAppCreated: (data: { appId: string, name: string, createdBy: string }) => void
        fileUploaded: (data: { fileName: string, size: number, userId: string, type?: string }) => void
    }
}

// 创建带标签的 logger 实例
const securityLogger = baseLogger.withTag('🔐 Security')
const apiLogger = baseLogger.withTag('🌐 API')
const databaseLogger = baseLogger.withTag('🗄️  Database')
const systemLogger = baseLogger.withTag('⚙️  System')
const businessLogger = baseLogger.withTag('💼 Business')

// 创建扩展的 logger
const extendedLogger: ExtendedLogger = {
    ...logger,

    // 安全相关日志
    security: {
        loginAttempt: (data) => {
            if (data.success) {
                securityLogger.success(`Login attempt successful for ${data.email || data.userId}`, data)
            } else {
                securityLogger.warn(`Login attempt failed for ${data.email || 'unknown'}`, data)
            }
        },
        loginSuccess: (data) => securityLogger.success(`User ${data.email} logged in successfully`, data),
        loginFailure: (data) => securityLogger.warn(`Login failed: ${data.reason}`, data),
        passwordReset: (data) => securityLogger.info(`Password reset initiated for ${data.email || data.userId}`, data),
        accountLocked: (data) => securityLogger.error(`Account locked for ${data.email || data.userId}: ${data.reason || 'Unknown reason'}`, data),
        permissionDenied: (data) => securityLogger.warn(`Permission denied: ${data.action} on ${data.resource}`, data),
    },

    // API 相关日志
    api: {
        request: (data) => apiLogger.debug(`${data.method} ${data.path}`, data),
        response: (data) => {
            const responseTime = data.responseTime ? ` (${data.responseTime}ms)` : ''
            let statusIcon = '✅'
            if (data.statusCode >= 400) {
                statusIcon = '❌'
            } else if (data.statusCode >= 300) {
                statusIcon = '🔄'
            }
            apiLogger.debug(`${statusIcon} ${data.method} ${data.path} - ${data.statusCode}${responseTime}`, data)
        },
        error: (data) => apiLogger.error(`${data.method} ${data.path} failed: ${data.error}`, data),
    },

    // 数据库相关日志
    database: {
        query: (data) => {
            const duration = data.duration ? ` (${data.duration}ms)` : ''
            databaseLogger.debug(`Query executed${duration}`, { ...data, query: data.query.substring(0, 100) + (data.query.length > 100 ? '...' : '') })
        },
        error: (data) => databaseLogger.error(`Database error: ${data.error}`, data),
        migration: (data) => {
            const duration = data.duration ? ` in ${data.duration}ms` : ''
            databaseLogger.info(`Migration ${data.name} ${data.direction}${duration}`, data)
        },
    },

    // 系统相关日志
    system: {
        startup: (data) => systemLogger.ready(`System started on port ${data.port || 'unknown'} (${data.env || 'unknown'} mode)`, data),
        shutdown: (data) => systemLogger.info(`System shutting down: ${data.reason || 'Unknown reason'}`, data),
        healthCheck: (data) => {
            if (data.status === 'healthy') {
                systemLogger.success('Health check passed', data)
            } else {
                systemLogger.error('Health check failed', data)
            }
        },
    },

    // 业务相关日志
    business: {
        userRegistered: (data) => businessLogger.success(`New user registered: ${data.email}`, data),
        userDeleted: (data) => businessLogger.warn(`User deleted: ${data.email}`, data),
        oauthAppCreated: (data) => businessLogger.info(`OAuth app created: ${data.name}`, data),
        fileUploaded: (data) => businessLogger.info(`File uploaded: ${data.fileName} (${data.size} bytes)`, data),
    },
}

export default extendedLogger

// 导出基础的 consola 实例，以便在需要时使用其他方法
export { baseLogger as consola }

// 导出类型
export type { ExtendedLogger }

// 创建带标签的 logger 工厂函数
export function createTaggedLogger(tag: string): ConsolaInstance {
    return baseLogger.withTag(tag)
}

// 性能测试 logger
export const performanceLogger = baseLogger.withTag('⚡ Performance')

// 缓存 logger
export const cacheLogger = baseLogger.withTag('🗃️  Cache')

// 邮件 logger
export const emailLogger = baseLogger.withTag('📧 Email')

// OAuth logger
export const oauthLogger = baseLogger.withTag('🔑 OAuth')
