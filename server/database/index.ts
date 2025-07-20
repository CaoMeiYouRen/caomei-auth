import ms from 'ms'
import { DataSource, DataSourceOptions } from 'typeorm'
import { Account } from '../entities/account'
import { Session } from '../entities/session'
import { User } from '../entities/user'
import { Verification } from '../entities/verification'
import { TwoFactor } from '../entities/two-factor'
import { SnakeCaseNamingStrategy } from './naming-strategy'
import {
    DATABASE_TYPE,
    DATABASE_PATH,
    DATABASE_URL,
    DATABASE_SSL,
    DATABASE_CHARSET,
    DATABASE_TIMEZONE,
    DATABASE_ENTITY_PREFIX,
} from '@/utils/env'

// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite', 'mysql', 'postgres']

// 连接状态
let isInitialized = false
let AppDataSource: DataSource | null = null

const entities = [Account, Session, User, Verification, TwoFactor]

export const initializeDB = async () => {
    if (isInitialized && AppDataSource) {
        return AppDataSource
    }

    try {
        // 从环境变量获取数据库类型
        const dbType = DATABASE_TYPE

        // 检查数据库类型是否支持
        if (!SUPPORTED_DATABASE_TYPES.includes(dbType)) {
            throw new Error(`Unsupported database type: ${dbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
        }

        // 检查数据库类型是否支持
        if (!SUPPORTED_DATABASE_TYPES.includes(dbType)) {
            throw new Error(`Unsupported database type: ${dbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
        }
        // 数据库配置
        let options: DataSourceOptions

        // 配置数据库连接
        switch (dbType) {
            case 'sqlite':
                options = {
                    type: 'sqlite',
                    database: DATABASE_PATH, // 默认 SQLite 数据库路径
                }
                break
            case 'mysql':
                options = {
                    type: dbType as any,
                    url: DATABASE_URL,
                    supportBigNumbers: true, // 处理数据库中的大数字
                    bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
                    ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false, // 是否启用 SSL
                    connectTimeout: ms('60 s'), // 连接超时设置为 60 秒
                    charset: DATABASE_CHARSET, // 连接的字符集
                    timezone: DATABASE_TIMEZONE, // 连接的时区
                }
                break
            case 'postgres':
                options = {
                    type: dbType as any,
                    url: DATABASE_URL,
                    parseInt8: true, // 解析 bigint 为 number。将 64 位整数（int8）解析为 JavaScript 整数
                    ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false, // 是否启用 SSL
                    extra: {
                        max: 20,
                        connectionTimeoutMillis: ms('60s'), // 连接超时设置为 60 秒
                    },
                }
                break
            default:
                throw new Error(`Unsupported database type: ${dbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
        }

        // 创建数据源
        AppDataSource = new DataSource({
            ...options,
            entities,
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development',
            entityPrefix: DATABASE_ENTITY_PREFIX,   // 所有表（或集合）加的前缀
            namingStrategy: new SnakeCaseNamingStrategy(), // 表、字段命名策略，改为 snake_case
            cache: false, // 是否启用实体结果缓存
            maxQueryExecutionTime: 3000, // 记录耗时长的查询
        })

        try {
            // 初始化连接
            await AppDataSource.initialize()
            // 更新连接状态
            isInitialized = true
            console.log(`Database initialized successfully with type: ${dbType}`)
        } catch (error: any) {
            console.error('Error initializing database:', error)
            throw new Error(`Database initialization failed: ${error.message}`)
        }
    } catch (error: any) {
        console.error('Error creating database configuration:', error)
        throw error
    }

    return AppDataSource
}

export const dataSource = await initializeDB()
