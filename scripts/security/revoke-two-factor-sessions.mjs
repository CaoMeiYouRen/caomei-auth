import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

/**
 * 批量撤销 2FA 用户会话（阶段 12 M4.3 / D24）。
 *
 * 默认 dry-run：只打印目标用户数与会话数；显式 `--confirm` 才删除。
 * 支持 SQLite / MySQL / PostgreSQL，通过 `DATABASE_TYPE` 与对应连接变量选择。
 *
 * D14 边界：脚本只撤销当前会话，不回溯已有会话在启用 2FA 前的免挑战语义；
 * 撤销后用户需重新登录，并会按当前 2FA 策略重新校验。
 *
 * 用法：
 *   node scripts/security/revoke-two-factor-sessions.mjs [--dry-run] [--confirm]
 *     [--user=<userId>]
 */

export const SCRIPT_NAME = 'revoke-two-factor-sessions'

export function parseArgs(argv) {
    const args = { confirm: false, dryRun: false, user: undefined, help: false }
    for (const arg of argv) {
        if (arg === '--confirm') {
            args.confirm = true
        } else if (arg === '--dry-run') {
            args.dryRun = true
        } else if (arg === '--help' || arg === '-h') {
            args.help = true
        } else if (arg.startsWith('--user=')) {
            args.user = arg.slice('--user='.length)
        } else {
            throw new Error(`Unknown argument: ${arg}`)
        }
    }
    if (args.confirm && args.dryRun) {
        throw new Error('--confirm and --dry-run cannot be used together')
    }
    if (args.user !== undefined && !args.user.trim()) {
        throw new Error('--user requires a non-empty user id')
    }
    return args
}

export function resolvePrefix(env = process.env) {
    const prefix = env.DATABASE_ENTITY_PREFIX ?? 'caomei_auth_'
    if (!/^[A-Za-z0-9_]*$/u.test(prefix)) {
        throw new Error(`Invalid DATABASE_ENTITY_PREFIX: ${prefix}`)
    }
    return prefix
}

/** 目标用户 / 会话统计与删除 SQL；`placeholder(n)` 按方言返回 `?` 或 `$n` */
export function buildRevokeSql(type, prefix, userId) {
    const userTable = `${prefix}user`
    const sessionTable = `${prefix}session`
    const placeholder = type === 'postgres' ? (index) => `$${index}` : () => '?'
    const userFilter = userId ? ` AND id = ${placeholder(1)}` : ''
    const twoFactorPredicate = type === 'postgres' ? 'two_factor_enabled IS TRUE' : 'two_factor_enabled = 1'
    const targetWhere = `${twoFactorPredicate}${userFilter}`
    const userParams = userId ? [userId] : []
    return {
        countUsers: `SELECT COUNT(*) AS count FROM ${userTable} WHERE ${targetWhere}`,
        countSessions: `SELECT COUNT(*) AS count FROM ${sessionTable} WHERE user_id IN (SELECT id FROM ${userTable} WHERE ${targetWhere})`,
        deleteSessions: `DELETE FROM ${sessionTable} WHERE user_id IN (SELECT id FROM ${userTable} WHERE ${targetWhere})`,
        userParams,
    }
}

async function withSqlite(databasePath, run) {
    const db = new Database(databasePath, { fileMustExist: true })
    try {
        return await run({
            all: async (sql, params) => db.prepare(sql).all(...params),
            run: async (sql, params) => db.prepare(sql).run(...params).changes,
        })
    } finally {
        db.close()
    }
}

async function withMysql(url, run) {
    const mysql = await import('mysql2/promise')
    const connection = await mysql.createConnection(url)
    try {
        return await run({
            all: async (sql, params) => {
                const [rows] = await connection.execute(sql, params)
                return rows
            },
            run: async (sql, params) => {
                const [result] = await connection.execute(sql, params)
                return result
            },
        })
    } finally {
        await connection.end()
    }
}

async function withPostgres(url, run) {
    const { Client } = await import('pg')
    const client = new Client({ connectionString: url })
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

async function withConnection(env, run) {
    const type = env.DATABASE_TYPE || 'sqlite'
    if (type === 'sqlite') {
        return withSqlite(env.DATABASE_PATH || 'database/caomei-auth.sqlite', run)
    }
    if (type === 'mysql') {
        return withMysql(env.DATABASE_URL, run)
    }
    if (type === 'postgres') {
        return withPostgres(env.DATABASE_URL, run)
    }
    throw new Error(`Unsupported DATABASE_TYPE: ${type}`)
}

export async function run(argv = process.argv.slice(2), env = process.env, output = process.stdout) {
    const args = parseArgs(argv)
    if (args.help) {
        output.write(`Usage: node scripts/security/${SCRIPT_NAME}.mjs [--dry-run] [--confirm] [--user=<id>]\n`)
        return 0
    }
    const type = env.DATABASE_TYPE || 'sqlite'
    const prefix = resolvePrefix(env)
    const sql = buildRevokeSql(type, prefix, args.user)
    const dryRun = !args.confirm

    const result = await withConnection(env, async (client) => {
        const users = await client.all(sql.countUsers, sql.userParams)
        const sessions = await client.all(sql.countSessions, sql.userParams)
        const userCount = Number(users[0]?.count ?? 0)
        const sessionCount = Number(sessions[0]?.count ?? 0)
        if (dryRun || sessionCount === 0) {
            return { userCount, sessionCount, deleted: 0 }
        }
        output.write(`[${SCRIPT_NAME}] about to delete type=${type} users=${userCount} sessions=${sessionCount}\n`)
        const deleted = await client.run(sql.deleteSessions, sql.userParams)
        return { userCount, sessionCount, deleted: Number(deleted ?? sessionCount) }
    })

    output.write(`[${SCRIPT_NAME}] type=${type} mode=${dryRun ? 'dry-run' : 'confirm'} users=${result.userCount} sessions=${result.sessionCount} deleted=${result.deleted}\n`)
    if (dryRun) {
        output.write(`[${SCRIPT_NAME}] dry-run only; pass --confirm to revoke sessions\n`)
    }
    output.write(`[${SCRIPT_NAME}] D14: existing sessions are revoked; users must sign in again and pass current 2FA policy\n`)
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
