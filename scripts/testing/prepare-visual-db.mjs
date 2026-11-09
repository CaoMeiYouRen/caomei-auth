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
    /* 固定的公开 OAuth 客户端：授权同意页需要真实 client_id 才能渲染应用信息 */
    db.exec(`
        INSERT INTO caomei_auth_oauth_client
            (id, client_id, disabled, scopes, name, description, uri, redirect_uris, application_type)
        VALUES
            ('00000000-0000-4000-8000-000000000001', 'visual-client', 0,
             '["openid","profile","email"]', '视觉测试应用', '用于视觉基线的演示应用',
             'https://example.com', '["http://127.0.0.1:3100/callback"]', 'web')
    `)
} finally {
    db.close()
}

console.log(`[visual] 空库已就绪：${databasePath}`)
