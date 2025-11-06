import { describe, it, expect } from 'vitest'
import { getSocialColor, getSocialColorCSSVars, getSocialColorSCSS, isValidHexColor, DEFAULT_SOCIAL_COLOR, socialColors } from '@/utils/social-colors'

describe('utils/social-colors', () => {
    it('returns brand colors with theme awareness', () => {
        expect(getSocialColor('github')).toBe('#24292e')
        expect(getSocialColor('github', 'dark')).toBe('#ffffff')
        expect(getSocialColor('unknown')).toBe(DEFAULT_SOCIAL_COLOR)
    })

    it('generates css vars for each provider', () => {
        const vars = getSocialColorCSSVars()
        Object.keys(socialColors).forEach((provider) => {
            expect(vars[`--color-${provider}`]).toBeDefined()
        })
    })

    it('creates SCSS declarations with comments', () => {
        const scss = getSocialColorSCSS()
        expect(scss).toContain('$color-github: #24292e')
        expect(scss).toContain('社交平台品牌色')
    })

    it('validates hex color format', () => {
        expect(isValidHexColor('#fff')).toBe(true)
        expect(isValidHexColor('#123456')).toBe(true)
        expect(isValidHexColor('123456')).toBe(false)
    })
})
