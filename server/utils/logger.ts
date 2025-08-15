import fs from 'fs'
import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston'
import { createSafeLogData, maskEmail, maskPhone } from './privacy'
import { LOG_LEVEL, LOGFILES, AXIOM_DATASET_NAME, AXIOM_API_TOKEN, LOG_DIR } from '@/utils/env'

// 日志目录路径
const logDir = path.isAbsolute(LOG_DIR) ? LOG_DIR : path.join(process.cwd(), LOG_DIR)

// 检测是否为无服务器环境
const isServerlessEnvironment = () => {
    // Vercel
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
        return true
    }
    // Netlify
    if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
        return true
    }
    // AWS Lambda
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return true
    }
    // Cloudflare Workers
    if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV) {
        return true
    }
    // 检查只读文件系统路径（常见的无服务器环境特征）
    if (process.cwd().includes('/var/task') || process.cwd().includes('/tmp')) {
        return true
    }
    return false
}

// 检查是否可以使用文件日志
let canWriteToFile = LOGFILES && !isServerlessEnvironment()
if (LOGFILES && !isServerlessEnvironment()) {
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }
        // 测试写入权限
        const testFile = path.join(logDir, '.write-test')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile)
    } catch (error) {
        // 无法创建目录或写入文件，禁用文件日志
        console.warn('Failed to create log directory or write to file system, file logging will be disabled:', error)
        canWriteToFile = false
    }
} else if (LOGFILES && isServerlessEnvironment()) {
    console.warn('Serverless environment detected, file logging is disabled')
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

// 控制台日志格式配置（根据环境决定是否带颜色）
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.ms(),
    winston.format.splat(),
    nestWinstonModuleUtilities.format.nestLike('caomei-auth', {
        colors: !isServerlessEnvironment(), // 在无服务器环境中禁用颜色
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

    // 如果可以写入文件，添加文件传输
    if (canWriteToFile) {
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
    if (AXIOM_DATASET_NAME && AXIOM_API_TOKEN) {
        transports.push(
            // Axiom 日志传输
            new AxiomTransport({
                dataset: AXIOM_DATASET_NAME,
                token: AXIOM_API_TOKEN,
                level: LOG_LEVEL,
            }),
        )
    }

    const exceptionHandlers: winston.transport[] = []
    const rejectionHandlers: winston.transport[] = []

    if (canWriteToFile) {
        exceptionHandlers.push(
            new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.exceptions.log',
            }),
        )
        rejectionHandlers.push(
            new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.rejections.log',
            }),
        )
    }

    if (AXIOM_DATASET_NAME && AXIOM_API_TOKEN) {
        const axiomExceptionTransport = new AxiomTransport({
            dataset: AXIOM_DATASET_NAME,
            token: AXIOM_API_TOKEN,
        })
        exceptionHandlers.push(axiomExceptionTransport)
        rejectionHandlers.push(axiomExceptionTransport)
    }

    return winston.createLogger({
        level: LOG_LEVEL,
        format,
        transports,
        exceptionHandlers,
        rejectionHandlers,
        exitOnError: false,
    })
}

const winstonLogger = createWinstonLogger()

// 基于 Winston 的标准日志级别
const baseLogger = {
    withTag: (tag: string) => ({
        debug: (message: string, meta?: any) => winstonLogger.debug(`[${tag}] ${message}`, meta),
        info: (message: string, meta?: any) => winstonLogger.info(`[${tag}] ${message}`, meta),
        warn: (message: string, meta?: any) => winstonLogger.warn(`[${tag}] ${message}`, meta),
        error: (message: string, meta?: any) => winstonLogger.error(`[${tag}] ${message}`, meta),
        http: (message: string, meta?: any) => winstonLogger.http(`[${tag}] ${message}`, meta),
        verbose: (message: string, meta?: any) => winstonLogger.verbose(`[${tag}] ${message}`, meta),
        silly: (message: string, meta?: any) => winstonLogger.silly(`[${tag}] ${message}`, meta),
    }),
    debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
    info: (message: string, meta?: any) => winstonLogger.info(message, meta),
    warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
    error: (message: string, meta?: any) => winstonLogger.error(message, meta),
    http: (message: string, meta?: any) => winstonLogger.http(message, meta),
    verbose: (message: string, meta?: any) => winstonLogger.verbose(message, meta),
    silly: (message: string, meta?: any) => winstonLogger.silly(message, meta),
}

