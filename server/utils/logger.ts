import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LOGFILES, LOG_LEVEL } from '@/utils/env'

// 自定义日志格式
const createCustomFormat = () => winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }), // 捕获错误堆栈
    winston.format.splat(),
    winston.format.json(), // 使用JSON格式便于解析
)

// 控制台输出格式（带颜色）
const createConsoleFormat = () => winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf((info) => {
        const level = winston.format.colorize().colorize(info.level, `[${info.timestamp}] ${info.level.toUpperCase()}`)
        const message = info.message
        const meta = info.meta ? ` ${JSON.stringify(info.meta)}` : ''
        const stack = info.stack ? `\n${info.stack}` : ''
        return `${level}: ${message}${meta}${stack}`
    }),
)

function createLogger() {
    const logDir = path.resolve('logs')
    const fileFormat = createCustomFormat()
    const consoleFormat = createConsoleFormat()

    // 通用的文件轮转配置
    const createRotateFileConfig = (filename: string, level?: string) => ({
        dirname: logDir,
        filename,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '20m',
        maxFiles: '31d',
        format: fileFormat,
        level,
        auditFile: path.join(logDir, '.audit.json'),
    })
    const winstonLogger = winston.createLogger({
        level: LOG_LEVEL,
        exitOnError: false,
        defaultMeta: { service: 'caomei-auth' }, // 添加服务标识
        transports: [
            // 控制台输出
            new winston.transports.Console({
                format: consoleFormat,
            }),
            // 所有日志文件
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.log')),
            // 错误日志文件
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.error.log', 'error')),
            // 警告及以上级别日志
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.warn.log', 'warn')),
            // API访问日志
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.api.log', 'http')),
        ].filter(Boolean) as winston.transport[],

        // 异常处理
        exceptionHandlers: [
            new winston.transports.Console({ format: consoleFormat }),
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.exceptions.log')),
        ].filter(Boolean),

        // 未处理的 Promise 拒绝
        rejectionHandlers: [
            new winston.transports.Console({ format: consoleFormat }),
            LOGFILES && new DailyRotateFile(createRotateFileConfig('%DATE%.rejections.log')),
        ].filter(Boolean),
    })

    return winstonLogger
}

const logger = createLogger()

// 扩展 logger 方法，提供更友好的 API
interface ExtendedLogger extends winston.Logger {
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
const extendedLogger = logger as ExtendedLogger

// 安全日志
extendedLogger.security = {
    loginAttempt: (data) => logger.info('Login attempt', { type: 'security', event: 'login_attempt', ...data }),
    loginSuccess: (data) => logger.info('Login successful', { type: 'security', event: 'login_success', ...data }),
    loginFailure: (data) => logger.warn('Login failed', { type: 'security', event: 'login_failure', ...data }),
    passwordReset: (data) => logger.info('Password reset initiated', { type: 'security', event: 'password_reset', ...data }),
    accountLocked: (data) => logger.warn('Account locked', { type: 'security', event: 'account_locked', ...data }),
    permissionDenied: (data) => logger.warn('Permission denied', { type: 'security', event: 'permission_denied', ...data }),
}

// API 日志
extendedLogger.api = {
    request: (data) => logger.http('API request', { type: 'api', event: 'request', ...data }),
    response: (data) => logger.http('API response', { type: 'api', event: 'response', ...data }),
    error: (data) => logger.error('API error', { type: 'api', event: 'error', ...data }),
}

// 数据库日志
extendedLogger.database = {
    query: (data) => logger.debug('Database query', { type: 'database', event: 'query', ...data }),
    error: (data) => logger.error('Database error', { type: 'database', event: 'error', ...data }),
    migration: (data) => logger.info('Database migration', { type: 'database', event: 'migration', ...data }),
}

// 系统日志
extendedLogger.system = {
    startup: (data) => logger.info('System startup', { type: 'system', event: 'startup', ...data }),
    shutdown: (data) => logger.info('System shutdown', { type: 'system', event: 'shutdown', ...data }),
    healthCheck: (data) => logger.info('Health check', { type: 'system', event: 'health_check', ...data }),
}

// 业务日志
extendedLogger.business = {
    userRegistered: (data) => logger.info('User registered', { type: 'business', event: 'user_registered', ...data }),
    userDeleted: (data) => logger.warn('User deleted', { type: 'business', event: 'user_deleted', ...data }),
    oauthAppCreated: (data) => logger.info('OAuth app created', { type: 'business', event: 'oauth_app_created', ...data }),
    fileUploaded: (data) => logger.info('File uploaded', { type: 'business', event: 'file_uploaded', ...data }),
}

export default extendedLogger
