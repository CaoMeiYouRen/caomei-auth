import { DATABASE_TYPE } from '@/utils/shared/env'

/**
 * 登录事件时间分桶的方言 SQL。
 *
 * 分桶必须落在数据库侧（`GROUP BY`），内存与传输只随桶数增长；同时必须保持 UTC 口径，
 * 不能让 `DATE()` / `DATE_FORMAT()` 跟着数据库会话时区漂移（口径见
 * `docs/design/security-observability.md` §8）：
 * - SQLite：`created_at` 由驱动写为 UTC 文本，`strftime` 直接取 UTC 分量。
 * - PostgreSQL：`created_at` 为 `timestamptz`，`AT TIME ZONE 'UTC'` 还原 UTC 墙钟。
 * - MySQL：`created_at` 为 `DATETIME`。普通插入由 TypeORM 对 `@CreateDateColumn` 发 `DEFAULT`，
 *   数据库按会话 `time_zone` 生成 `CURRENT_TIMESTAMP`；显式回填 `createdAt` 时 mysql2 按
 *   `DATABASE_TIMEZONE` 序列化为墙钟。`UNIX_TIMESTAMP` 一律按会话 `time_zone` 解释回 epoch，
 *   再按 epoch 整除得到 UTC 日 / 小时，避免依赖时区表（`CONVERT_TZ` 在未加载时区表时返回 `NULL`）。
 *   前提：会话 `time_zone` 与 `DATABASE_TIMEZONE` 一致，否则回填行桶整体平移、默认值行读回的时间也平移。
 *   部署时用 `SELECT @@session.time_zone` 核对。
 */

export type LoginEventBucketUnit = 'hour' | 'day'

const SECONDS_PER_HOUR = 60 * 60
const SECONDS_PER_DAY = 24 * 60 * 60

/**
 * 返回按 UTC 分桶的 SQL 表达式，结果格式与 `formatBucket` 一致：
 * 小时 `YYYY-MM-DD HH:00`，天 `YYYY-MM-DD`。
 *
 * `alias` 必须是查询构造器里的实体别名（如 `event`），列名用属性名交给 TypeORM 替换。
 */
export function getLoginEventBucketExpression(
    unit: LoginEventBucketUnit,
    options: { alias?: string, dbType?: string } = {},
): string {
    const alias = options.alias ?? 'event'
    const dbType = options.dbType ?? DATABASE_TYPE
    const column = `${alias}.createdAt`
    switch (dbType) {
        case 'mysql':
            return unit === 'hour'
                ? `DATE_FORMAT(DATE_ADD('1970-01-01 00:00:00', INTERVAL (FLOOR(UNIX_TIMESTAMP(${column}) / ${SECONDS_PER_HOUR})) HOUR), '%Y-%m-%d %H:00')`
                : `DATE_FORMAT(DATE_ADD('1970-01-01', INTERVAL (FLOOR(UNIX_TIMESTAMP(${column}) / ${SECONDS_PER_DAY})) DAY), '%Y-%m-%d')`
        case 'postgres':
            return unit === 'hour'
                ? `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:00')`
                : `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`
        default:
            return unit === 'hour'
                ? `strftime('%Y-%m-%d %H:00', ${column})`
                : `strftime('%Y-%m-%d', ${column})`
    }
}

/** 分桶标签校验：用于丢弃方言差异产生的异常值，避免脏桶进入响应 */
export function isLoginEventBucketLabel(value: unknown, unit: LoginEventBucketUnit): value is string {
    if (typeof value !== 'string') {
        return false
    }
    return unit === 'hour'
        ? /^\d{4}-\d{2}-\d{2} \d{2}:00$/u.test(value)
        : /^\d{4}-\d{2}-\d{2}$/u.test(value)
}
