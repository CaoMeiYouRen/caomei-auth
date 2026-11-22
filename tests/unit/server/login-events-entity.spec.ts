import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getMetadataArgsStorage } from 'typeorm'
import { LoginEvent } from '@/server/entities/login-event'
import {
    LOGIN_EVENT_CHANNELS,
    LOGIN_EVENT_RESULTS,
    LOGIN_EVENT_TYPES,
    isLoginEventChannel,
    isLoginEventResult,
    isLoginEventType,
    normalizeLoginEventChannel,
} from '@/utils/shared/login-events'

/**
 * 阶段 12 M1.1：登录事件枚举与实体契约。
 *
 * 枚举是 D18 的固定口径，实体索引、建表脚本与查询维度必须与其一致；
 * 任何一项漂移都应在单元测试而不是运行期暴露。
 */
describe('登录事件枚举与实体契约', () => {
    it('事件类型枚举与登记口径一致', () => {
        expect(LOGIN_EVENT_TYPES).toEqual([
            'sign_in_success',
            'sign_in_failure',
            'two_factor_challenge',
            'two_factor_success',
            'two_factor_failure',
            'sign_out',
            'session_revoked',
        ])
        expect(LOGIN_EVENT_TYPES).toHaveLength(7)
    })

    it('结果与通道枚举与登记口径一致', () => {
        expect(LOGIN_EVENT_RESULTS).toEqual(['success', 'failure'])
        expect(LOGIN_EVENT_CHANNELS).toEqual([
            'email',
            'username',
            'phone',
            'email-otp',
            'phone-otp',
            'magic-link',
            'email-verification',
            'social',
            'sso',
            'unknown',
        ])
    })

    it('类型守卫拒绝未知值', () => {
        expect(isLoginEventType('sign_in_failure')).toBe(true)
        expect(isLoginEventType('sign_in')).toBe(false)
        expect(isLoginEventType(null)).toBe(false)
        expect(isLoginEventResult('success')).toBe(true)
        expect(isLoginEventResult('partial')).toBe(false)
        expect(isLoginEventChannel('sso')).toBe(true)
        expect(isLoginEventChannel('SAML')).toBe(false)
    })

    it('未知通道回落 unknown', () => {
        expect(normalizeLoginEventChannel('saml')).toBe('unknown')
        expect(normalizeLoginEventChannel(undefined)).toBe('unknown')
        expect(normalizeLoginEventChannel('phone-otp')).toBe('phone-otp')
    })

    it('实体表名、字段与索引覆盖查询维度', () => {
        const storage = getMetadataArgsStorage()
        const table = storage.tables.find((item) => item.target === LoginEvent)
        expect(table?.name).toBe('login_event')

        const columnNames = storage.columns
            .filter((item) => item.target === LoginEvent)
            .map((item) => item.propertyName)
        expect(columnNames).toEqual(expect.arrayContaining([
            'type',
            'result',
            'channel',
            'userId',
            'ip',
            'userAgent',
            'metadata',
        ]))
        // 时间字段继承自 BaseEntity，索引通过 propertyName 引用
        expect(storage.columns.some((item) => item.propertyName === 'createdAt' && item.mode === 'createDate')).toBe(true)

        const indexes = storage.indices
            .filter((item) => item.target === LoginEvent)
            .map((item) => ({ name: item.name, columns: item.columns }))
        expect(indexes).toEqual(expect.arrayContaining([
            { name: 'IDX_login_event_created_at', columns: ['createdAt'] },
            { name: 'IDX_login_event_type_created_at', columns: ['type', 'createdAt'] },
            { name: 'IDX_login_event_user_id_created_at', columns: ['userId', 'createdAt'] },
            { name: 'IDX_login_event_result_created_at', columns: ['result', 'createdAt'] },
        ]))
    })

    it('SQLite / MySQL / PostgreSQL 建表脚本与实体同步', () => {
        const indexNames = [
            'IDX_login_event_created_at',
            'IDX_login_event_type_created_at',
            'IDX_login_event_user_id_created_at',
            'IDX_login_event_result_created_at',
        ]
        const sql = readFileSync(resolve(process.cwd(), 'database/sqlite/create.sql'), 'utf-8')
        const tableStart = sql.indexOf('CREATE TABLE IF NOT EXISTS caomei_auth_login_event')
        expect(tableStart).toBeGreaterThanOrEqual(0)
        const tableBlock = sql.slice(tableStart, sql.indexOf(');', tableStart) + 2)
        for (const column of ['type', 'result', 'channel', 'user_id', 'ip', 'user_agent', 'metadata', 'created_at']) {
            expect(tableBlock).toMatch(new RegExp(`^\\s*${column}\\s`, 'mu'))
        }
        for (const index of indexNames) {
            expect(sql).toContain(`CREATE INDEX IF NOT EXISTS ${index}`)
        }

        const mysql = readFileSync(resolve(process.cwd(), 'database/mysql/create.sql'), 'utf-8')
        expect(mysql).toContain('CREATE TABLE `caomei_auth_login_event`')
        for (const index of indexNames) {
            expect(mysql).toContain(`KEY \`${index}\``)
        }

        const postgres = readFileSync(resolve(process.cwd(), 'database/postgres/create.sql'), 'utf-8')
        expect(postgres).toContain('CREATE TABLE public.caomei_auth_login_event')
        for (const index of indexNames) {
            expect(postgres).toContain(`CREATE INDEX "${index}"`)
        }
    })
})
