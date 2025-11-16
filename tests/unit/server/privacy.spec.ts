import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { maskEmail, maskPhone, maskUserId, maskIP, maskString, createSafeLogData } from '@/server/utils/privacy'

const originalEnv = process.env.NODE_ENV

describe('server/utils/privacy', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'production'
    })

    afterAll(() => {
        process.env.NODE_ENV = originalEnv
    })

    describe('environment aware masking helpers', () => {
        it('returns original values in development mode', () => {
            process.env.NODE_ENV = 'development'
            expect(maskEmail('dev@example.com')).toBe('dev@example.com')
            expect(maskPhone('+8613812345678')).toBe('+8613812345678')
            expect(maskUserId('12345678')).toBe('12345678')
            expect(maskIP('192.168.0.1')).toBe('192.168.0.1')
            expect(maskString('abcdef')).toBe('abcdef')
        })

        it('applies masking in production mode', () => {
            expect(maskEmail('ab@example.com')).toBe('a***@example.com')
            expect(maskPhone('+8613812345678')).toBe('+86 138 **** 5678')
            expect(maskUserId('12345678')).toBe('12***78')
            expect(maskIP('192.168.0.1')).toBe('192.168.0.***')
            expect(maskString('abcdef', 1, 1)).toBe('a***f')
        })

        it('returns non-string inputs unchanged', () => {
            expect(maskEmail(undefined as unknown as string)).toBeUndefined()
            expect(maskPhone(null as unknown as string)).toBeNull()
        })
    })

    describe('createSafeLogData', () => {
        it('masks well-known sensitive fields', () => {
            const safe = createSafeLogData({
                email: 'ab@example.com',
                phoneNumber: '+8613812345678',
                userId: '1234567890abcdef',
                ipAddress: '2001:db8::1',
                token: 'secret-token',
                apiKey: 'abcd',
                description: 'regular log',
            })

            expect(safe.email).toBe('a***@example.com')
            expect(safe.phoneNumber).toBe('+86 138 **** 5678')
            expect(safe.userId).toBe('1234****cdef')
            expect(safe.ipAddress).toBe('2001:db8:***:***')
            expect(safe.token).toBe('[REDACTED]')
            expect(safe.apiKey).toBe('[REDACTED]')
            expect(safe.description).toBe('regular log')
        })

        it('preserves nullish values', () => {
            const safe = createSafeLogData({ email: null, phone: undefined })
            expect(safe.email).toBeNull()
            expect(safe.phone).toBeUndefined()
        })
    })
})
