import { describe, it, expect, vi } from 'vitest'
import { getDateType } from '@/server/database/type'

const importGetDateTypeWithEnv = async (mockDbType: string) => {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        DATABASE_TYPE: mockDbType,
    }))
    const module = await import('@/server/database/type')
    vi.doUnmock('@/utils/shared/env')
    return module.getDateType
}

describe('getDateType', () => {
    it('returns datetime for sqlite', () => {
        expect(getDateType('sqlite')).toBe('datetime')
    })

    it('returns datetime for mysql', () => {
        expect(getDateType('mysql')).toBe('datetime')
    })

    it('returns timestamp with time zone for postgres', () => {
        expect(getDateType('postgres')).toBe('timestamp with time zone')
    })

    it('falls back to datetime for unknown types', () => {
        expect(getDateType('sqlserver')).toBe('datetime')
    })

    it.each([
        { envType: 'sqlite', expected: 'datetime' },
        { envType: 'mysql', expected: 'datetime' },
        { envType: 'postgres', expected: 'timestamp with time zone' },
        { envType: 'sqlserver', expected: 'datetime' },
    ])('uses DATABASE_TYPE env fallback when not provided (%s)', async ({ envType, expected }) => {
        const getDateTypeWithEnv = await importGetDateTypeWithEnv(envType)
        expect(getDateTypeWithEnv()).toBe(expected)
    })
})
