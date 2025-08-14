import fs from 'fs'
import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston'
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
        fileUploaded: (data: { fileName: string, size: number, userId: string, type?: string }) => void
    }
}

// 创建带标签的 logger 实例 - 去除 emoji
const securityLogger = baseLogger.withTag('Security')
const apiLogger = baseLogger.withTag('API')
const databaseLogger = baseLogger.withTag('Database')
const systemLogger = baseLogger.withTag('System')
const businessLogger = baseLogger.withTag('Business')

// 创建扩展的 logger
const extendedLogger: ExtendedLogger = {
    ...logger,

    // 安全相关日志
    security: {
        loginAttempt: (data) => {
            if (data.success) {
                securityLogger.info(`Login attempt successful for ${data.email || data.userId}`, data)
            } else {
                securityLogger.warn(`Login attempt failed for ${data.email || 'unknown'}`, data)
            }
        },
        loginSuccess: (data) => securityLogger.info(`User ${data.email} logged in successfully`, data),
        loginFailure: (data) => securityLogger.warn(`Login failed: ${data.reason}`, data),
        passwordReset: (data) => securityLogger.info(`Password reset initiated for ${data.email || data.userId}`, data),
        accountLocked: (data) => securityLogger.error(`Account locked for ${data.email || data.userId}: ${data.reason || 'Unknown reason'}`, data),
        permissionDenied: (data) => securityLogger.warn(`Permission denied: ${data.action} on ${data.resource}`, data),
    },

    // API 相关日志
    api: {
        request: (data) => apiLogger.http(`${data.method} ${data.path}`, data),
        response: (data) => {
            const responseTime = data.responseTime ? ` (${data.responseTime}ms)` : ''
            if (data.statusCode >= 500) {
                apiLogger.error(`${data.method} ${data.path} - ${data.statusCode}${responseTime}`, data)
            } else if (data.statusCode >= 400) {
                apiLogger.warn(`${data.method} ${data.path} - ${data.statusCode}${responseTime}`, data)
            } else {
                apiLogger.http(`${data.method} ${data.path} - ${data.statusCode}${responseTime}`, data)
            }
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
        startup: (data) => systemLogger.info(`System started on port ${data.port || 'unknown'} (${data.env || 'unknown'} mode)`),
        shutdown: (data) => systemLogger.info(`System shutting down: ${data.reason || 'Unknown reason'}`),
        healthCheck: (data) => {
            if (data.status === 'healthy') {
                systemLogger.info('Health check passed', data)
            } else {
                systemLogger.error('Health check failed', data)
            }
        },
    },

    // 业务相关日志
    business: {
        userRegistered: (data) => businessLogger.info(`New user registered: ${data.email}`, data),
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
