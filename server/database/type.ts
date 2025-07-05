export const getDateType = () => {
    const dbType = process.env.DATABASE_TYPE || 'sqlite'
    switch (dbType) {
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
