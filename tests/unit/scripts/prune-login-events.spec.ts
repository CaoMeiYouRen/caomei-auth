import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import {
    buildPrunePlan,
    parseArgs,
    pruneLoginEventsInDatabase,
    resolveTableName,
    toSqliteDatetime,
} from '../../../scripts/maintenance/prune-login-events.mjs'
import { LOGIN_EVENT_RETENTION_DEFAULT_DAYS, resolveLoginEventRetentionDays } from '@/utils/shared/login-event-retention'

/**
 * 阶段 12 M1.3：登录事件清理脚本（默认 dry-run，`--confirm` 才删除）。
 */
describe('登录事件清理脚本', () => {
    const now = new Date(Date.UTC(2026, 10, 22, 12, 0, 0))

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

    it('默认 dry-run：只统计候选，不删除', () => {
        const db = createDatabase()
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('old', toSqliteDatetime(new Date(now.getTime() - 100 * 86_400_000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('new', toSqliteDatetime(new Date(now.getTime() - 10 * 86_400_000)))

        const plan = pruneLoginEventsInDatabase(db, {
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

    it('--confirm 只删除截止时间之前的事件', () => {
        const db = createDatabase()
        const cutoffDate = new Date(now.getTime() - 90 * 86_400_000)
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('old', toSqliteDatetime(new Date(cutoffDate.getTime() - 1000)))
        db.prepare('INSERT INTO caomei_auth_login_event (id, created_at) VALUES (?, ?)').run('boundary', toSqliteDatetime(cutoffDate))

        const plan = pruneLoginEventsInDatabase(db, {
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
})
