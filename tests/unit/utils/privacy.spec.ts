import { describe, it, expect, vi, afterEach } from 'vitest'
import { maskEmail, maskPhone, maskUserId, maskUsername, maskIP, maskString } from '@/utils/privacy'
import { phoneUtil } from '@/utils/phone'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('utils/privacy', () => {
    describe('maskEmail', () => {
        it('masks short username emails', () => {
            expect(maskEmail('ab@example.com')).toBe('a***@example.com')
        })

        it('masks longer username emails with limited asterisks', () => {
            expect(maskEmail('username@example.com')).toBe('u****e@example.com')
        })

        it('returns original value when email is invalid', () => {
            expect(maskEmail('not-an-email')).toBe('not-an-email')
        })

        it('ignores non-string values gracefully', () => {
            expect(maskEmail(undefined as unknown as string)).toBe(undefined)
        })
    })

    describe('maskPhone', () => {
        it('formats valid E.164 phone numbers with masking', () => {
            expect(maskPhone('+8613812345678')).toBe('+86 138 **** 5678')
        })

        it('falls back to string masking when parsing fails', () => {
            vi.spyOn(phoneUtil, 'parse').mockImplementation(() => {
                throw new Error('parse error')
            })
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            expect(maskPhone('13812345678')).toBe('138****5678')
            expect(warnSpy).toHaveBeenCalled()
        })

        it('returns original value for empty input', () => {
            expect(maskPhone('')).toBe('')
            expect(maskPhone(undefined as unknown as string)).toBe(undefined)
        })
    })

    describe('maskUserId', () => {
        it('masks short identifiers', () => {
            expect(maskUserId('12345678')).toBe('12***78')
        })

        it('masks long identifiers keeping both ends', () => {
            expect(maskUserId('1234567890abcdef')).toBe('1234****cdef')
        })
    })

    describe('maskUsername', () => {
        it('returns original value when too short to mask', () => {
            expect(maskUsername('ab')).toBe('ab')
        })

        it('masks usernames of moderate length', () => {
            expect(maskUsername('abcd')).toBe('a***d')
        })

        it('masks long usernames keeping two characters on each side', () => {
            expect(maskUsername('abcdefg')).toBe('ab***fg')
        })
    })

    describe('maskIP', () => {
        it('masks IPv4 address last octet', () => {
            expect(maskIP('192.168.1.100')).toBe('192.168.1.***')
        })

        it('masks IPv6 address tail segments', () => {
            expect(maskIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:***:***')
        })

        it('handles compressed IPv6 formats', () => {
            expect(maskIP('2001:db8::7334')).toBe('2001:db8:***:***')
        })

        it('returns original string when format is not recognised', () => {
            expect(maskIP('not-an-ip')).toBe('not-an-ip')
        })
    })

    describe('maskString', () => {
        it('masks middle characters by default', () => {
            expect(maskString('1234567')).toBe('12***67')
        })

        it('returns only asterisks when value is shorter than exposed segments', () => {
            expect(maskString('1234')).toBe('****')
        })

        it('supports custom prefix and suffix lengths', () => {
            expect(maskString('abcdef', 1, 1)).toBe('a***f')
        })

        it('returns non-string input without modification', () => {
            expect(maskString(undefined as unknown as string)).toBe(undefined)
        })
    })
})