// 基础日志方法 - 使用 Winston 标准级别
const logger = {
    debug: (message: string, meta?: any) => baseLogger.debug(message, meta),
    info: (message: string, meta?: any) => baseLogger.info(message, meta),
    warn: (message: string, meta?: any) => baseLogger.warn(message, meta),
    error: (message: string, meta?: any) => baseLogger.error(message, meta),
    http: (message: string, meta?: any) => baseLogger.http(message, meta),
    verbose: (message: string, meta?: any) => baseLogger.verbose(message, meta),
    silly: (message: string, meta?: any) => baseLogger.silly(message, meta),
}

// 扩展 logger 接口类型定义 - 使用 Winston 标准级别
interface ExtendedLogger {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
    http: (message: string, meta?: any) => void
    verbose: (message: string, meta?: any) => void
    silly: (message: string, meta?: any) => void

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
        oauthAppCreateFailed: (data: { name?: string, createdBy: string, error: string }) => void
        oauthAppUpdated: (data: { appId: string, name?: string, updatedBy: string }) => void
        oauthAppDeleted: (data: { appId: string, name?: string, deletedBy: string }) => void
        oauthAppListFailed: (data: { error: string, adminId: string }) => void
        fileUploaded: (data: { fileName: string, size: number, userId: string, type?: string }) => void
        ssoProviderCreated: (data: { providerId: string, name: string, createdBy: string }) => void
        ssoProviderUpdated: (data: { providerId: string, updatedBy: string }) => void
        ssoProviderDeleted: (data: { providerId: string, deletedBy: string }) => void
        sessionLogQueryFailed: (data: { adminId: string, error: string, queryParams?: any }) => void
    }

    // 邮件相关日志
    email: {
        sent: (data: { type: string, email: string, success?: boolean }) => void
        failed: (data: { type: string, email: string, error: string }) => void
        templateRendered: (data: { templateName: string, success?: boolean }) => void
        templateError: (data: { templateName: string, error: string }) => void
        rateLimited: (data: { email?: string, limitType: 'global' | 'user', remainingTime?: number }) => void
    }

    // 短信相关日志
    phone: {
        sent: (data: { type: string, phone: string, success?: boolean }) => void
        failed: (data: { type: string, phone: string, error: string }) => void
        rateLimited: (data: { phone?: string, limitType: 'global' | 'user', remainingTime?: number }) => void
    }
}

// 创建带标签的 logger 实例 - 去除 emoji
const securityLogger = baseLogger.withTag('Security')
const apiLogger = baseLogger.withTag('API')
const databaseLogger = baseLogger.withTag('Database')
const systemLogger = baseLogger.withTag('System')
const businessLogger = baseLogger.withTag('Business')
const emailLogger = baseLogger.withTag('Email')
const phoneLogger = baseLogger.withTag('Phone')

