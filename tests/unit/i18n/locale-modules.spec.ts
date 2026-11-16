import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    LOCALE_CORE_MODULES,
    LOCALE_MESSAGE_MODULE_KEY_GROUPS,
    LOCALE_MESSAGE_MODULES,
    LOCALE_SERVER_MODULES,
    getClientLazyLocaleMessageModules,
    getEagerLocaleMessageFilePaths,
    getLocaleMessageFilePaths,
    isCoreLocaleMessageModule,
    normalizeLocaleRoutePath,
    resolveLocaleMessageModulesForPath,
} from '@/i18n/config/locale-modules'

describe('i18n/config/locale-modules', () => {
    it('registers 18 unique modules with a key group each', () => {
        expect(LOCALE_MESSAGE_MODULES).toHaveLength(18)
        expect(new Set(LOCALE_MESSAGE_MODULES).size).toBe(18)
        for (const moduleName of LOCALE_MESSAGE_MODULES) {
            expect(LOCALE_MESSAGE_MODULE_KEY_GROUPS[moduleName]?.length).toBeGreaterThan(0)
        }
    })

    it('keeps core modules inside the module order', () => {
        for (const moduleName of LOCALE_CORE_MODULES) {
            expect(LOCALE_MESSAGE_MODULES).toContain(moduleName)
            expect(isCoreLocaleMessageModule(moduleName)).toBe(true)
        }
        expect(isCoreLocaleMessageModule('admin-users')).toBe(false)
    })

    it('keeps server-only modules out of the core set', () => {
        for (const moduleName of LOCALE_SERVER_MODULES) {
            expect(LOCALE_CORE_MODULES).not.toContain(moduleName)
        }
    })

    it('keeps core and server modules out of the client lazy set', () => {
        const clientLazyModules = getClientLazyLocaleMessageModules()

        const serverModules = new Set<string>(LOCALE_SERVER_MODULES)
        expect(clientLazyModules).toEqual(
            LOCALE_MESSAGE_MODULES.filter((moduleName) => !isCoreLocaleMessageModule(moduleName) && !serverModules.has(moduleName)),
        )
        for (const moduleName of [...LOCALE_CORE_MODULES, ...LOCALE_SERVER_MODULES]) {
            expect(clientLazyModules).not.toContain(moduleName)
        }
    })

    it('derives module and eager file paths from the module order', () => {
        expect(getLocaleMessageFilePaths('zh-CN')).toEqual(
            LOCALE_MESSAGE_MODULES.map((moduleName) => `zh-CN/${moduleName}.json`),
        )
        expect(getEagerLocaleMessageFilePaths('en-US')).toEqual(
            LOCALE_CORE_MODULES.map((moduleName) => `en-US/${moduleName}.json`),
        )
    })

    it('normalizes locale-prefixed, query and hash paths', () => {
        expect(normalizeLocaleRoutePath('/en-US/admin/users?page=2')).toBe('/admin/users')
        expect(normalizeLocaleRoutePath('/en-US')).toBe('/')
        expect(normalizeLocaleRoutePath('/login#form')).toBe('/login')
        expect(normalizeLocaleRoutePath('login')).toBe('/login')
        // 未命中 locale 形态的路径不剥离，避免误伤 /en-USfoo 这类业务路径
        expect(normalizeLocaleRoutePath('/en-USfoo')).toBe('/en-USfoo')
    })

    it('resolves core-only routes without optional modules', () => {
        expect(resolveLocaleMessageModulesForPath('/unmapped-route')).toEqual([...LOCALE_CORE_MODULES])
        expect(resolveLocaleMessageModulesForPath('/en-US/callback')).toEqual([...LOCALE_CORE_MODULES])
    })

    it('resolves page modules by route', () => {
        const cases: [string, string[]][] = [
            ['/login', ['auth']],
            ['/en-US/forgot-password', ['auth']],
            ['/profile', ['profile']],
            ['/security', ['security']],
            ['/oauth/consent', ['oauth']],
            ['/', ['static']],
            ['/about', ['static']],
            ['/about/', ['static']],
            ['/privacy', ['static']],
            ['/terms', ['static']],
            ['/sso-login', ['sso']],
            ['/admin/users', ['admin', 'admin-users']],
            ['/en-US/admin/oauth/applications', ['admin', 'admin-oauth']],
            ['/admin/sso/providers', ['admin', 'admin-sso']],
            ['/admin/logs', ['admin', 'admin-logs']],
            ['/admin/registration', ['admin']],
        ]

        for (const [routePath, modules] of cases) {
            const resolved = resolveLocaleMessageModulesForPath(routePath)
            expect(resolved).toEqual(expect.arrayContaining([...LOCALE_CORE_MODULES, ...modules]))
        }
    })

    it('adds the demo module in demo mode only', () => {
        expect(resolveLocaleMessageModulesForPath('/login')).not.toContain('demo')
        expect(resolveLocaleMessageModulesForPath('/login', { demoMode: true })).toContain('demo')
    })

    it('keeps module order stable in resolved results', () => {
        const resolved = resolveLocaleMessageModulesForPath('/en-US/admin/users')
        const expected = LOCALE_MESSAGE_MODULES.filter((moduleName) => resolved.includes(moduleName))
        expect(resolved).toEqual(expected)
    })
})

/**
 * 页面覆盖守卫：`pages/**` 的每个路由都必须在路由映射里有明确期望。
 *
 * 新增页面时本用例会失败，强制作者在 `PAGE_MODULE_EXPECTATIONS` 里登记该页需要哪些模块，
 * 避免「新页面文案静默变成 key」。
 */
const PAGE_MODULE_EXPECTATIONS: Record<string, string[]> = {
    '/': [],
    '/about': [],
    '/privacy': [],
    '/terms': [],
    '/login': ['auth'],
    '/register': ['auth'],
    '/forgot-password': ['auth'],
    '/change-password': ['auth'],
    '/quick-login': ['auth'],
    '/sso-login': ['sso'],
    '/profile': ['profile'],
    '/security': ['security'],
    '/oauth/clients': ['oauth'],
    '/oauth/consent': ['oauth'],
    '/admin/users': ['admin', 'admin-users'],
    '/admin/oauth/applications': ['admin', 'admin-oauth'],
    '/admin/sso/providers': ['admin', 'admin-sso'],
    '/admin/logs': ['admin', 'admin-logs'],
    '/admin/registration': ['admin'],
}

function listPageRoutes(dir = path.resolve(process.cwd(), 'pages')): string[] {
    const entries = readdirSync(dir, { withFileTypes: true })
    const routes: string[] = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            routes.push(...listPageRoutes(fullPath))
            continue
        }
        if (!entry.name.endsWith('.vue')) {
            continue
        }
        const relative = path.relative(path.resolve(process.cwd(), 'pages'), fullPath)
            .replace(/\.vue$/u, '')
            .replace(/(?:^|\/)index$/u, '')
        routes.push(`/${relative}`.replace(/\/$/u, '') || '/')
    }

    return routes.sort()
}

describe('i18n/config/locale-modules 页面覆盖', () => {
    it('registers an expectation for every page route', () => {
        expect(listPageRoutes()).toEqual(Object.keys(PAGE_MODULE_EXPECTATIONS).sort())
    })

    it('resolves the expected modules for every page route', () => {
        for (const [route, modules] of Object.entries(PAGE_MODULE_EXPECTATIONS)) {
            const resolved = resolveLocaleMessageModulesForPath(route)
            for (const moduleName of modules) {
                expect(resolved, `${route} 需要 ${moduleName}`).toContain(moduleName)
            }
        }
    })
})
