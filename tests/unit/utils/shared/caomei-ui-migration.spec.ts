import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { stripLocalePrefix } from '@/i18n/config/locale-registry'
import { CAOMEI_UI_ROUTE_PREFIXES, isCaomeiUiRoute } from '@/utils/shared/caomei-ui-migration'

const PRIMEVUE_TAG_PATTERN = /<(Button|InputText|Select|Dropdown|Textarea|IconField|InputIcon|Accordion|AccordionPanel|AccordionHeader|AccordionContent|Avatar|DataTable|Column|Dialog|Badge|Checkbox|Password|Tag|ConfirmDialog|InputNumber|Menu|MultiSelect|Toast)\b/u
const PRIMEVUE_IMPORT_PATTERN = /from\s+['"]primevue\//u

const MIGRATED_PAGE_FILES = [
    'pages/login.vue',
    'pages/register.vue',
    'pages/forgot-password.vue',
    'pages/change-password.vue',
    'pages/quick-login.vue',
    'pages/profile.vue',
    'pages/security.vue',
    'pages/oauth/consent.vue',
    'pages/sso-login.vue',
    /* P4 拆条提交：页面先迁移，路由白名单延后到整路由完成；自基线随批次同批重采
     * （见 docs/design/governance/2026-11-10-p4-0-decisions.md §7）。
     * M3 完成后 `/admin/users` 已整路由切齐，页面与 4 个对话框同列断言。
     * M4 先迁移 `/admin/oauth/applications` 页面，M5 完成 3 个对话框与白名单登记后整路由切齐。 */
    'pages/admin/users.vue',
    'pages/admin/oauth/applications.vue',
    /* M6 迁移 SSO 提供商页，M7 迁移 3 个表单，M8 完成 2 个对话框与白名单登记后整路由切齐。 */
    'pages/admin/sso/providers.vue',
]

const MIGRATED_SHARED_PATHS = [
    'components/auth-left.vue',
    'components/password-strength.vue',
    'components/captcha.vue',
    'components/send-code-button-v2.vue',
    'components/theme-toggle-v2.vue',
    'components/base/base-dialog-v2.vue',
    'components/base/input-v2.vue',
    'components/base/password-v2.vue',
    'components/base/phone-input-v2.vue',
    'components/admin/users',
    'components/admin/oauth',
    'components/admin/sso',
    'components/profile',
    'components/security',
]

function collectVueFiles(target) {
    const absolute = path.resolve(process.cwd(), target)
    const info = statSync(absolute)
    if (info.isFile()) {
        return [target]
    }
    return readdirSync(absolute, { withFileTypes: true })
        .flatMap((entry) => collectVueFiles(path.join(target, entry.name)))
}

describe('utils/shared/caomei-ui-migration', () => {
    it('默认白名单包含 P2/P3 试点路由与 P4 已切齐的 Admin 路由', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES).toEqual(['/login', '/register', '/forgot-password', '/change-password', '/quick-login', '/profile', '/security', '/oauth/consent', '/sso-login', '/admin/users', '/admin/oauth/applications', '/admin/sso/providers'])
        expect(isCaomeiUiRoute('/login')).toBe(true)
        expect(isCaomeiUiRoute('/admin/users')).toBe(true)
        expect(isCaomeiUiRoute('/admin/oauth/applications')).toBe(true)
        expect(isCaomeiUiRoute('/admin/sso/providers')).toBe(true)
        expect(isCaomeiUiRoute('/')).toBe(false)
    })

    it('带 locale 前缀时按去前缀后的路径命中', () => {
        expect(isCaomeiUiRoute(stripLocalePrefix('/en-US/login'))).toBe(true)
        expect(isCaomeiUiRoute(stripLocalePrefix('/en-US/register'))).toBe(true)
    })

    it('按路径段匹配前缀', () => {
        const prefixes = ['/login', '/admin/users']

        expect(isCaomeiUiRoute('/login', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/login/oauth', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/admin/users', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/admin/users/123', prefixes)).toBe(true)
    })

    it('不把相似前缀当作命中', () => {
        const prefixes = ['/login']

        expect(isCaomeiUiRoute('/login-extra', prefixes)).toBe(false)
        expect(isCaomeiUiRoute('/loginfo', prefixes)).toBe(false)
    })

    it('忽略查询串与哈希', () => {
        const prefixes = ['/login']

        expect(isCaomeiUiRoute('/login?mode=email', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/login#form', prefixes)).toBe(true)
    })

    it('容忍带尾斜杠或空字符串的前缀', () => {
        const prefixes = ['/login/', '', '/']

        expect(isCaomeiUiRoute('/login', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/other', prefixes)).toBe(false)
    })

    it('每个白名单路由都有对应页面文件', () => {
        for (const prefix of CAOMEI_UI_ROUTE_PREFIXES) {
            expect(statSync(path.resolve(process.cwd(), `pages${prefix}.vue`)).isFile()).toBe(true)
        }
    })

    it('已迁移页面与共享组件不含 PrimeVue 标签或显式导入', () => {
        const files = [
            ...MIGRATED_PAGE_FILES,
            ...MIGRATED_SHARED_PATHS.flatMap((target) => collectVueFiles(target)),
        ]

        for (const file of files) {
            const source = readFileSync(path.resolve(process.cwd(), file), 'utf8')
            expect(source, `${file} 仍包含 PrimeVue 模板标签`).not.toMatch(PRIMEVUE_TAG_PATTERN)
            expect(source, `${file} 仍显式导入 PrimeVue`).not.toMatch(PRIMEVUE_IMPORT_PATTERN)
        }
    })

    it('P4 路由不在白名单内', () => {
        for (const pathname of ['/', '/about', '/privacy', '/terms', '/index', '/oauth/clients', '/admin/logs']) {
            expect(isCaomeiUiRoute(pathname), `${pathname} 不应命中白名单`).toBe(false)
        }
    })
})
