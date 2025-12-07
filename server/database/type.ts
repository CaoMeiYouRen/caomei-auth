import { DATABASE_TYPE } from '@/utils/shared/env'

export const getDateType = (dbType?: string) => {
    // 如果没有传入数据库类型，则使用环境变量（考虑Demo模式的强制类型）
    const actualDbType = dbType || DATABASE_TYPE

    switch (actualDbType) {
        case 'sqlite':
            return 'datetime' // SQLite 使用 datetime 类型
        case 'mysql':
            return 'datetime' // MySQL 使用 datetime 类型
        case 'postgres':
            return 'timestamp with time zone' // PostgreSQL 使用 timestamp with time zone 类型
        default:
            return 'datetime' // 默认使用 datetime 类型
    }
}