// 创建扩展的 logger
const extendedLogger: ExtendedLogger = {
    ...logger,

    // 安全相关日志
    security: {
        loginAttempt: (data) => {
            const safeData = createSafeLogData(data)
            const message = data.success
                ? `Login attempt successful for ${safeData.email || safeData.userId}${data.provider ? ` via ${data.provider}` : ''}${data.ip ? ` from ${safeData.ip}` : ''}`
                : `Login attempt failed for ${safeData.email || 'unknown'}${data.provider ? ` via ${data.provider}` : ''}${data.ip ? ` from ${safeData.ip}` : ''}`

            if (data.success) {
                securityLogger.info(message, { provider: data.provider, userAgent: data.userAgent })
            } else {
                securityLogger.warn(message, { provider: data.provider, userAgent: data.userAgent })
            }
        },
        loginSuccess: (data) => {
            const safeData = createSafeLogData(data)
            const message = `User logged in successfully${data.provider ? ` via ${data.provider}` : ''}${data.ip ? ` from ${safeData.ip}` : ''}`
            securityLogger.info(message, { userId: safeData.userId, email: safeData.email, provider: data.provider, userAgent: data.userAgent })
        },
        loginFailure: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Login failed: ${data.reason}${data.provider ? ` via ${data.provider}` : ''}${data.ip ? ` from ${safeData.ip}` : ''}`
            securityLogger.warn(message, { email: safeData.email, provider: data.provider, userAgent: data.userAgent })
        },
        passwordReset: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Password reset initiated${data.ip ? ` from ${safeData.ip}` : ''}`
            securityLogger.info(message, { userId: safeData.userId, email: safeData.email })
        },
        accountLocked: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Account locked: ${data.reason || 'Unknown reason'}${data.ip ? ` from ${safeData.ip}` : ''}`
            securityLogger.error(message, { userId: safeData.userId, email: safeData.email })
        },
        permissionDenied: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Permission denied: ${data.action} on ${data.resource}${data.ip ? ` from ${safeData.ip}` : ''}`
            securityLogger.warn(message, { userId: safeData.userId, resource: data.resource, action: data.action })
        },
    },

    // API 相关日志
    api: {
        request: (data) => {
            const safeData = createSafeLogData(data)
            const message = `${data.method} ${data.path}${data.ip ? ` from ${safeData.ip}` : ''}`
            apiLogger.http(message, { userId: safeData.userId, userAgent: data.userAgent })
        },
        response: (data) => {
            const safeData = createSafeLogData(data)
            const responseTime = data.responseTime ? ` (${data.responseTime}ms)` : ''
            const message = `${data.method} ${data.path} - ${data.statusCode}${responseTime}`

            if (data.statusCode >= 500) {
                apiLogger.error(message, { userId: safeData.userId })
            } else if (data.statusCode >= 400) {
                apiLogger.warn(message, { userId: safeData.userId })
            } else {
                apiLogger.http(message, { userId: safeData.userId })
            }
        },
        error: (data) => {
            const safeData = createSafeLogData(data)
            const message = `${data.method} ${data.path} failed: ${data.error}`
            apiLogger.error(message, { userId: safeData.userId, stack: data.stack })
        },
    },

    // 数据库相关日志
    database: {
        query: (data) => {
            const duration = data.duration ? ` (${data.duration}ms)` : ''
            const message = `Query executed${duration}`
            const truncatedQuery = data.query.substring(0, 100) + (data.query.length > 100 ? '...' : '')
            databaseLogger.debug(message, { query: truncatedQuery, params: data.params })
        },
        error: (data) => {
            const message = `Database error: ${data.error}`
            const truncatedQuery = data.query ? data.query.substring(0, 100) + (data.query.length > 100 ? '...' : '') : undefined
            databaseLogger.error(message, { query: truncatedQuery, stack: data.stack })
        },
        migration: (data) => {
            const duration = data.duration ? ` in ${data.duration}ms` : ''
            const message = `Migration ${data.name} ${data.direction}${duration}`
            databaseLogger.info(message)
        },
    },

    // 系统相关日志
    system: {
        startup: (data) => {
            const message = `System started on port ${data.port || 'unknown'} (${data.env || 'unknown'} mode)`
            systemLogger.info(message, { dbType: data.dbType })
        },
        shutdown: (data) => {
            const message = `System shutting down: ${data.reason || 'Unknown reason'}`
            systemLogger.info(message, { graceful: data.graceful })
        },
        healthCheck: (data) => {
            const message = data.status === 'healthy' ? 'Health check passed' : 'Health check failed'
            if (data.status === 'healthy') {
                systemLogger.info(message, { checks: data.checks })
            } else {
                systemLogger.error(message, { checks: data.checks })
            }
        },
    },

    // 业务相关日志
    business: {
        userRegistered: (data) => {
            const safeData = createSafeLogData(data)
            const message = `New user registered${data.provider ? ` via ${data.provider}` : ''}`
            businessLogger.info(message, { userId: safeData.userId, email: safeData.email, provider: data.provider })
        },
        userDeleted: (data) => {
            const safeData = createSafeLogData(data)
            const message = 'User deleted'
            businessLogger.warn(message, { userId: safeData.userId, email: safeData.email, adminId: safeData.adminId })
        },
        oauthAppCreated: (data) => {
            const safeData = createSafeLogData(data)
            const message = `OAuth app created: ${data.name}`
            businessLogger.info(message, { appId: data.appId, createdBy: safeData.createdBy })
        },
        oauthAppCreateFailed: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Failed to create OAuth app${data.name ? `: ${data.name}` : ''} - ${data.error}`
            businessLogger.error(message, { createdBy: safeData.createdBy })
        },
        oauthAppUpdated: (data) => {
            const safeData = createSafeLogData(data)
            const message = `OAuth app updated${data.name ? `: ${data.name}` : ''}`
            businessLogger.info(message, { appId: data.appId, updatedBy: safeData.updatedBy })
        },
        oauthAppDeleted: (data) => {
            const safeData = createSafeLogData(data)
            const message = `OAuth app deleted${data.name ? `: ${data.name}` : ''}`
            businessLogger.warn(message, { appId: data.appId, deletedBy: safeData.deletedBy })
        },
        oauthAppListFailed: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Failed to list OAuth applications: ${data.error}`
            businessLogger.error(message, { adminId: safeData.adminId })
        },
        fileUploaded: (data) => {
            const safeData = createSafeLogData(data)
            const message = `File uploaded: ${data.fileName} (${data.size} bytes)`
            businessLogger.info(message, { userId: safeData.userId, type: data.type })
        },
        ssoProviderCreated: (data) => {
            const safeData = createSafeLogData(data)
            const message = `SSO provider created: ${data.name}`
            businessLogger.info(message, { providerId: data.providerId, createdBy: safeData.createdBy })
        },
        ssoProviderUpdated: (data) => {
            const safeData = createSafeLogData(data)
            const message = 'SSO provider updated'
            businessLogger.info(message, { providerId: data.providerId, updatedBy: safeData.updatedBy })
        },
        ssoProviderDeleted: (data) => {
            const safeData = createSafeLogData(data)
            const message = 'SSO provider deleted'
            businessLogger.warn(message, { providerId: data.providerId, deletedBy: safeData.deletedBy })
        },
        sessionLogQueryFailed: (data) => {
            const safeData = createSafeLogData(data)
            const message = `Failed to query session logs: ${data.error}`
            businessLogger.error(message, { adminId: safeData.adminId, queryParams: data.queryParams })
        },
    },

    // 邮件相关日志
    email: {
        sent: (data) => {
            const message = `Email ${data.type} sent successfully to ${maskEmail(data.email)}`
            emailLogger.info(message, { type: data.type, success: data.success })
        },
        failed: (data) => {
            const message = `Failed to send ${data.type} email to ${maskEmail(data.email)}: ${data.error}`
            emailLogger.error(message, { type: data.type })
        },
        templateRendered: (data) => {
            const message = data.success
                ? `Email template ${data.templateName} rendered successfully`
                : `Email template ${data.templateName} rendering failed`
            emailLogger.debug(message, { templateName: data.templateName, success: data.success })
        },
        templateError: (data) => {
            const message = `Email template ${data.templateName} error: ${data.error}`
            emailLogger.error(message, { templateName: data.templateName })
        },
        rateLimited: (data) => {
            const emailInfo = data.email ? ` for ${maskEmail(data.email)}` : ''
            const remainingInfo = data.remainingTime ? ` (${Math.ceil(data.remainingTime / 60)}min remaining)` : ''
            const message = `Email rate limit reached (${data.limitType})${emailInfo}${remainingInfo}`
            emailLogger.warn(message, { limitType: data.limitType, remainingTime: data.remainingTime })
        },
    },

    // 短信相关日志
    phone: {
        sent: (data) => {
            const message = `SMS ${data.type} sent successfully to ${maskPhone(data.phone)}`
            phoneLogger.info(message, { type: data.type, success: data.success })
        },
        failed: (data) => {
            const message = `Failed to send ${data.type} SMS to ${maskPhone(data.phone)}: ${data.error}`
            phoneLogger.error(message, { type: data.type })
        },
        rateLimited: (data) => {
            const phoneInfo = data.phone ? ` for ${maskPhone(data.phone)}` : ''
            const remainingInfo = data.remainingTime ? ` (${Math.ceil(data.remainingTime / 60)}min remaining)` : ''
            const message = `SMS rate limit reached (${data.limitType})${phoneInfo}${remainingInfo}`
            phoneLogger.warn(message, { limitType: data.limitType, remainingTime: data.remainingTime })
        },
    },
}

export default extendedLogger

// 导出 Winston logger 实例（用于需要直接使用 winston 功能的场景）
export { winstonLogger }

// 导出类型
export type { ExtendedLogger }

// 创建 Winston 适配器类型，使用标准日志级别
export interface WinstonAdapter {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
    http: (message: string, meta?: any) => void
    verbose: (message: string, meta?: any) => void
    silly: (message: string, meta?: any) => void
}
