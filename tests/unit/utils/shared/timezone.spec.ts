import { describe, expect, it } from 'vitest'
import { DEFAULT_TIME_ZONE, getTimeZoneOptions, isValidTimeZone, resolveTimeZone } from '@/utils/shared/timezone'

describe('utils/shared/timezone', () => {
    it('识别合法与非法时区', () => {
        expect(isValidTimeZone('Asia/Shanghai')).toBe(true)
        expect(isValidTimeZone('UTC')).toBe(true)
        expect(isValidTimeZone('Mars/Olympus')).toBe(false)
        expect(isValidTimeZone('')).toBe(false)
        expect(isValidTimeZone(null)).toBe(false)
        expect(isValidTimeZone('x'.repeat(65))).toBe(false)
    })

    it('按用户设置 > 浏览器时区 > UTC 回退', () => {
        expect(resolveTimeZone('Asia/Tokyo', 'Europe/London')).toBe('Asia/Tokyo')
        expect(resolveTimeZone(null, 'Europe/London')).toBe('Europe/London')
        expect(resolveTimeZone('Mars/Olympus', 'Europe/London')).toBe('Europe/London')
        expect(resolveTimeZone(undefined, undefined)).toBe(DEFAULT_TIME_ZONE)
        expect(resolveTimeZone('Mars/Olympus', 'Mars/Olympus')).toBe(DEFAULT_TIME_ZONE)
    })

    it('提供非空时区选项且包含 UTC', () => {
        const options = getTimeZoneOptions()
        expect(options.length).toBeGreaterThan(0)
        expect(options.some((option) => option.value === 'UTC')).toBe(true)
        expect(options.every((option) => option.label === option.value)).toBe(true)
    })
})

describe('formatDateTimeInTimeZone', () => {
    it('按 UTC / Asia/Shanghai / America/New_York 渲染同一时刻', async () => {
        const { formatDateTimeInTimeZone } = await import('@/utils/shared/timezone')
        const date = new Date('2026-06-15T16:15:00Z')

        const utc = formatDateTimeInTimeZone(date, 'UTC', 'en-US')
        const shanghai = formatDateTimeInTimeZone(date, 'Asia/Shanghai', 'en-US')
        const newYork = formatDateTimeInTimeZone(date, 'America/New_York', 'en-US')

        expect(utc).toMatch(/4:15/u)
        expect(shanghai).toMatch(/12:15/u)
        expect(newYork).toMatch(/12:15/u)
        expect(new Set([utc, shanghai, newYork]).size).toBeGreaterThan(1)
    })

    it('非法时区回退 UTC', async () => {
        const { formatDateTimeInTimeZone } = await import('@/utils/shared/timezone')
        const date = new Date('2026-06-15T16:15:00Z')

        expect(formatDateTimeInTimeZone(date, 'Mars/Olympus', 'en-US')).toBe(formatDateTimeInTimeZone(date, 'UTC', 'en-US'))
    })
})
