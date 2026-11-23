import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { resolveLoginEventRetentionDays } from '../../utils/shared/login-event-retention.ts'

/**
 * 登录事件保留期清理脚本。
 *
 * 默认 dry-run，只打印截止时间与候选数量；显式 `--confirm` 才删除。
 * 支持 SQLite / MySQL / PostgreSQL：方言由 `DATABASE_TYPE` 选择（与
 * `scripts/security/revoke-two-factor-sessions.mjs` 同一模式），删除语句参数化，
 * 表名前缀仍受校验。
 *
 * 用法：
 *   node scripts/maintenance/prune-login-events.mjs [--dry-run] [--confirm]
 *     [--days=90] [--database=database/caomei-auth.sqlite]
 *
 * MySQL / PostgreSQL 连接使用 `DATABASE_URL`；`--database` 只对 SQLite 生效。
 */

export const SCRIPT_NAME = 'prune-login-events'

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export function parseArgs(argv) {
    const args = { confirm: false, dryRun: false, days: undefined, database: undefined, help: false }
    for (const arg of argv) {
        if (arg === '--confirm') {
            args.confirm = true
        } else if (arg === '--dry-run') {
            args.dryRun = true
        } else if (arg === '--help' || arg === '-h') {
            args.help = true
        } else if (arg.startsWith('--days=')) {
            args.days = arg.slice('--days='.length)
        } else if (arg.startsWith('--database=')) {
            args.database = arg.slice('--database='.length)
        } else {
            throw new Error(`Unknown argument: ${arg}`)
        }
    }
    if (args.confirm && args.dryRun) {
        throw new Error('--confirm and --dry-run cannot be used together')
    }
    return args
}

/** 校验表前缀，避免把环境变量拼进 SQL 造成注入 */
export function resolveTableName(prefix = process.env.DATABASE_ENTITY_PREFIX || 'caomei_auth_') {
    if (!/^[A-Za-z0-9_]*$/u.test(prefix)) {
        throw new Error(`Invalid DATABASE_ENTITY_PREFIX: ${prefix}`)
    }
    return `${prefix}login_event`
}

