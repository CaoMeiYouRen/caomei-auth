import { ms } from 'ms'
import { DataSource, type DataSourceOptions } from 'typeorm'
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
} from '@/utils/shared/env'

/**
 * Demo 模式数据预填充函数 - 异步执行以避免死锁
 */
function scheduleDemoDataPopulation(): void {
    // 使用 setImmediate 异步执行，避免与 better-auth 初始化产生死锁
    setImmediate(async () => {
        try {
            await populateDemoDataAsync()
        } catch (error: any) {
            logger.error(`Demo模式数据填充失败: ${error.message}`)
        }
    })
}

/**
 * 实际的 Demo 模式数据预填充逻辑
 */
async function populateDemoDataAsync(): Promise<void> {
    if (!AppDataSource) {
        throw new Error('Database not initialized')
    }

    try {
        logger.info('开始填充Demo模式假数据...')

        // 导入 better-auth 实例（避免循环依赖）
        const { auth } = await import('@/lib/auth')
        const { generateDemoUsers, generateDemoOAuthApps, generateDemoSSOProviders, getDemoConfig } = await import('../utils/demo-data-generator')

        const demoConfig = getDemoConfig()

        // 获取仓库
        const userRepository = AppDataSource.getRepository(User)
        const oauthAppRepository = AppDataSource.getRepository(OAuthApplication)
        const ssoProviderRepository = AppDataSource.getRepository(SSOProvider)

        // 检查是否已存在演示数据
        const existingAdminUser = await userRepository.findOne({
            where: { email: demoConfig.adminUser.email },
        })

        if (existingAdminUser) {
            logger.info('Demo模式数据已存在，跳过填充')
            return
        }

        // 使用 better-auth API 创建管理员用户
        const adminUser = await auth.api.createUser({
            body: {
                name: demoConfig.adminUser.name,
                email: demoConfig.adminUser.email,
                password: demoConfig.password,
                role: demoConfig.adminUser.role as 'admin',
                data: {
                    username: demoConfig.adminUser.username,
                    displayUsername: demoConfig.adminUser.username,
                    phoneNumber: demoConfig.adminUser.phoneNumber, // 去掉掩码字符
                    phoneNumberVerified: demoConfig.adminUser.phoneNumberVerified,
                    image: demoConfig.adminUser.image,
                    emailVerified: demoConfig.adminUser.emailVerified,
                },
            },
        })

        // 使用 better-auth API 创建普通用户
        await auth.api.createUser({
            body: {
                name: demoConfig.normalUser.name,
                email: demoConfig.normalUser.email,
                password: demoConfig.password,
                role: demoConfig.normalUser.role as 'user',
                data: {
                    username: demoConfig.normalUser.name,
                    displayUsername: demoConfig.normalUser.name,
                    phoneNumber: demoConfig.normalUser.phoneNumber, // 去掉掩码字符
                    phoneNumberVerified: demoConfig.normalUser.phoneNumberVerified,
                    image: demoConfig.normalUser.image,
                    emailVerified: demoConfig.normalUser.emailVerified,
                },
            },
        })

        // 生成其他假数据
        const demoUsers = generateDemoUsers(50)
        const demoOAuthApps = generateDemoOAuthApps(15)
        const demoSSOProviders = generateDemoSSOProviders(8)

        // 批量创建假用户
        let createdUsersCount = 2 // （因为已经创建了管理员和普通用户）
        for (const userData of demoUsers) {
            try {
                // 清理数据，去掉掩码字符
                const cleanEmail = userData.email

                const cleanPhoneNumber = userData.phoneNumber

                await auth.api.createUser({
                    body: {
                        name: userData.name,
                        email: cleanEmail,
                        password: demoConfig.password,
                        role: (userData.role || 'user') as 'user' | 'admin',
                        data: {
                            username: userData.name.toLowerCase(),
                            displayUsername: userData.name,
                            phoneNumber: cleanPhoneNumber,
                            phoneNumberVerified: cleanPhoneNumber ? userData.phoneNumberVerified : false,
                            image: userData.image,
                            emailVerified: userData.emailVerified,
                            banned: userData.status === 'suspended',
                            banReason: userData.status === 'suspended' ? '演示账号' : undefined,
                        },
                    },
                })
                createdUsersCount++

                // 添加小延迟避免创建过快
                if (createdUsersCount % 10 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 50))
                }
            } catch (error: any) {
                // 跳过创建失败的用户，继续创建其他用户
                logger.warn(`创建假用户失败: ${error.message}`)
            }
        }

        // 批量插入假的 OAuth 应用数据
        for (const appData of demoOAuthApps) {
            try {
                const app = oauthAppRepository.create({
                    name: appData.name,
                    clientId: appData.clientId,
                    clientSecret: appData.clientSecret,
                    redirectURLs: appData.redirectUris.join('\n'), // 注意字段名是 redirectURLs
                    description: appData.description,
                    logoUri: appData.logo,
                    scope: appData.scopes.join(' '),
                    disabled: appData.status === 'inactive',
                    type: 'web', // 设置默认类型
                    userId: adminUser.user.id, // 所有演示应用归属于管理员
                    createdAt: appData.createdAt,
                    updatedAt: appData.updatedAt,
                })
                await oauthAppRepository.save(app)
            } catch (error: any) {
                logger.warn(`创建OAuth应用失败: ${error.message}`)
            }
        }

        // 批量插入假的 SSO 提供商数据
        for (const providerData of demoSSOProviders) {
            try {
                const provider = ssoProviderRepository.create({
                    issuer: `https://${providerData.providerId}.example.com`,
                    domain: `${providerData.providerId}.example.com`,
                    providerId: providerData.providerId,
                    name: providerData.name,
                    description: providerData.description,
                    oidcConfig: JSON.stringify({
                        clientId: providerData.clientId,
                        clientSecret: providerData.clientSecret,
                        issuerUrl: providerData.issuerUrl,
                        authorizationUrl: providerData.authorizationUrl,
                        tokenUrl: providerData.tokenUrl,
                        userInfoUrl: providerData.userInfoUrl,
                        scopes: providerData.scopes,
                        enabled: providerData.enabled,
                    }),
                    organizationId: undefined, // Demo 模式下不设置组织
                    userId: adminUser.user.id, // 归属于管理员
                    createdAt: providerData.createdAt,
                    updatedAt: providerData.updatedAt,
                })
                await ssoProviderRepository.save(provider)
            } catch (error: any) {
                logger.warn(`创建SSO提供商失败: ${error.message}`)
            }
        }

        logger.info(`Demo模式假数据填充完成：
- 用户：2个演示账号 + ${createdUsersCount - 2}个假用户
- OAuth应用：${demoOAuthApps.length}个
- SSO提供商：${demoSSOProviders.length}个
- 演示账号密码：${demoConfig.password}`)

    } catch (error: any) {
        logger.error(`Demo模式数据填充失败: ${error.message}`)
        // 不抛出错误，避免影响应用启动
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
    const actualDbType = dbType
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
                type: 'better-sqlite3',
                database: DATABASE_PATH, // Demo 模式使用内存数据库
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
        synchronize: DEMO_MODE || isTestEnv || process.env.NODE_ENV !== 'production', // 测试环境总是同步表结构
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
            scheduleDemoDataPopulation()
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
