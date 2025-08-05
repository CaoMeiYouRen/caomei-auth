import path from 'path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LOGFILES, LOG_LEVEL } from '@/utils/env'

function createLogger() {
    const logDir = path.resolve('logs')
    const format = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
        winston.format.splat(),
        winston.format.printf((info: any) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    )

    const dailyRotateFileOption = {
        dirname: logDir,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '20m',
        maxFiles: '31d',
        format,
        auditFile: path.join(logDir, '.audit.json'),
    }
    const winstonLogger = winston.createLogger({
        level: LOG_LEVEL,
        exitOnError: false,
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    winston.format.ms(),
                    winston.format.splat(),
                    winston.format.printf((info) => {
                        const infoLevel = winston.format.colorize().colorize(info.level, `[${info.timestamp}] ${info.level}`)
                        return `${infoLevel}: ${info.message}`
                    }),
                ),
            }),
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                filename: '%DATE%.log',
            }),
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean) as winston.transport[],
        exceptionHandlers: [
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean),
        rejectionHandlers: [
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean),
    })
    return winstonLogger
}

const logger = createLogger()

export default logger
