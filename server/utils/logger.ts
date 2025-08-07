// 简化的 logger，使用普通的 console 输出
function createTimestamp() {
    return new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
}

function formatLog(level: string, message: string, meta?: any) {
    const timestamp = createTimestamp()
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
}

// 创建简化的 logger
const logger = {
    debug: (message: string, meta?: any) => {
        console.debug(formatLog('debug', message, meta))
    },
    info: (message: string, meta?: any) => {
        console.info(formatLog('info', message, meta))
    },
    warn: (message: string, meta?: any) => {
        console.warn(formatLog('warn', message, meta))
    },
    error: (message: string, meta?: any) => {
        console.error(formatLog('error', message, meta))
    },
    http: (message: string, meta?: any) => {
        console.info(formatLog('http', message, meta))
    },
}

// 扩展 logger 接口类型定义
interface ExtendedLogger {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
    http: (message: string, meta?: any) => void

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

// 创建扩展的 logger
const extendedLogger: ExtendedLogger = {
    ...logger,
    // 安全相关日志
    security: {
        loginAttempt: (data) => logger.info('Login attempt', { type: 'security', event: 'login_attempt', ...data }),
        loginSuccess: (data) => logger.info('Login successful', { type: 'security', event: 'login_success', ...data }),
        loginFailure: (data) => logger.warn('Login failed', { type: 'security', event: 'login_failure', ...data }),
        passwordReset: (data) => logger.info('Password reset initiated', { type: 'security', event: 'password_reset', ...data }),
        accountLocked: (data) => logger.warn('Account locked', { type: 'security', event: 'account_locked', ...data }),
        permissionDenied: (data) => logger.warn('Permission denied', { type: 'security', event: 'permission_denied', ...data }),
    },

    // API 日志
    api: {
        request: (data) => logger.http('API request', { type: 'api', event: 'request', ...data }),
        response: (data) => logger.http('API response', { type: 'api', event: 'response', ...data }),
        error: (data) => logger.error('API error', { type: 'api', event: 'error', ...data }),
    },

    // 数据库日志
    database: {
        query: (data) => logger.debug('Database query', { type: 'database', event: 'query', ...data }),
        error: (data) => logger.error('Database error', { type: 'database', event: 'error', ...data }),
        migration: (data) => logger.info('Database migration', { type: 'database', event: 'migration', ...data }),
    },

    // 系统日志
    system: {
        startup: (data) => logger.info('System startup', { type: 'system', event: 'startup', ...data }),
        shutdown: (data) => logger.info('System shutdown', { type: 'system', event: 'shutdown', ...data }),
        healthCheck: (data) => logger.info('Health check', { type: 'system', event: 'health_check', ...data }),
    },

    // 业务日志
    business: {
        userRegistered: (data) => logger.info('User registered', { type: 'business', event: 'user_registered', ...data }),
        userDeleted: (data) => logger.warn('User deleted', { type: 'business', event: 'user_deleted', ...data }),
        oauthAppCreated: (data) => logger.info('OAuth app created', { type: 'business', event: 'oauth_app_created', ...data }),
        fileUploaded: (data) => logger.info('File uploaded', { type: 'business', event: 'file_uploaded', ...data }),
    },
}

export default extendedLogger
