import fs from 'fs'
import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import { LOG_LEVEL, LOGFILES } from '@/utils/env'

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
}

// 判断是否为生产环境
const __PROD__ = process.env.NODE_ENV === 'production'

// 日志格式配置（不带颜色）
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    nestWinstonModuleUtilities.format.nestLike('caomei-auth', {
        colors: false,
        prettyPrint: true,
    }),
)

// 控制台日志格式配置（带颜色）
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.ms(),
    winston.format.splat(),
    nestWinstonModuleUtilities.format.nestLike('caomei-auth', {
        colors: true,
        prettyPrint: true,
    }),
)

// 日志文件轮转配置
const dailyRotateFileOption = {
    dirname: logDir,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: __PROD__, // 如果是生产环境，压缩日志文件
    maxSize: '20m',
    maxFiles: '31d',
    format,
    auditFile: path.join(logDir, '.audit.json'),
}

// 创建 Winston logger 实例
const createWinstonLogger = () => {
    const transports: winston.transport[] = [
        // 控制台输出
        new winston.transports.Console({
            format: consoleFormat,
            level: LOG_LEVEL,
        }),
    ]

    // 如果启用日志文件，添加文件传输
    if (LOGFILES) {
        transports.push(
            // 所有日志文件
            new DailyRotateFile({
                ...dailyRotateFileOption,
                filename: '%DATE%.log',
                level: LOG_LEVEL,
            }),
            // 错误日志文件
            new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        )
    }

    return winston.createLogger({
        level: LOG_LEVEL,
        format,
        transports,
        exceptionHandlers: LOGFILES ? [
            new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.exceptions.log',
            }),
        ] : [],
        rejectionHandlers: LOGFILES ? [
            new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.rejections.log',
            }),
        ] : [],
        exitOnError: false,
    })
}

const winstonLogger = createWinstonLogger()

// Winston 到 consola 风格的适配器
const baseLogger = {
    withTag: (tag: string) => ({
        debug: (message: string, meta?: any) => winstonLogger.debug(`[${tag}] ${message}`, meta),
        info: (message: string, meta?: any) => winstonLogger.info(`[${tag}] ${message}`, meta),
        warn: (message: string, meta?: any) => winstonLogger.warn(`[${tag}] ${message}`, meta),
        error: (message: string, meta?: any) => winstonLogger.error(`[${tag}] ${message}`, meta),
        success: (message: string, meta?: any) => winstonLogger.info(`[${tag}] ✅ ${message}`, meta),
        start: (message: string, meta?: any) => winstonLogger.info(`[${tag}] 🚀 ${message}`, meta),
        ready: (message: string, meta?: any) => winstonLogger.info(`[${tag}] ✨ ${message}`, meta),
        fatal: (message: string, meta?: any) => winstonLogger.error(`[${tag}] 💀 ${message}`, meta),
    }),
    debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
    info: (message: string, meta?: any) => winstonLogger.info(message, meta),
    warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
    error: (message: string, meta?: any) => winstonLogger.error(message, meta),
    success: (message: string, meta?: any) => winstonLogger.info(`✅ ${message}`, meta),
    start: (message: string, meta?: any) => winstonLogger.info(`🚀 ${message}`, meta),
    ready: (message: string, meta?: any) => winstonLogger.info(`✨ ${message}`, meta),
    fatal: (message: string, meta?: any) => winstonLogger.error(`💀 ${message}`, meta),
}

// 基础日志方法 - 简化版本，直接使用 baseLogger
const logger = {
    debug: (message: string, meta?: any) => baseLogger.debug(message, meta),
    info: (message: string, meta?: any) => baseLogger.info(message, meta),
    warn: (message: string, meta?: any) => baseLogger.warn(message, meta),
    error: (message: string, meta?: any) => baseLogger.error(message, meta),
    http: (message: string, meta?: any) => baseLogger.info(`🌐 ${message}`, meta),
    success: (message: string, meta?: any) => baseLogger.success(message, meta),
    start: (message: string, meta?: any) => baseLogger.start(message, meta),
    ready: (message: string, meta?: any) => baseLogger.ready(message, meta),
    fatal: (message: string, meta?: any) => baseLogger.fatal(message, meta),
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

// 导出 Winston logger 实例（用于需要直接使用 winston 功能的场景）
export { winstonLogger }

// 导出类型
export type { ExtendedLogger }

// 创建 Winston 适配器类型，兼容 consola 接口
export interface WinstonAdapter {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
    success: (message: string, meta?: any) => void
    start: (message: string, meta?: any) => void
    ready: (message: string, meta?: any) => void
    fatal: (message: string, meta?: any) => void
}
