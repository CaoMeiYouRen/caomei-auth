import path from 'path'
import ms from 'ms'
import { DataSource, DataSourceOptions } from 'typeorm'
import { Account } from '../entities/account'
import { Session } from '../entities/session'
import { User } from '../entities/user'
import { Verification } from '../entities/verification'
import { TwoFactor } from '../entities/two-factor'
import { OAuthAccessToken } from '../entities/oauth-access-token'
import { OAuthApplication } from '../entities/oauth-application'
import { OAuthConsent } from '../entities/oauth-consent'
import { Jwks } from '../entities/jwks'
import { SSOProvider } from '../entities/sso-provider'
import logger from '../utils/logger'
import { CustomLogger } from './logger'
import { SnakeCaseNamingStrategy } from './naming-strategy'
import {
    DATABASE_TYPE,
    DATABASE_PATH,
    DATABASE_URL,
    DATABASE_SSL,
    DATABASE_CHARSET,
    DATABASE_TIMEZONE,
    DATABASE_ENTITY_PREFIX,
    DEMO_MODE,
} from '@/utils/env'

/**
 * Demo 模式数据预填充函数
 */
async function populateDemoData(): Promise<void> {
    if (!AppDataSource) {
        throw new Error('Database not initialized')
    }

    try {
        logger.info('开始填充Demo模式假数据...')

        // 这里可以添加预填充假数据的逻辑
        // 目前暂时只记录日志，具体的数据预填充可以在后续实现

        logger.info('Demo模式假数据填充完成')
    } catch (error: any) {
        logger.error(`Demo模式数据填充失败: ${error.message}`)
        throw error
    }
}

// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite', 'mysql', 'postgres']

// 连接状态
let isInitialized = false
let AppDataSource: DataSource | null = null

const entities = [Account, Session, User, Verification, TwoFactor, OAuthApplication, OAuthAccessToken, OAuthConsent, Jwks, SSOProvider]

export const initializeDB = async () => {
    if (isInitialized && AppDataSource) {
        return AppDataSource
    }

    // 从环境变量获取数据库类型
    const dbType = DATABASE_TYPE

    // Demo 模式强制使用内存 SQLite 数据库
    const actualDbType = DEMO_MODE ? 'sqlite' : dbType
    const isMemoryDB = DEMO_MODE

    // 检查数据库类型是否支持
    if (!SUPPORTED_DATABASE_TYPES.includes(actualDbType)) {
        throw new Error(`Unsupported database type: ${actualDbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
    }

    // 数据库配置
    let options: DataSourceOptions

    // 配置数据库连接
    switch (actualDbType) {
        case 'sqlite':
            options = {
                type: 'sqlite',
                database: isMemoryDB ? ':memory:' : DATABASE_PATH, // Demo 模式使用内存数据库
            }
            break
        case 'mysql':
            options = {
                type: actualDbType as any,
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
                type: actualDbType as any,
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
            throw new Error(`Unsupported database type: ${actualDbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
    }

    // 检查是否为测试环境
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

    // 创建数据源
    AppDataSource = new DataSource({
        ...options,
        entities,
        synchronize: isTestEnv || process.env.NODE_ENV !== 'production', // 测试环境总是同步表结构
        logging: isTestEnv ? false : process.env.NODE_ENV === 'development', // 测试时禁用日志
        logger: isTestEnv ? undefined : new CustomLogger(), // 测试时不使用自定义日志器
        entityPrefix: DATABASE_ENTITY_PREFIX, // 所有表（或集合）加的前缀
        namingStrategy: new SnakeCaseNamingStrategy(), // 表、字段命名策略，改为 snake_case
        cache: false, // 是否启用实体结果缓存
        maxQueryExecutionTime: isTestEnv ? 10000 : 3000, // 测试时允许更长的查询时间
    })

    try {
        // 初始化连接
        await AppDataSource.initialize()
        // 更新连接状态
        isInitialized = true

        // Demo 模式下预填充假数据
        if (DEMO_MODE && isMemoryDB) {
            await populateDemoData()
        }

        // 测试环境时减少日志输出
        if (!isTestEnv) {
            logger.system.startup({
                dbType: actualDbType,
                env: process.env.NODE_ENV,
                port: Number(process.env.PORT || process.env.NITRO_PORT || 3000),
            })
            logger.info(`Database initialized successfully with type: ${actualDbType}${isMemoryDB ? ' (memory)' : ''}${DEMO_MODE ? ' [DEMO MODE]' : ''}`)
        }
    } catch (error: any) {
        // 测试环境时也需要记录错误，但使用较低级别
        if (isTestEnv) {
            logger.error(`Database initialization failed: ${error.message}`)
        } else {
            // 使用专门的数据库错误日志记录详细信息
            logger.database.error({
                error: error.message,
                stack: error.stack,
                query: `database_initialization (${actualDbType})`,
            })
        }

        // 直接抛出原始错误，避免多层包装
        throw error
    }

    return AppDataSource
}

export const dataSource = await initializeDB()
