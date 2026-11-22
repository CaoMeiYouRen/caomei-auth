import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getMetadataArgsStorage } from 'typeorm'
import { TrustedDevice } from '@/server/entities/trusted-device'

describe('TrustedDevice 实体与建表脚本', () => {
    it('表名、字段与索引符合 D23', () => {
        const storage = getMetadataArgsStorage()
        expect(storage.tables.find((item) => item.target === TrustedDevice)?.name).toBe('trusted_device')
        const columns = storage.columns
            .filter((item) => item.target === TrustedDevice)
            .map((item) => item.propertyName)
        expect(columns).toEqual(expect.arrayContaining([
            'userId',
            'identifier',
            'userAgent',
            'ip',
            'expiresAt',
            'lastUsedAt',
        ]))
        const indexes = storage.indices
            .filter((item) => item.target === TrustedDevice)
            .map((item) => ({ name: item.name, columns: item.columns, unique: item.unique }))
        expect(indexes).toEqual(expect.arrayContaining([
            { name: 'IDX_trusted_device_identifier', columns: ['identifier'], unique: true },
            { name: 'IDX_trusted_device_user_created_at', columns: ['userId', 'createdAt'], unique: false },
        ]))
    })

    it('三方言建表脚本同步', () => {
        const sqlite = readFileSync(resolve(process.cwd(), 'database/sqlite/create.sql'), 'utf-8')
        const mysql = readFileSync(resolve(process.cwd(), 'database/mysql/create.sql'), 'utf-8')
        const postgres = readFileSync(resolve(process.cwd(), 'database/postgres/create.sql'), 'utf-8')
        expect(sqlite).toContain('CREATE TABLE IF NOT EXISTS caomei_auth_trusted_device')
        expect(mysql).toContain('CREATE TABLE `caomei_auth_trusted_device`')
        expect(postgres).toContain('CREATE TABLE public.caomei_auth_trusted_device')
        for (const index of ['IDX_trusted_device_identifier', 'IDX_trusted_device_user_created_at']) {
            expect(sqlite).toContain(index)
            expect(mysql).toContain(index)
            expect(postgres).toContain(index)
        }
    })
})
