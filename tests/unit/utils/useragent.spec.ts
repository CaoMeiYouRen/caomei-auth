import { describe, it, expect } from 'vitest'
import { getBrowser, getOs, parseUserAgent } from '@/utils/useragent'

describe('utils/useragent', () => {
    const sampleUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'

    it('parses browser information with version', () => {
        const browser = getBrowser(sampleUA)
        expect(browser).toContain('Chrome')
        expect(browser).toMatch(/Chrome \d/)
    })

    it('parses os information with version', () => {
        const os = getOs(sampleUA)
        expect(os).toContain('Windows')
    })

    it('returns combined browser and os data', () => {
        const info = parseUserAgent(sampleUA)
        expect(info.browser).toContain('Chrome')
        expect(info.os).toContain('Windows')
    })

    it('falls back to Unknown for invalid agents', () => {
        const emptyUA = ''
        expect(getBrowser(emptyUA)).toBe('Unknown')
        expect(getOs(emptyUA)).toBe('Unknown')
    })
})
