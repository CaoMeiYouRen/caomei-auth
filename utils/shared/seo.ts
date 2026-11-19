import { LOCALE_REGISTRY, type LocaleCode } from '@/i18n/config/locale-registry'

/**
 * 可索引语言：只有 `seo-ready` 且 `indexable` 的语言才进入 hreflang / sitemap / `og:locale`。
 */
const INDEXABLE_LOCALES = LOCALE_REGISTRY.filter((locale) => locale.readiness === 'seo-ready' && locale.indexable)

export const INDEXABLE_LOCALE_CODES = INDEXABLE_LOCALES.map((locale) => locale.code)

const INDEXABLE_LOCALE_CODE_SET = new Set<string>(INDEXABLE_LOCALE_CODES)

/**
 * 语言是否可进入索引。
 *
 * `ui-ready` 语言（当前为 zh-TW / ja-JP / ko-KR）可访问、可切换，但页面级 robots 需保持 `noindex`，
 * 与 sitemap / hreflang / `og:locale` 的过滤口径一致。
 */
export function isIndexableLocale(code?: string | null): boolean {
    return Boolean(code) && INDEXABLE_LOCALE_CODE_SET.has(String(code))
}

const BCP47_BY_CODE: Record<LocaleCode, string[]> = {
    'zh-CN': ['zh-CN', 'zh', 'zh-Hans'],
    'en-US': ['en-US', 'en'],
    'zh-TW': ['zh-TW', 'zh-Hant'],
    'ja-JP': ['ja-JP', 'ja'],
    'ko-KR': ['ko-KR', 'ko'],
    'es-ES': ['es-ES', 'es'],
    'fr-FR': ['fr-FR', 'fr'],
    'de-DE': ['de-DE', 'de'],
    'ru-RU': ['ru-RU', 'ru'],
    'pt-BR': ['pt-BR', 'pt'],
}

/** hreflang 值是否属于可索引语言（`en` / `en-US` 都算） */
export function isIndexableHreflang(hreflang?: string | null): boolean {
    if (!hreflang) {
        return false
    }
    return INDEXABLE_LOCALE_CODES.some((code) => (BCP47_BY_CODE[code] ?? []).includes(hreflang))
}

/** `og:locale` 值（`en_US`）是否属于可索引语言 */
export function isIndexableOgLocale(value?: string | null): boolean {
    if (!value) {
        return false
    }
    return INDEXABLE_LOCALE_CODES.some((code) => value === code.replace('-', '_'))
}

/** 需要在 sitemap 中公开的静态页面（不含登录后页面与 Admin） */
export const PUBLIC_SITEMAP_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/quick-login',
    '/sso-login',
    '/about',
    '/privacy',
    '/terms',
] as const

function trimBase(baseUrl: string): string {
    return baseUrl.replace(/\/+$/u, '')
}

/**
 * 生成 sitemap.xml：每个公开页面 × 每个可索引语言，附带 `xhtml:link` alternates。
 *
 * 只输出可索引语言（阶段 8 仍为 zh-CN / en-US），`ui-ready` 语言不会进入索引。
 */
export function buildSitemapXml(baseUrl: string, paths: readonly string[] = PUBLIC_SITEMAP_PATHS): string {
    const base = trimBase(baseUrl)
    const urls = paths.map((path) => {
        const suffix = path === '/' ? '' : path
        const alternates = [
            ...INDEXABLE_LOCALES.map((locale) => {
                const href = `${base}${locale.routePrefix}${suffix}`
                return `    <xhtml:link rel="alternate" hreflang="${locale.code}" href="${href}" />`
            }),
            /* 与页面 head 一致：x-default 指向默认语言 */
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${suffix}" />`,
        ].join('\n')

        return INDEXABLE_LOCALES.map((locale) => {
            const loc = `${base}${locale.routePrefix}${suffix}`
            return `  <url>\n    <loc>${loc}</loc>\n${alternates}\n  </url>`
        }).join('\n')
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
}

/** 生成 robots.txt：公开页可抓取，登录后 / 管理端 / API 不抓取 */
export function buildRobotsTxt(baseUrl: string): string {
    const base = trimBase(baseUrl)
    return [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/',
        'Disallow: /profile',
        'Disallow: /security',
        'Disallow: /oauth/',
        'Disallow: /change-password',
        '',
        `Sitemap: ${base}/sitemap.xml`,
        '',
    ].join('\n')
}
