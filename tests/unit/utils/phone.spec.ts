import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, formatPhoneNumberInternational, getRegionCodeForPhoneNumber } from '@/utils/shared/phone'

describe('utils/phone', () => {
    it('formats numbers to E164', () => {
        expect(formatPhoneNumber('13812345678', 'CN')).toBe('+8613812345678')
        expect(formatPhoneNumber('(202) 555-0123', 'US')).toBe('+12025550123')
    })

    it('formats numbers for international display', () => {
        expect(formatPhoneNumberInternational('13812345678', 'CN')).toBe('+86 138 1234 5678')
        expect(formatPhoneNumberInternational('2025550123', 'US')).toBe('+1 202-555-0123')
    })

    it('detects region code from phone number', () => {
        expect(getRegionCodeForPhoneNumber('+12025550123')).toBe('US')
        expect(getRegionCodeForPhoneNumber('13812345678')).toBe('CN')
    })

    it('falls back to CN on parse failure', () => {
        expect(getRegionCodeForPhoneNumber('not-a-phone')).toBe('CN')
    })
})
