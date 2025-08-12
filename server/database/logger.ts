import { Logger, QueryRunner } from 'typeorm'
import logger, { type ExtendedLogger } from '../utils/logger'

function parametersFormat(parameters?: any[]) {
    if (!parameters?.length) {
        return ''
    }
    return `\n${parameters.map((parameter) => {
        if (parameter instanceof Date) {
            return `'${parameter.toISOString()}'`
        }
        if (typeof parameter === 'string') {
            return `'${parameter}'`
        }
        return `${parameter}`
    }).join(', ')}`
}

export class CustomLogger implements Logger {
    private readonly loggerService: ExtendedLogger

    constructor(loggerService?: ExtendedLogger) {
        this.loggerService = loggerService || logger
    }

    logQuery(query: string, _parameters?: any[]): any {
        this.loggerService.database.query({ query, params: _parameters })
    }

    logQueryError(error: string | Error, query: string, _parameters?: any[]): any {
        this.loggerService.database.error({
            error: error.toString(),
            query,
            stack: error instanceof Error ? error.stack : undefined,
        })
    }

    logQuerySlow(time: number, query: string, _parameters?: any[]): any {
        this.loggerService.database.query({ query, params: _parameters, duration: time })
        this.loggerService.warn(`Slow Query (${time}ms): ${query}${parametersFormat(_parameters)}`)
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
}
