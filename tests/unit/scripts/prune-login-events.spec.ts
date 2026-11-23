import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import {
    buildMysqlOptions,
    buildPostgresOptions,
    buildPrunePlan,
    buildPruneSql,
    parseArgs,
    pruneLoginEventsInDatabase,
    pruneLoginEventsWithClient,
    resolveTableName,
    run,
    serializeCutoff,
    toSqliteDatetime,
} from '../../../scripts/maintenance/prune-login-events.mjs'
import { LOGIN_EVENT_RETENTION_DEFAULT_DAYS, resolveLoginEventRetentionDays } from '@/utils/shared/login-event-retention'

/**
 * 登录事件清理脚本（默认 dry-run，`--confirm` 才删除，三方言参数化删除）。
 */
interface RecordedCall {
    kind: 'all' | 'run'
    sql: string
    params: unknown[]
}

describe('登录事件清理脚本', () => {
    const now = new Date(Date.UTC(2026, 10, 22, 12, 0, 0))
    const tempDirs: string[] = []

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            rmSync(dir, { recursive: true, force: true })
        }
    })

    function createDatabase() {
        const db = new Database(':memory:')
        db.exec(`
            CREATE TABLE caomei_auth_login_event (
                id TEXT PRIMARY KEY,
                created_at DATETIME NOT NULL
            )
        `)
        return db
    }

    function createRecordingClient(rows: Array<{ count: number }> = [{ count: 0 }]) {
        const calls: RecordedCall[] = []
        return {
            calls,
            client: {
                all: async (sql, params) => {
                    calls.push({ kind: 'all', sql, params })
                    return rows
                },
                run: async (sql, params) => {
                    calls.push({ kind: 'run', sql, params })
                    return 3
                },
            },
        }
    }

    it('默认 dry-run：只统计候选，不删除', async () => {
        const db = createDatabase()
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('old', toSqliteDatetime(new Date(now.getTime() - 100 * 86_400_000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('new', toSqliteDatetime(new Date(now.getTime() - 10 * 86_400_000)))

        const plan = await pruneLoginEventsInDatabase(db, {
            table: 'caomei_auth_login_event',
            days: 90,
            now,
            dryRun: true,
        })
        expect(plan.candidates).toBe(1)
        expect(plan.deleted).toBe(0)
        expect(db.prepare('SELECT COUNT(*) AS count FROM caomei_auth_login_event').get()).toEqual({ count: 2 })
        db.close()
    })

    it('--confirm 只删除截止时间之前的事件', async () => {
        const db = createDatabase()
        const cutoffDate = new Date(now.getTime() - 90 * 86_400_000)
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('old', toSqliteDatetime(new Date(cutoffDate.getTime() - 1000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('boundary', toSqliteDatetime(cutoffDate))

        const plan = await pruneLoginEventsInDatabase(db, {
            table: 'caomei_auth_login_event',
            days: 90,
            now,
            dryRun: false,
        })
        expect(plan.deleted).toBe(1)
        expect(db.prepare('SELECT id FROM caomei_auth_login_event').all()).toEqual([{ id: 'boundary' }])
        db.close()
    })

    it('参数解析与保留期回落一致', () => {
        expect(parseArgs(['--confirm', '--days=30'])).toMatchObject({ confirm: true, days: '30' })
        expect(parseArgs([])).toMatchObject({ confirm: false, dryRun: false })
        expect(() => parseArgs(['--confirm', '--dry-run'])).toThrow()
        expect(() => parseArgs(['--unknown'])).toThrow()

        expect(resolveLoginEventRetentionDays('30')).toBe(30)
        expect(resolveLoginEventRetentionDays('bad')).toBe(LOGIN_EVENT_RETENTION_DEFAULT_DAYS)
        expect(buildPrunePlan({ days: 90, now }).cutoff).toEqual(new Date(now.getTime() - 90 * 86_400_000))
    })

    it('表名使用合法前缀并拒绝注入', () => {
        expect(resolveTableName('caomei_auth_')).toBe('caomei_auth_login_event')
        expect(resolveTableName('')).toBe('login_event')
        expect(() => resolveTableName('x; DROP TABLE user')).toThrow()
    })

    it('三方言 SQL 只差占位符，且删除语句参数化', () => {
        const sqlite = buildPruneSql('sqlite', 'caomei_auth_login_event')
        const mysql = buildPruneSql('mysql', 'caomei_auth_login_event')
        const postgres = buildPruneSql('postgres', 'caomei_auth_login_event')

        expect(sqlite.count).toBe('SELECT COUNT(*) AS count FROM caomei_auth_login_event WHERE created_at < ?')
        expect(sqlite.delete).toBe('DELETE FROM caomei_auth_login_event WHERE created_at < ?')
        expect(mysql).toEqual(sqlite)
        expect(postgres.count).toBe('SELECT COUNT(*) AS count FROM caomei_auth_login_event WHERE created_at < $1')
        expect(postgres.delete).toBe('DELETE FROM caomei_auth_login_event WHERE created_at < $1')
    })

    it('表名在 SQL 构造层再次校验，拒绝注入', () => {
        expect(() => buildPruneSql('sqlite', 'caomei_auth_login_event; DROP TABLE user')).toThrow()
        expect(() => buildPruneSql('mysql', 'login_event) OR 1=1')).toThrow()
    })

    it('截止时间按方言序列化：SQLite 用 UTC 文本，MySQL / PostgreSQL 传 Date', () => {
        const cutoff = new Date('2026-08-24T12:00:00.000Z')
        expect(serializeCutoff('sqlite', cutoff)).toBe('2026-08-24 12:00:00')
        expect(serializeCutoff('mysql', cutoff)).toBe(cutoff)
        expect(serializeCutoff('postgres', cutoff)).toBe(cutoff)
    })

    it('dry-run 只统计，confirm 才执行参数化 DELETE（MySQL / PostgreSQL 同一路径）', async () => {
        const dry = createRecordingClient([{ count: 7 }])
        const dryPlan = await pruneLoginEventsWithClient(dry.client, {
            type: 'mysql',
            table: 'caomei_auth_login_event',
            days: 90,
            now,
            dryRun: true,
        })
        expect(dryPlan).toMatchObject({ candidates: 7, deleted: 0 })
        expect(dry.calls).toHaveLength(1)
        const [dryCall] = dry.calls
        expect(dryCall?.kind).toBe('all')

        for (const type of ['mysql', 'postgres'] as const) {
            const { client, calls } = createRecordingClient([{ count: 2 }])
            const plan = await pruneLoginEventsWithClient(client, {
                type,
                table: 'caomei_auth_login_event',
                days: 90,
                now,
                dryRun: false,
            })
            expect(plan).toMatchObject({ candidates: 2, deleted: 3 })
            expect(calls.map((call) => call.kind)).toEqual(['all', 'run'])
            const expectedSql = buildPruneSql(type, 'caomei_auth_login_event')
            const [, deleteCall] = calls
            expect(deleteCall?.sql).toBe(expectedSql.delete)
            expect(deleteCall?.params).toEqual([buildPrunePlan({ days: 90, now }).cutoff])
        }
    })

    it('MySQL / PostgreSQL 连接选项继承 DATABASE_TIMEZONE 与 DATABASE_SSL', () => {
        expect(buildMysqlOptions({})).toEqual({ timezone: 'local', ssl: false })
        // mysql2 只接受 local / Z / ±HH:MM；这里用偏移量形态，避免误以为 IANA 名受支持
        expect(buildMysqlOptions({ DATABASE_TIMEZONE: '+08:00', DATABASE_SSL: 'true' }))
            .toEqual({ timezone: '+08:00', ssl: { rejectUnauthorized: false } })
        expect(buildPostgresOptions({})).toEqual({ ssl: false })
        expect(buildPostgresOptions({ DATABASE_SSL: 'true' })).toEqual({ ssl: { rejectUnauthorized: false } })
    })

    it('run 默认 dry-run，--confirm 才删除（SQLite 端到端）', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'prune-login-events-'))
        tempDirs.push(dir)
        const databasePath = join(dir, 'test.sqlite')
        const db = new Database(databasePath)
        db.exec('CREATE TABLE caomei_auth_login_event (id TEXT PRIMARY KEY, created_at DATETIME NOT NULL)')
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)')
            .run('ancient', toSqliteDatetime(new Date(Date.now() - 400 * 86_400_000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)')
            .run('old', toSqliteDatetime(new Date(Date.now() - 200 * 86_400_000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)')
            .run('fresh', toSqliteDatetime(new Date(Date.now() - 5 * 86_400_000)))
        db.close()

        const lines: string[] = []
        const sink = { write: (chunk: string) => lines.push(chunk) }
        const env = { DATABASE_TYPE: 'sqlite', DATABASE_PATH: databasePath, DATABASE_ENTITY_PREFIX: 'caomei_auth_' }

        await run([], env, sink as never)
        expect(lines.join('')).toContain('mode=dry-run')
        const afterDryRun = new Database(databasePath, { readonly: true, fileMustExist: true })
        expect(afterDryRun.prepare('SELECT COUNT(*) AS count FROM caomei_auth_login_event').get()).toEqual({ count: 3 })
        afterDryRun.close()

        lines.length = 0
        await run(['--confirm', '--days=365'], env, sink as never)
        expect(lines.join('')).toContain('mode=confirm')
        expect(lines.join('')).toContain('retentionDays=365')
        const afterConfirm = new Database(databasePath, { readonly: true, fileMustExist: true })
        // 400 天前的事件被删除；200 天与 5 天前的保留，证明 --days 已接线
        expect(afterConfirm.prepare('SELECT id FROM caomei_auth_login_event ORDER BY id').all())
            .toEqual([{ id: 'fresh' }, { id: 'old' }])
        afterConfirm.close()
    })
})
