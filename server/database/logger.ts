import { type Logger, type QueryRunner } from 'typeorm'
import logger, { type ExtendedLogger } from '../utils/logger'

// 判断是否为开发环境
const isDevelopment = () => process.env.NODE_ENV === 'development'

// 敏感数据关键词列表
const SENSITIVE_KEYWORDS = [
    'password',
    'token',
    'secret',
    'key',
    'hash',
    'email',
    'phone',
    'mobile',
    'address',
    'ssn',
    'credit',
    'card',
    'payment',
    'private',
]

// 检查查询是否包含敏感数据
function containsSensitiveData(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    return SENSITIVE_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))
}

// 安全地格式化SQL参数
function safeParametersFormat(parameters?: any[]): string {
    if (!parameters?.length) {
        return ''
    }

    // 开发环境显示所有参数（但仍需脱敏敏感数据）
    if (isDevelopment()) {
        const safeParams = parameters.map((parameter, index) => {
            if (parameter instanceof Date) {
                return `'${parameter.toISOString()}'`
            }
            if (typeof parameter === 'string') {
                // 检查是否可能是敏感数据
                const paramStr = parameter.toLowerCase()
                const isSensitive = SENSITIVE_KEYWORDS.some((keyword) => paramStr.includes(keyword) || parameter.includes('@') || /^\+?[\d\s-()]+$/.test(parameter)) // 可能是手机号

                if (isSensitive) {
                    return `'[PARAM_${index}]'`
                }
                return `'${parameter}'`
            }
            return `${parameter}`
        })
        return `\n${safeParams.join(', ')}`
    }

    // 生产环境只显示参数类型和数量
    return `\n[${parameters.length} parameters]`
}

// 查询类型缓存，避免重复分析
const queryTypeCache = new Map<string, string>()

// 获取查询类型
function getQueryType(query: string): string {
    const normalizedQuery = query.trim().substring(0, 50)

    if (queryTypeCache.has(normalizedQuery)) {
        return queryTypeCache.get(normalizedQuery) || 'UNKNOWN'
    }

    const upperQuery = query.trim().toUpperCase()
    let type = 'UNKNOWN'

    if (upperQuery.startsWith('SELECT')) {
        type = 'SELECT'
    } else if (upperQuery.startsWith('INSERT')) {
        type = 'INSERT'
    } else if (upperQuery.startsWith('UPDATE')) {
        type = 'UPDATE'
    } else if (upperQuery.startsWith('DELETE')) {
        type = 'DELETE'
    } else if (upperQuery.startsWith('CREATE')) {
        type = 'CREATE'
    } else if (upperQuery.startsWith('DROP')) {
        type = 'DROP'
    } else if (upperQuery.startsWith('ALTER')) {
        type = 'ALTER'
    } else if (upperQuery.startsWith('BEGIN') || upperQuery.startsWith('START')) {
        type = 'TRANSACTION'
    } else if (upperQuery.startsWith('COMMIT') || upperQuery.startsWith('ROLLBACK')) {
        type = 'TRANSACTION'
    }

    queryTypeCache.set(normalizedQuery, type)
    return type
}

export class CustomLogger implements Logger {
    private readonly loggerService: ExtendedLogger
    private readonly queryStats = {
        total: 0,
        slow: 0,
        errors: 0,
        lastReset: Date.now(),
    }

    // 批量日志缓存（减少高频查询的日志输出）
    private readonly queryBuffer = new Map<string, { count: number, lastSeen: number }>()
    private readonly BUFFER_FLUSH_INTERVAL = 60000 // 60秒

    constructor(loggerService?: ExtendedLogger) {
        this.loggerService = loggerService || logger

        // 定期清理缓存和统计
        setInterval(() => {
            this.flushQueryBuffer()
            this.resetStats()
        }, this.BUFFER_FLUSH_INTERVAL)
    }

