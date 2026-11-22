import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { resolveLoginEventRetentionDays } from '../../utils/shared/login-event-retention.ts'

/**
 * 登录事件保留期清理脚本（阶段 12 M1.3 / D19）。
 *
 * 默认 dry-run，只打印截止时间与候选数量；显式 `--confirm` 才删除。
 * 仅支持 SQLite（项目自部署默认库）；MySQL / PostgreSQL 由管理端统计查询的
 * 惰性清理覆盖。
 *
 * 用法：
 *   node scripts/maintenance/prune-login-events.mjs [--dry-run] [--confirm]
 *     [--days=90] [--database=database/caomei-auth.sqlite]
 */

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

export function buildPrunePlan({ days, now = new Date() }) {
    const cutoff = new Date(now.getTime() - days * MILLISECONDS_PER_DAY)
    return { cutoff, cutoffSql: toSqliteDatetime(cutoff) }
}

export function pruneLoginEventsInDatabase(db, options) {
    const { table, days, now = new Date(), dryRun = true } = options
    const { cutoff, cutoffSql } = buildPrunePlan({ days, now })
    const countRow = db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE created_at < ?`).get(cutoffSql)
    const candidates = Number(countRow?.count ?? 0)
    if (dryRun) {
        return { cutoff, candidates, deleted: 0 }
    }
    const result = db.prepare(`DELETE FROM ${table} WHERE created_at < ?`).run(cutoffSql)
    return { cutoff, candidates, deleted: Number(result.changes ?? 0) }
}

function printHelp() {
    process.stdout.write(`Usage: node scripts/maintenance/prune-login-events.mjs [options]

  --dry-run            Only report candidates (default)
  --confirm            Delete expired events
  --days=<n>           Retention days (default LOGIN_EVENT_RETENTION_DAYS or 90)
  --database=<path>    SQLite database path (default DATABASE_PATH)
`)
}

export function run(argv = process.argv.slice(2), env = process.env) {
    const args = parseArgs(argv)
    if (args.help) {
        printHelp()
        return 0
    }
    const days = resolveLoginEventRetentionDays(args.days ?? env.LOGIN_EVENT_RETENTION_DAYS)
    const databasePath = args.database || env.DATABASE_PATH || 'database/caomei-auth.sqlite'
    const table = resolveTableName(env.DATABASE_ENTITY_PREFIX)
    const dryRun = !args.confirm
    const db = new Database(databasePath, { readonly: dryRun, fileMustExist: true })
    try {
        const plan = pruneLoginEventsInDatabase(db, { table, days, dryRun })
        process.stdout.write(`[login-events] mode=${dryRun ? 'dry-run' : 'confirm'} retentionDays=${days} `
            + `cutoff=${plan.cutoff.toISOString()} candidates=${plan.candidates} deleted=${plan.deleted}\n`)
        if (dryRun) {
            process.stdout.write('[login-events] dry-run only; pass --confirm to delete\n')
        }
    } finally {
        db.close()
    }
    return 0
}

const isDirectRun = typeof process.argv[1] === 'string'
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
    try {
        process.exitCode = run()
    } catch (error) {
        process.stderr.write(`[login-events] ${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
    }
}
