import { DataSource } from 'typeorm'
import ms from 'ms'
import { Account } from '../entities/account'
import { Session } from '../entities/session'
import { User } from '../entities/user'
import { Verification } from '../entities/verification'
import { SnakeCaseNamingStrategy } from './naming-strategy'

const entities = [Account, Session, User, Verification]
export const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL, // 如果使用环境变量配置数据库连接
    entities: [...entities],
    // migrations: [],
    // migrationsRun: true,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false, // 是否启用 SSL
    extra: {
        max: 20,
        connectionTimeoutMillis: ms('60s'), // 连接超时设置为 60 秒
    },
    // 所有表（或集合）加的前缀
    entityPrefix: process.env.ENTITY_PREFIX || 'caomei_auth_',
    // 表、字段命名策略，改为 snake_case
    namingStrategy: new SnakeCaseNamingStrategy(),
    // 是否启用实体结果缓存
    cache: false,
    parseInt8: true, // 解析 bigint 为 number。将 64 位整数（int8）解析为 JavaScript 整数
})

// 初始化连接（在 app 启动时调用）
// dataSource.initialize()
// .then((conn) => {
//     console.log(conn.entityMetadatas.find((e) => e.name === 'User'))
// })
