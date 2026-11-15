import { describe, it, expect, vi } from 'vitest'
import { useUserTable } from '@/composables/admin/use-user-table'

vi.mock('@/composables/utils/use-i18n-text', () => import('@/tests/mocks/i18n-text'))

describe('useUserTable', () => {
    const { getSortField, getSortFieldLabel, formatDate, getRoleLabel, getRoleSeverity } = useUserTable()

    it('maps sort fields correctly', () => {
        expect(getSortField('name')).toBe('name')
        expect(getSortField('unknown')).toBe('unknown')
    })

    it('maps sort field labels correctly', () => {
        expect(getSortFieldLabel('name')).toBe('姓名')
        expect(getSortFieldLabel('unknown')).toBe('unknown')
    })

    it('formats date correctly', () => {
        const date = new Date('2023-01-01T12:00:00')
        expect(formatDate(date)).toContain('2023')
        expect(formatDate('')).toBe('-')
    })

    it('maps role labels correctly', () => {
        expect(getRoleLabel('admin')).toBe('管理员')
        expect(getRoleLabel('user')).toBe('用户')
    })

    it('maps role severity correctly', () => {
        expect(getRoleSeverity('admin')).toBe('danger')
        expect(getRoleSeverity('user')).toBe('info')
    })
})
