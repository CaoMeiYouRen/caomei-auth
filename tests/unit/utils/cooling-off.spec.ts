import { describe, expect, it } from 'vitest'
import {
    CHANNEL_CHANGE_COOLING_OFF_DEFAULT_HOURS,
    CHANNEL_CHANGE_COOLING_OFF_MAX_HOURS,
    coolingOffHoursToMs,
    resolveCoolingOffHours,
} from '@/utils/shared/cooling-off'

describe('utils/shared/cooling-off', () => {
    it('defaults to 24 hours and falls back for invalid values', () => {
        expect(CHANNEL_CHANGE_COOLING_OFF_DEFAULT_HOURS).toBe(24)
        expect(CHANNEL_CHANGE_COOLING_OFF_MAX_HOURS).toBe(72)
        expect(resolveCoolingOffHours(undefined)).toBe(24)
        expect(resolveCoolingOffHours('')).toBe(24)
        expect(resolveCoolingOffHours('abc')).toBe(24)
        expect(resolveCoolingOffHours(0)).toBe(24)
        expect(resolveCoolingOffHours(-1)).toBe(24)
        expect(resolveCoolingOffHours(73)).toBe(24)
    })

    it('accepts values within 1..72 hours and converts to milliseconds', () => {
        expect(resolveCoolingOffHours('48')).toBe(48)
        expect(resolveCoolingOffHours(1)).toBe(1)
        expect(resolveCoolingOffHours(72)).toBe(72)
        expect(coolingOffHoursToMs(24)).toBe(24 * 60 * 60 * 1000)
    })
})
