import { DataSource, DataSourceOptions } from 'typeorm'
import ms from 'ms'
import { Account } from '../entities/account'
import { Session } from '../entities/session'
import { User } from '../entities/user'
import { Verification } from '../entities/verification'
import { SnakeCaseNamingStrategy } from './naming-strategy'

const entities = [Account, Session, User, Verification]
// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite', 'mysql', 'postgres']

// 连接状态
let isInitialized = false

let AppDataSource: DataSource = null as any

export const initializeDB = async () => {
    if (!isInitialized) {
        // 从环境变量获取数据库类型
        const dbType = process.env.DATABASE_TYPE || 'sqlite'

        // 检查数据库类型是否支持
        if (!SUPPORTED_DATABASE_TYPES.includes(dbType)) {
            throw new Error(`Unsupported database type: ${dbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
        }
        // 数据库配置
        let options: DataSourceOptions = {
        } as any
        // 配置数据库连接
        switch (dbType) {
            case 'sqlite':
                options = {
                    type: 'sqlite',
                    database: process.env.DATABASE_PATH || 'database/caomei-auth.sqlite', // 默认 SQLite 数据库路径
                }
                break
            case 'mysql':
                options = {
                    type: dbType as any,
                    url: process.env.DATABASE_URL,
                    supportBigNumbers: true, // 处理数据库中的大数字
                    bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
                    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false, // 是否启用 SSL
                    connectTimeout: ms('60 s'), // 连接超时设置为 60 秒
                    charset: process.env.DATABASE_CHARSET || 'utf8_general_ci', // 连接的字符集。
                    timezone: process.env.DATABASE_TIMEZONE || 'local', // 连接的时区。
                }
                break
            case 'postgres':
                options = {
                    type: dbType as any,
                    url: process.env.DATABASE_URL,
                    parseInt8: true, // 解析 bigint 为 number。将 64 位整数（int8）解析为 JavaScript 整数
                    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false, // 是否启用 SSL
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
            entities: [...entities],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development',
            entityPrefix: process.env.DATABASE_ENTITY_PREFIX || 'caomei_auth_',   // 所有表（或集合）加的前缀
            namingStrategy: new SnakeCaseNamingStrategy(),            // 表、字段命名策略，改为 snake_case
            cache: false,            // 是否启用实体结果缓存
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
    }
    return AppDataSource
}

export const dataSource = await initializeDB()
