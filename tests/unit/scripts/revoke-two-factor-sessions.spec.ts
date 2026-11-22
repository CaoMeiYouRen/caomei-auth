import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import {
    buildRevokeSql,
    parseArgs,
    resolvePrefix,
    run,
} from '../../../scripts/security/revoke-two-factor-sessions.mjs'

function createDatabase() {
    const dir = mkdtempSync(join(tmpdir(), 'revoke-2fa-'))
    const file = join(dir, 'auth.sqlite')
    const db = new Database(file)
    db.exec(`
        CREATE TABLE caomei_auth_user (id TEXT PRIMARY KEY, two_factor_enabled INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE caomei_auth_session (id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
        INSERT INTO caomei_auth_user (id, two_factor_enabled) VALUES ('u-2fa', 1), ('u-normal', 0), ('u-2fa-2', 1);
        INSERT INTO caomei_auth_session (id, user_id) VALUES ('s1', 'u-2fa'), ('s2', 'u-2fa'), ('s3', 'u-normal'), ('s4', 'u-2fa-2');
    `)
    db.close()
    return { dir, file }
}

function memoryOutput() {
    let text = ''
    return {
        write(chunk: string) {
            text += chunk
            return true
        },
        get value() {
            return text
        },
    }
}

describe('revoke-two-factor-sessions script', () => {
    let dir: string | undefined
    afterEach(() => {
        if (dir) {
            rmSync(dir, { recursive: true, force: true })
            dir = undefined
        }
    })

    it('默认 dry-run 只统计 2FA 用户会话', async () => {
        const created = createDatabase()
        dir = created.dir
        const output = memoryOutput()
        await run([], { DATABASE_TYPE: 'sqlite', DATABASE_PATH: created.file }, output as never)
        expect(output.value).toContain('users=2')
        expect(output.value).toContain('sessions=3')
        expect(output.value).toContain('deleted=0')
        expect(output.value).toContain('dry-run only')

        const db = new Database(created.file)
        expect(db.prepare('SELECT COUNT(*) AS count FROM caomei_auth_session').get()).toEqual({ count: 4 })
        db.close()
    })

    it('--confirm 只删除 2FA 用户会话', async () => {
        const created = createDatabase()
        dir = created.dir
        const output = memoryOutput()
        await run(['--confirm'], { DATABASE_TYPE: 'sqlite', DATABASE_PATH: created.file }, output as never)
        expect(output.value).toContain('deleted=3')

        const db = new Database(created.file)
        expect(db.prepare('SELECT id FROM caomei_auth_session ORDER BY id').all()).toEqual([{ id: 's3' }])
        db.close()
    })

    it('--user 限制到单个用户', async () => {
        const created = createDatabase()
        dir = created.dir
        const output = memoryOutput()
        await run(['--user=u-2fa', '--confirm'], { DATABASE_TYPE: 'sqlite', DATABASE_PATH: created.file }, output as never)
        expect(output.value).toContain('users=1')
        expect(output.value).toContain('sessions=2')

        const db = new Database(created.file)
        expect(db.prepare('SELECT id FROM caomei_auth_session ORDER BY id').all()).toEqual([{ id: 's3' }, { id: 's4' }])
        db.close()
    })

    it('参数与方言 SQL 契约', () => {
        expect(parseArgs(['--confirm', '--user=u1'])).toMatchObject({ confirm: true, user: 'u1' })
        expect(() => parseArgs(['--confirm', '--dry-run'])).toThrow()
        expect(() => parseArgs(['--user='])).toThrow()
        expect(resolvePrefix({ DATABASE_ENTITY_PREFIX: 'x_' })).toBe('x_')
        expect(() => resolvePrefix({ DATABASE_ENTITY_PREFIX: 'x; drop' })).toThrow()

        const sqlite = buildRevokeSql('sqlite', 'p_', 'u1')
        expect(sqlite.countUsers).toContain('two_factor_enabled = 1 AND id = ?')
        const postgres = buildRevokeSql('postgres', 'p_', 'u1')
        expect(postgres.countUsers).toContain('two_factor_enabled IS TRUE AND id = $1')
        expect(postgres.countUsers).not.toContain('= 1')
        expect(postgres.deleteSessions).toContain('DELETE FROM p_session')
    })
})
