import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

/**
 * 视觉层空库准备。
 *
 * 生产构建里 `process.env.NODE_ENV` 被 Nitro 静态内联为 production，TypeORM 的
 * `synchronize` 因此不会在运行时开启；视觉服务又必须从空库起步（不依赖种子数据），
 * 所以先用仓库内 `database/sqlite/create.sql` 建表。
 *
 * 仅用于 `tests/visual` 的 webServer，不参与应用运行时。
 */

const databasePath = process.env.DATABASE_PATH || 'database/.visual/visual.sqlite'
const schemaPath = 'database/sqlite/create.sql'

mkdirSync(dirname(databasePath), { recursive: true })
rmSync(databasePath, { force: true })

const db = new Database(databasePath)
try {
    db.exec(readFileSync(schemaPath, 'utf8'))
} finally {
    db.close()
}

console.log(`[visual] 空库已就绪：${databasePath}`)
