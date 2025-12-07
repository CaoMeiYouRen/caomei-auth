import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatDateTime, formatDate, formatDateLocale, formatRelativeTime, formatCustomDate } from '@/utils/shared/date'

afterEach(() => {
    vi.useRealTimers()
})

describe('utils/date', () => {
    it('returns dash when date is empty', () => {
        expect(formatDateTime(null)).toBe('-')
        expect(formatDate(undefined)).toBe('-')
        expect(formatDateLocale(undefined)).toBe('-')
        expect(formatRelativeTime(null)).toBe('-')
        expect(formatCustomDate(null, 'YYYY')).toBe('-')
    })

    it('formats date time using default pattern', () => {
        const value = new Date(2024, 0, 2, 3, 4, 5)
        expect(formatDateTime(value)).toBe('2024-01-02 03:04:05')
    })

    it('formats plain date correctly', () => {
        const value = new Date(2024, 5, 15)
        expect(formatDate(value)).toBe('2024-06-15')
    })

    it('formats locale aware date string', () => {
        const value = new Date(2024, 0, 2, 3, 4, 5)
        const result = formatDateLocale(value, 'en-US')
        expect(result).toContain('1/2/2024')
    })

    it('formats relative time from current clock', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 0, 10, 12, 0, 0))
        const oneHourAgo = new Date(2024, 0, 10, 11, 0, 0)
        expect(formatRelativeTime(oneHourAgo)).toBe('1 小时前')
    })

    it('formats custom patterns', () => {
        const value = new Date(2024, 0, 2, 3, 4, 5)
        expect(formatCustomDate(value, 'YYYY/MM/DD')).toBe('2024/01/02')
    })
})
