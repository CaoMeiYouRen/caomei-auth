import { describe, it, expect } from 'vitest'
import { getProviderName, getProviderIcon, getProviderColor, getProviderInfo, isSocialProvider, getAllProviders } from '@/utils/social-provider-helpers'

describe('utils/social-provider-helpers', () => {
    it('returns configured provider metadata', () => {
        expect(getProviderName('github')).toBe('GitHub')
        expect(getProviderIcon('github')).toBe('mdi mdi-github')
        expect(getProviderColor('github')).toBe('var(--color-github)')
    })

    it('falls back to defaults for unknown provider', () => {
        expect(getProviderName('unknown-provider')).toBe('unknown-provider')
        expect(getProviderIcon('unknown-provider')).toBe('mdi mdi-account')
        expect(getProviderColor('unknown-provider')).toBe('var(--color-default)')
        expect(getProviderInfo('unknown-provider')).toEqual({
            name: 'unknown-provider',
            icon: 'mdi mdi-account',
            color: 'var(--color-default)',
        })
    })

    it('detects social providers by mapping', () => {
        expect(isSocialProvider('github')).toBe(true)
        expect(isSocialProvider('credential')).toBe(false)
    })

    it('exposes combined provider list', () => {
        const providers = getAllProviders()
        expect(Array.isArray(providers)).toBe(true)
        expect(providers).toContain('email')
        expect(providers).toContain('github')
    })
})