    logQuery(query: string, parameters?: any[]): any {
        const queryType = getQueryType(query)
        const isSensitive = containsSensitiveData(query)
        const now = Date.now()

        this.queryStats.total++

        // 对于高频查询，使用缓存减少日志输出
        const queryKey = `${queryType}:${query.substring(0, 100)}`
        const buffered = this.queryBuffer.get(queryKey)

        if (buffered && now - buffered.lastSeen < 10000) { // 10秒内的重复查询
            buffered.count++
            buffered.lastSeen = now

            // 只有在开发环境或者是第一次查询时才记录详细信息
            if (!isDevelopment() && buffered.count > 1) {
                return
            }
        } else {
            this.queryBuffer.set(queryKey, { count: 1, lastSeen: now })
        }

        // 根据环境和敏感性决定日志详细程度
        if (isDevelopment()) {
            // 开发环境记录更多细节
            this.loggerService.database.query({
                query: isSensitive ? `[SENSITIVE-${queryType}] ${query.substring(0, 100)}...` : query,
                params: isSensitive ? ['[REDACTED]'] : parameters,
            })
        } else if (!isSensitive && (queryType === 'INSERT' || queryType === 'UPDATE' || queryType === 'DELETE')) {
            // 生产环境只记录重要的非敏感操作
            this.loggerService.database.query({
                query: `${queryType} operation executed`,
            })
        }
        // 生产环境的SELECT查询和敏感查询不记录详细信息
    }

    logQueryError(error: string | Error, query: string): any {
        this.queryStats.errors++

        const queryType = getQueryType(query)
        const isSensitive = containsSensitiveData(query)
        const errorMessage = error instanceof Error ? error.message : error

        this.loggerService.database.error({
            error: errorMessage,
            query: isSensitive ? `[SENSITIVE-${queryType}] Error in query` : query,
            stack: error instanceof Error ? error.stack : undefined,
        })

        // 错误统计
        if (this.queryStats.errors % 10 === 0) {
            this.loggerService.warn(`Database error count reached: ${this.queryStats.errors}`)
        }
    }

    logQuerySlow(time: number, query: string, parameters?: any[]): any {
        this.queryStats.slow++

        const queryType = getQueryType(query)
        const isSensitive = containsSensitiveData(query)

        this.loggerService.database.query({
            query: isSensitive ? `[SLOW-SENSITIVE-${queryType}] Slow query detected` : `[SLOW-${queryType}] ${query.substring(0, 100)}...`,
            params: isSensitive ? ['[REDACTED]'] : parameters,
            duration: time,
        })

        this.loggerService.warn(`Slow Query (${time}ms, ${queryType}): ${isSensitive ? '[SENSITIVE]' : 'OK'}${safeParametersFormat(parameters)}`)
    }

    logSchemaBuild(message: string): any {
        this.loggerService.debug(`Schema Build: ${message}`)
    }

    logMigration(message: string): any {
        this.loggerService.database.migration({ name: message, direction: 'up' })
    }

    log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): any {
        switch (level) {
            case 'log':
            case 'info':
                this.loggerService.info(message, { queryRunner })
                break
            case 'warn':
                this.loggerService.warn(message, { queryRunner })
                break
            default:
                this.loggerService.debug(message, { queryRunner })
                break
        }
    }

    // 私有方法：清理查询缓存
    private flushQueryBuffer(): void {
        const now = Date.now()
        const expiredKeys: string[] = []

        for (const [key, value] of this.queryBuffer.entries()) {
            if (now - value.lastSeen > this.BUFFER_FLUSH_INTERVAL * 2) {
                expiredKeys.push(key)
            } else if (value.count > 1) {
                // 输出汇总信息
                const [queryType] = key.split(':', 1)
                this.loggerService.debug(`Query summary: ${queryType} executed ${value.count} times in last period`)
            }
        }

        // 清理过期的键
        for (const key of expiredKeys) {
            this.queryBuffer.delete(key)
        }
    }

    // 私有方法：重置统计信息
    private resetStats(): void {
        const now = Date.now()
        const elapsed = now - this.queryStats.lastReset

        if (elapsed > 60000 && this.queryStats.total > 0) { // 1分钟
            this.loggerService.info(`Database stats (last ${Math.round(elapsed / 1000)}s): ${this.queryStats.total} queries, ${this.queryStats.slow} slow, ${this.queryStats.errors} errors`)

            this.queryStats.total = 0
            this.queryStats.slow = 0
            this.queryStats.errors = 0
            this.queryStats.lastReset = now
        }
    }

    // 公共方法：获取当前统计信息
    getStats(): typeof this.queryStats {
        return { ...this.queryStats }
    }
}