/** SQLite 中 TypeORM 的 datetime 以 UTC `YYYY-MM-DD HH:MM:SS` 存储 */
export function toSqliteDatetime(date) {
    return date.toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * 按方言返回统计 / 删除语句：PostgreSQL 用 `$1`，SQLite / MySQL 用 `?`。
 * 两处谓词完全相同，只是占位符风格不同。
 */
export function buildPruneSql(type, table) {
    if (!/^[A-Za-z0-9_]+$/u.test(table)) {
        throw new Error(`Invalid table name: ${table}`)
    }
    const placeholder = type === 'postgres' ? '$1' : '?'
    return {
        count: `SELECT COUNT(*) AS count FROM ${table} WHERE created_at < ${placeholder}`,
        delete: `DELETE FROM ${table} WHERE created_at < ${placeholder}`,
    }
}

/**
 * 截止时间的参数形态：SQLite 需显式 UTC 文本；MySQL / PostgreSQL 直接传 `Date`，
 * 由驱动按连接时区 / 时区感知类型序列化，避免手工格式化引入偏差。
 */
export function serializeCutoff(type, cutoff) {
    return type === 'sqlite' ? toSqliteDatetime(cutoff) : cutoff
}

export function buildPrunePlan({ days, now = new Date() }) {
    return { cutoff: new Date(now.getTime() - days * MILLISECONDS_PER_DAY) }
}

/**
 * MySQL 连接选项：继承 app 的 `DATABASE_TIMEZONE` 与 `DATABASE_SSL`，
 * 否则 mysql2 会按脚本进程时区序列化截止时间，`DELETE` 会偏移。
 */
export function buildMysqlOptions(env = process.env) {
    return {
        timezone: env.DATABASE_TIMEZONE || 'local',
        ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
}

/** PostgreSQL 连接选项：与 app 保持 `DATABASE_SSL` 口径一致 */
export function buildPostgresOptions(env = process.env) {
    return {
        ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
}

/**
 * 通用清理入口：`client` 只需提供 `all(sql, params)` 与 `run(sql, params)`，
 * 由各方言适配器注入；默认 dry-run 只统计不删除。
 */
export async function pruneLoginEventsWithClient(client, options) {
    const { type = 'sqlite', table, days, now = new Date(), dryRun = true } = options
    const { cutoff } = buildPrunePlan({ days, now })
    const sql = buildPruneSql(type, table)
    const params = [serializeCutoff(type, cutoff)]
    const rows = await client.all(sql.count, params)
    const candidates = Number(rows[0]?.count ?? 0)
    if (dryRun) {
        return { cutoff, candidates, deleted: 0 }
    }
    const deleted = await client.run(sql.delete, params)
    return { cutoff, candidates, deleted: Number(deleted ?? 0) }
}

function createSqliteClient(db) {
    return {
        all: async (sql, params) => db.prepare(sql).all(...params),
        run: async (sql, params) => db.prepare(sql).run(...params).changes,
    }
}

/** SQLite 便捷入口：保持既有调用方（测试 / 文档示例）可直接传 better-sqlite3 实例 */
export async function pruneLoginEventsInDatabase(db, options) {
    return pruneLoginEventsWithClient(createSqliteClient(db), { ...options, type: 'sqlite' })
}

async function withSqlite(databasePath, dryRun, run) {
    const db = new Database(databasePath, { readonly: dryRun, fileMustExist: true })
    try {
        return await run(createSqliteClient(db))
    } finally {
        db.close()
    }
}

async function withMysql(url, env, run) {
    if (!url) {
        throw new Error('DATABASE_URL is required for MySQL')
    }
    const mysql = await import('mysql2/promise')
    const connection = await mysql.createConnection({ uri: url, ...buildMysqlOptions(env) })
    try {
        return await run({
            all: async (sql, params) => {
                const [rows] = await connection.execute(sql, params)
                return rows
            },
            run: async (sql, params) => {
                const [result] = await connection.execute(sql, params)
                return result.affectedRows ?? 0
            },
        })
    } finally {
        await connection.end()
    }
}

async function withPostgres(url, env, run) {
    if (!url) {
        throw new Error('DATABASE_URL is required for PostgreSQL')
    }
    const { Client } = await import('pg')
    const client = new Client({ connectionString: url, ...buildPostgresOptions(env) })
    await client.connect()
    try {
        return await run({
            all: async (sql, params) => (await client.query(sql, params)).rows,
            run: async (sql, params) => (await client.query(sql, params)).rowCount ?? 0,
        })
    } finally {
        await client.end()
    }
}

async function withConnection(env, databasePath, dryRun, run) {
    const type = env.DATABASE_TYPE || 'sqlite'
    if (type === 'sqlite') {
        return withSqlite(databasePath, dryRun, run)
    }
    if (type === 'mysql') {
        return withMysql(env.DATABASE_URL, env, run)
    }
    if (type === 'postgres') {
        return withPostgres(env.DATABASE_URL, env, run)
    }
    throw new Error(`Unsupported DATABASE_TYPE: ${type}`)
}

function printHelp(output = process.stdout) {
    output.write(`Usage: node scripts/maintenance/${SCRIPT_NAME}.mjs [options]

  --dry-run            Only report candidates (default)
  --confirm            Delete expired events
  --days=<n>           Retention days (default LOGIN_EVENT_RETENTION_DAYS or 90)
  --database=<path>    SQLite database path (default DATABASE_PATH; SQLite only)

Dialect: DATABASE_TYPE=sqlite|mysql|postgres (MySQL / PostgreSQL use DATABASE_URL)
`)
}

export async function run(argv = process.argv.slice(2), env = process.env, output = process.stdout) {
    const args = parseArgs(argv)
    if (args.help) {
        printHelp(output)
        return 0
    }
    const type = env.DATABASE_TYPE || 'sqlite'
    const days = resolveLoginEventRetentionDays(args.days ?? env.LOGIN_EVENT_RETENTION_DAYS)
    const databasePath = args.database || env.DATABASE_PATH || 'database/caomei-auth.sqlite'
    const table = resolveTableName(env.DATABASE_ENTITY_PREFIX)
    const dryRun = !args.confirm
    const plan = await withConnection(env, databasePath, dryRun, (client) => pruneLoginEventsWithClient(client, {
        type,
        table,
        days,
        dryRun,
    }))
    output.write(`[${SCRIPT_NAME}] type=${type} mode=${dryRun ? 'dry-run' : 'confirm'} retentionDays=${days} `
        + `cutoff=${plan.cutoff.toISOString()} candidates=${plan.candidates} deleted=${plan.deleted}\n`)
    if (dryRun) {
        output.write(`[${SCRIPT_NAME}] dry-run only; pass --confirm to delete\n`)
    }
    return 0
}

const isDirectRun = typeof process.argv[1] === 'string'
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
    try {
        process.exitCode = await run()
    } catch (error) {
        process.stderr.write(`[${SCRIPT_NAME}] ${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
    }
}
