import { describe, it, expect } from 'vitest'
import { getDateType } from '@/server/database/type'

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
})
