import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { resolveVisualNow, seedVisualDatabase } from './visual-fixtures.mjs'

/**
 * 视觉层数据库准备。
 *
 * 生产构建里 `process.env.NODE_ENV` 被 Nitro 静态内联为 production，TypeORM 的
 * `synchronize` 因此不会在运行时开启；视觉服务又必须从空库起步（不依赖种子数据），
 * 所以先用仓库内 `database/sqlite/create.sql` 建表，再写入确定性夹具
 * （管理员、用户、OAuth 应用、SSO 提供商、登录日志）。
 *
 * 仅用于 `tests/visual` 的 webServer，不参与应用运行时。
 * 夹具时间以 `VISUAL_FIXED_NOW` 为锚点，配合 `server/plugins/visual-clock.ts` 保证基线不漂移。
 */

const databasePath = process.env.DATABASE_PATH || 'database/.visual/visual.sqlite'
const schemaPath = 'database/sqlite/create.sql'

mkdirSync(dirname(databasePath), { recursive: true })
rmSync(databasePath, { force: true })

const db = new Database(databasePath)
try {
    db.exec(readFileSync(schemaPath, 'utf8'))
    const summary = seedVisualDatabase(db, { anchor: resolveVisualNow(process.env) })
    console.log(`[visual] 固定夹具已写入：锚点 ${summary.anchor.toISOString()}；用户 ${summary.users} / 应用 ${summary.applications} / SSO ${summary.ssoProviders} / 会话 ${summary.sessions}`)
} finally {
    db.close()
}

console.log(`[visual] 视觉库已就绪：${databasePath}`)
