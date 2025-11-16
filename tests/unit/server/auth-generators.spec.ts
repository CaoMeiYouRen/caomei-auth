import crypto from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/env', () => ({
    TEMP_EMAIL_DOMAIN_NAME: 'temp.local',
}))

import * as random from '@/server/utils/random'
import { generateClientId, generateClientSecret, getTempEmail, getTempName } from '@/server/utils/auth-generators'

describe('server/utils/auth-generators', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('generates temp email with randomized local part and configured domain', () => {
        const spy = vi.spyOn(random, 'generateRandomString').mockReturnValueOnce('RANDOMID')

        const email = getTempEmail()
        expect(email).toBe('RANDOMID@temp.local')
        expect(spy).toHaveBeenCalledWith(8)
    })

    it('creates temp names ignoring optional phone parameter', () => {
        const spy = vi.spyOn(random, 'generateRandomString').mockReturnValueOnce('NAMEBITS')

        const name = getTempName('+8613800000000')
        expect(name).toBe('user-NAMEBITS')
        expect(spy).toHaveBeenCalledWith(8)
    })

    it('builds lowercase client ids using 16-char random strings', () => {
        const spy = vi.spyOn(random, 'generateRandomString').mockReturnValueOnce('CLIENTIDSTRING')

        const clientId = generateClientId()
        expect(clientId).toBe('clientidstring')
        expect(spy).toHaveBeenCalledWith(16)
    })

    it('returns url-safe base64 secrets produced from 24 random bytes', () => {
        const buffer = Buffer.from('abcdefghijklmnopqrstuvwx') // 24 chars
        const randomSpy = vi.spyOn(crypto, 'randomBytes').mockReturnValue(buffer)

        const secret = generateClientSecret()
        expect(secret).toBe(buffer.toString('base64url'))
        expect(randomSpy).toHaveBeenCalledWith(24)
        expect(secret).not.toMatch(/[+/=]/)
    })
})
