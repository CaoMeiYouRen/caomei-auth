import { describe, it, expect } from 'vitest'
import { validateEmail, validatePhone, validateUrl, validateUsername, usernameValidator, nicknameValidator } from '@/utils/shared/validate'

describe('utils/validate', () => {
    describe('validateEmail', () => {
        it('accepts email with UTF-8 local part', () => {
            expect(validateEmail('测试@example.com')).toBe(true)
        })

        it('rejects email without TLD', () => {
            expect(validateEmail('user@example')).toBe(false)
        })

        it('rejects email containing underscore in domain', () => {
            expect(validateEmail('user@exa_mple.com')).toBe(false)
        })

        it('rejects email that uses IP address domain', () => {
            expect(validateEmail('user@192.168.0.1')).toBe(false)
        })
    })

    describe('validatePhone', () => {
        it('validates international numbers by default', () => {
            expect(validatePhone('+8613812345678')).toBe(true)
        })

        it('supports locale specific validation', () => {
            expect(validatePhone('+12025550123', 'en-US')).toBe(true)
        })

        it('rejects number missing plus prefix', () => {
            expect(validatePhone('13812345678')).toBe(false)
        })

        it('rejects malformed phone number', () => {
            expect(validatePhone('+123')).toBe(false)
        })

        it('accepts numbers when locale array includes matching region', () => {
            expect(validatePhone('+447911123456', ['en-GB', 'zh-CN'])).toBe(true)
        })
    })

    describe('validateUrl', () => {
        it('accepts http/https URLs with custom hostnames', () => {
            expect(validateUrl('https://internal-service')).toBe(true)
        })

        it('accepts URLs that use IP addresses', () => {
            expect(validateUrl('http://192.168.0.1')).toBe(true)
        })

        it('rejects URLs ending with a trailing dot', () => {
            expect(validateUrl('https://example.com.')).toBe(false)
        })

        it('rejects URLs without protocol prefix', () => {
            expect(validateUrl('example.com')).toBe(false)
        })

        it('rejects URLs using unsupported protocols', () => {
            expect(validateUrl('ftp://example.com')).toBe(false)
        })
    })

    describe('validateUsername & usernameValidator', () => {
        it('accepts usernames with dash and underscore', () => {
            expect(validateUsername('user_name-123')).toBe(true)
        })

        it('rejects usernames that are too short or contain spaces', () => {
            expect(validateUsername('u')).toBe(false)
            expect(validateUsername('user name')).toBe(false)
        })

        it('enforces maximum length boundary', () => {
            const maxLengthName = 'a'.repeat(36)
            const overflowName = 'a'.repeat(37)

            expect(validateUsername(maxLengthName)).toBe(true)
            expect(validateUsername(overflowName)).toBe(false)
        })

        it('blocks usernames that look like email addresses', () => {
            expect(usernameValidator('user@example.com')).toBe(false)
        })

        it('blocks usernames that look like phone numbers', () => {
            expect(usernameValidator('13812345678')).toBe(false)
        })

        it('allows compliant usernames', () => {
            expect(usernameValidator('valid_user')).toBe(true)
        })
    })

    describe('nicknameValidator', () => {
        it('accepts nicknames in valid range', () => {
            expect(nicknameValidator('昵称')).toBe(true)
        })

        it('rejects nicknames that are too short', () => {
            expect(nicknameValidator('a')).toBe(false)
        })

        it('rejects nicknames containing control characters or spaces', () => {
            const withControlCharacter = `a${String.fromCharCode(0x0008)}b`

            expect(nicknameValidator(withControlCharacter)).toBe(false)
            expect(nicknameValidator('包含 空格')).toBe(false)
        })

        it('validates upper length boundary correctly', () => {
            const maxLengthNickname = '好'.repeat(36)
            const overflowNickname = '好'.repeat(37)

            expect(nicknameValidator(maxLengthNickname)).toBe(true)
            expect(nicknameValidator(overflowNickname)).toBe(false)
        })
    })
})
