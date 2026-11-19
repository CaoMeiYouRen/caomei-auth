import { describe, expect, it } from 'vitest'
import { INDEXABLE_LOCALE_CODES, PUBLIC_SITEMAP_PATHS, buildRobotsTxt, buildSitemapXml, isIndexableHreflang, isIndexableLocale, isIndexableOgLocale } from '@/utils/shared/seo'
import { publicPaths } from '@/utils/shared/public-paths'

describe('utils/shared/seo', () => {
    it('only exposes seo-ready indexable locales', () => {
        expect(INDEXABLE_LOCALE_CODES).toEqual(['zh-CN', 'en-US'])
    })

    it('recognizes hreflang and og:locale values', () => {
        expect(isIndexableHreflang('zh-CN')).toBe(true)
        expect(isIndexableHreflang('en')).toBe(true)
        expect(isIndexableHreflang('ja-JP')).toBe(false)
        expect(isIndexableHreflang('zh-TW')).toBe(false)
        expect(isIndexableOgLocale('en_US')).toBe(true)
        expect(isIndexableOgLocale('ja_JP')).toBe(false)
        expect(isIndexableHreflang(undefined)).toBe(false)
    })

    it('lists both locales with alternates in the sitemap', () => {
        const xml = buildSitemapXml('https://auth.example.com/')

        expect(xml.startsWith('<?xml')).toBe(true)
        expect(xml).toContain('<loc>https://auth.example.com/login</loc>')
        expect(xml).toContain('<loc>https://auth.example.com/en-US/login</loc>')
        expect(xml).toContain('<loc>https://auth.example.com/about</loc>')
        expect(xml).toContain('<loc>https://auth.example.com/en-US/about</loc>')
        expect(xml).toContain('hreflang="zh-CN"')
        expect(xml).toContain('hreflang="en-US"')
        expect(xml).toContain('hreflang="x-default"')
        expect(xml).not.toContain('//en-US')
    })

    it('keeps ui-ready locales out of the sitemap and hreflang', () => {
        const xml = buildSitemapXml('https://auth.example.com/')

        /* zh-TW 已启用但 readiness=ui-ready：可访问、可切换，但不进 sitemap / hreflang / og:locale */
        expect(xml).not.toContain('/zh-TW')
        expect(xml).not.toContain('hreflang="zh-TW"')
        expect(isIndexableHreflang('zh-TW')).toBe(false)
        expect(isIndexableOgLocale('zh_TW')).toBe(false)

        /* ja-JP 同为 ui-ready：M8 验收「可访问且不入索引」固化在门禁里 */
        expect(xml).not.toContain('/ja-JP')
        expect(xml).not.toContain('hreflang="ja-JP"')
        expect(isIndexableHreflang('ja-JP')).toBe(false)
        expect(isIndexableOgLocale('ja_JP')).toBe(false)
    })

    it('marks only seo-ready locales as indexable', () => {
        expect(isIndexableLocale('zh-CN')).toBe(true)
        expect(isIndexableLocale('en-US')).toBe(true)
        expect(isIndexableLocale('zh-TW')).toBe(false)
        expect(isIndexableLocale('ja-JP')).toBe(false)
        expect(isIndexableLocale('')).toBe(false)
        expect(isIndexableLocale(null)).toBe(false)
    })

    it('keeps private routes and login-gated home out of the sitemap', () => {
        const xml = buildSitemapXml('https://auth.example.com')

        for (const path of ['/admin', '/profile', '/security', '/oauth/']) {
            expect(xml).not.toContain(`>https://auth.example.com${path}<`)
        }
        /* 首页需要登录（302），不能出现在 sitemap */
        expect(xml).not.toContain('<loc>https://auth.example.com</loc>')
        expect(xml).not.toContain('<loc>https://auth.example.com/en-US</loc>')
    })

    it('only lists routes that are actually public', () => {
        for (const path of PUBLIC_SITEMAP_PATHS) {
            expect(publicPaths).toContain(path)
        }
    })

    it('writes robots.txt with sitemap and private disallows', () => {
        const robots = buildRobotsTxt('https://auth.example.com/')

        expect(robots).toContain('Sitemap: https://auth.example.com/sitemap.xml')
        expect(robots).toContain('Disallow: /admin')
        expect(robots).toContain('Disallow: /api/')
        expect(robots).not.toContain('Disallow: /login')
    })
})
