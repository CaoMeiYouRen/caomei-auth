import { describe, expect, it } from 'vitest'
import { isSafeInternalPath, readTwoFactorChallengeQuery } from '@/utils/web/login-challenge'

describe('login challenge query', () => {
    it('ignores requests without the twoFactor flag', () => {
        expect(readTwoFactorChallengeQuery({})).toEqual({ active: false, channel: null, redirect: null })
        expect(readTwoFactorChallengeQuery({ twoFactor: '0', channel: 'magic-link' })).toEqual({ active: false, channel: null, redirect: null })
    })

    it('reads channel and safe redirect', () => {
        expect(readTwoFactorChallengeQuery({
            twoFactor: '1',
            channel: 'magic-link',
            redirect: '/profile?tab=security',
        })).toEqual({
            active: true,
            channel: 'magic-link',
            redirect: '/profile?tab=security',
        })
    })

    it('requires a known challenge channel', () => {
        expect(readTwoFactorChallengeQuery({ twoFactor: '1' })).toEqual({ active: false, channel: null, redirect: null })
        expect(readTwoFactorChallengeQuery({ twoFactor: '1', channel: 'unknown-channel' })).toEqual({ active: false, channel: null, redirect: null })
    })

    it('drops unsafe redirect targets', () => {
        for (const redirect of ['//evil.example', 'https://evil.example', '/\\evil.example', '/\t/evil.example']) {
            expect(readTwoFactorChallengeQuery({ twoFactor: '1', channel: 'magic-link', redirect })).toEqual({
                active: true,
                channel: 'magic-link',
                redirect: null,
            })
        }
    })

    it('accepts array query values from vue-router', () => {
        expect(readTwoFactorChallengeQuery({
            twoFactor: ['1'],
            channel: ['sso-saml'],
            redirect: ['/admin/users'],
        })).toEqual({
            active: true,
            channel: 'sso-saml',
            redirect: '/admin/users',
        })
    })

    it('validates internal paths', () => {
        expect(isSafeInternalPath('/profile')).toBe(true)
        expect(isSafeInternalPath('/profile?x=1#top')).toBe(true)
        expect(isSafeInternalPath('//evil.example')).toBe(false)
        expect(isSafeInternalPath('/profile\\evil')).toBe(false)
        expect(isSafeInternalPath('/profile\nSet-Cookie: x')).toBe(false)
        expect(isSafeInternalPath('profile')).toBe(false)
    })
})
