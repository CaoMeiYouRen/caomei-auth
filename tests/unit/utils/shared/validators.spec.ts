import { describe, it, expect } from 'vitest'
import { emailSchema, phoneSchema, urlSchema, usernameSchema, nicknameSchema, cnPhoneSchema } from '@/utils/shared/validators'

describe('utils/shared/validators', () => {
    describe('emailSchema', () => {
        it('accepts email with UTF-8 local part', () => {
            expect(emailSchema.safeParse('测试@example.com').success).toBe(true)
        })

        it('rejects email without TLD', () => {
            expect(emailSchema.safeParse('user@example').success).toBe(false)
        })

        it('rejects email containing underscore in domain', () => {
            expect(emailSchema.safeParse('user@exa_mple.com').success).toBe(false)
        })

        it('rejects email that uses IP address domain', () => {
            expect(emailSchema.safeParse('user@192.168.0.1').success).toBe(false)
        })
    })

    describe('phoneSchema', () => {
        it('validates international numbers by default', () => {
            expect(phoneSchema.safeParse('+8613812345678').success).toBe(true)
        })

        it('rejects number missing plus prefix', () => {
            expect(phoneSchema.safeParse('13812345678').success).toBe(false)
        })

        it('rejects malformed phone number', () => {
            expect(phoneSchema.safeParse('+123').success).toBe(false)
        })
    })

    describe('cnPhoneSchema', () => {
        it('validates CN numbers', () => {
            expect(cnPhoneSchema.safeParse('+8613812345678').success).toBe(true)
        })

        it('rejects non-CN numbers', () => {
            expect(cnPhoneSchema.safeParse('+12025550123').success).toBe(false)
        })
    })

    describe('urlSchema', () => {
        it('accepts http/https URLs with custom hostnames', () => {
            expect(urlSchema.safeParse('https://internal-service').success).toBe(true)
        })

        it('accepts URLs that use IP addresses', () => {
            expect(urlSchema.safeParse('http://192.168.0.1').success).toBe(true)
        })

        it('rejects URLs ending with a trailing dot', () => {
            // Zod URL validation might behave differently than validator.isURL options
            // Let's check if Zod allows trailing dot. Usually it does not.
            expect(urlSchema.safeParse('https://example.com.').success).toBe(false)
        })

        it('rejects URLs without protocol prefix', () => {
            expect(urlSchema.safeParse('example.com').success).toBe(false)
        })

        it('rejects URLs using unsupported protocols', () => {
            expect(urlSchema.safeParse('ftp://example.com').success).toBe(false)
        })
    })

    describe('usernameSchema', () => {
        it('accepts usernames with dash and underscore', () => {
            expect(usernameSchema.safeParse('user_name-123').success).toBe(true)
        })

        it('rejects usernames that are too short or contain spaces', () => {
            expect(usernameSchema.safeParse('u').success).toBe(false)
            expect(usernameSchema.safeParse('user name').success).toBe(false)
        })

        it('enforces maximum length boundary', () => {
            const maxLengthName = 'a'.repeat(36)
            const overflowName = 'a'.repeat(37)

            expect(usernameSchema.safeParse(maxLengthName).success).toBe(true)
            expect(usernameSchema.safeParse(overflowName).success).toBe(false)
        })

        it('blocks usernames that look like email addresses', () => {
            expect(usernameSchema.safeParse('user@example.com').success).toBe(false)
        })

        it('blocks usernames that look like phone numbers', () => {
            expect(usernameSchema.safeParse('+8613812345678').success).toBe(false)
        })

        it('allows compliant usernames', () => {
            expect(usernameSchema.safeParse('valid_user').success).toBe(true)
        })
    })

    describe('nicknameSchema', () => {
        it('accepts nicknames in valid range', () => {
            expect(nicknameSchema.safeParse('昵称').success).toBe(true)
        })

        it('rejects nicknames with control characters', () => {
            expect(nicknameSchema.safeParse('昵称\u0000').success).toBe(false)
        })
    })
})
