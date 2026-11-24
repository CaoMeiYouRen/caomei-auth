import { describe, expect, it } from 'vitest'
import {
    diffPlaceholders,
    extractPlaceholders,
    listLocaleDirectories,
    loadLocaleMessages,
    loadLocaleRegistry,
} from '../../scripts/i18n/lib/locale-data.mjs'
import {
    auditDisabledLocales,
    auditLocaleDirectory,
    formatLocaleDiffDetails,
    formatPlaceholderDiffs,
    parseAllowIncompleteArg,
} from '../../scripts/i18n/lib/locale-parity.mjs'

/**
 * 语言目录级门禁与占位符同构。
 *
 * 纯函数用内存夹具覆盖判定分支；最后一条用真实 `i18n/locales` 目录确认当前仓态
 * （未启用语言目录未创建时只输出待建清单，不误报错误）。
 */

type LoadedLocale = {
    locale: string
    files: string[]
    modules: Map<string, unknown>
    flat: Map<string, unknown>
    duplicates: { key: string, files: string[] }[]
}

function createLoadedLocale(
    files: Record<string, Record<string, unknown>>,
    duplicates: { key: string, files: string[] }[] = [],
): LoadedLocale {
    const flat = new Map<string, unknown>()
    for (const messages of Object.values(files)) {
        for (const [key, value] of Object.entries(messages)) {
            flat.set(key, value)
        }
    }
    return {
        locale: 'fixture',
        files: Object.keys(files).sort(),
        modules: new Map(Object.entries(files)),
        flat,
        duplicates,
    }
}

describe('i18n 占位符抽取', () => {
    it('识别命名、格式化与位置占位符', () => {
        expect(extractPlaceholders('Welcome {name}')).toEqual(['name'])
        expect(extractPlaceholders('{count, number} 条记录')).toEqual(['count'])
        expect(extractPlaceholders('第 {0} 项 / 共 {1} 项')).toEqual(['0', '1'])
    })

    it('跳过字面量转义、空占位符与重复项', () => {
        expect(extractPlaceholders('联系 {\'@\'} 管理员')).toEqual([])
        expect(extractPlaceholders('{} 与 { }')).toEqual([])
        expect(extractPlaceholders('{name} 与 {name}')).toEqual(['name'])
    })

    it('非字符串值不产生占位符', () => {
        expect(extractPlaceholders(undefined)).toEqual([])
        expect(extractPlaceholders(42)).toEqual([])
    })
})

describe('i18n 占位符同构比较', () => {
    it('报告缺失与多余的占位符', () => {
        const base = new Map<string, unknown>([
            ['auth.login', '欢迎 {name}，共 {count} 次'],
            ['auth.plain', '纯文案'],
        ])
        const target = new Map<string, unknown>([
            ['auth.login', 'Welcome {name} for {user}'],
            ['auth.plain', 'Plain'],
        ])

        expect(diffPlaceholders(base, target)).toEqual([
            { key: 'auth.login', missing: ['count'], extra: ['user'] },
        ])
    })

    it('目标语言缺键时跳过，避免与缺键报告重复', () => {
        const base = new Map<string, unknown>([['auth.missing', '你好 {name}']])
        const target = new Map<string, unknown>()

        expect(diffPlaceholders(base, target)).toEqual([])
    })

    it('基准语言无占位符而目标语言新增占位符时报告多余', () => {
        const base = new Map<string, unknown>([['auth.plain', '纯文案']])
        const target = new Map<string, unknown>([['auth.plain', 'Plain {oops}']])

        expect(diffPlaceholders(base, target)).toEqual([
            { key: 'auth.plain', missing: [], extra: ['oops'] },
        ])
    })

    it('渲染差异明细到键，超出上限时截断', () => {
        expect(formatPlaceholderDiffs([
            { key: 'auth.login', missing: ['count'], extra: [] },
            { key: 'sso.callback', missing: [], extra: ['provider'] },
        ])).toBe('  - auth.login: 缺少 {count}\n  - sso.callback: 多余 {provider}')

        const many = Array.from({ length: 3 }, (_, index) => ({ key: `key.${index}`, missing: [], extra: ['x'] }))
        expect(formatPlaceholderDiffs(many, 2)).toContain('还有 1 项')
    })
})

describe('语言目录级审计', () => {
    const base = createLoadedLocale({
        'common.json': { appName: '{name}', plain: '纯文案' },
        'auth.json': { login: '登录 {count}' },
    })

    it('结构同构时不报错', () => {
        const target = createLoadedLocale({
            'auth.json': { login: 'Anmelden {count}' },
            'common.json': { appName: '{name}', plain: 'Nur Text' },
        })

        const report = auditLocaleDirectory({ locale: 'de-DE', target, base, baseLocale: 'zh-CN' })
        expect(report.errors).toEqual([])
        expect(report.details.placeholderDiffs).toEqual([])
    })

    it('缺文件、缺键、多余文件与占位符差异都进入明细', () => {
        const target = createLoadedLocale({
            'common.json': { appName: 'Anmelden', extra: 'Mehr' },
            'demo.json': { title: 'Demo' },
        })

        const report = auditLocaleDirectory({ locale: 'de-DE', target, base, baseLocale: 'zh-CN' })
        expect(report.errors).toEqual([
            'de-DE 缺少语言文件：auth.json',
            'de-DE 存在基准语言没有的语言文件：demo.json',
            'de-DE 缺少键（2）',
            'de-DE 多余键（2）',
            'de-DE 占位符不一致（1）',
        ])
        expect(report.details.missingFiles).toEqual(['auth.json'])
        expect(report.details.extraFiles).toEqual(['demo.json'])
        expect(report.details.missing).toEqual(['login', 'plain'])
        expect(report.details.extra).toEqual(['extra', 'title'])
        expect(report.details.placeholderDiffs).toEqual([
            { key: 'appName', missing: ['name'], extra: [] },
        ])
    })

    it('空目录按缺文件与缺键报告', () => {
        const report = auditLocaleDirectory({
            locale: 'es-ES',
            target: createLoadedLocale({}),
            base,
            baseLocale: 'zh-CN',
        })

        expect(report.errors).toEqual([
            'es-ES 缺少语言文件：auth.json, common.json',
            'es-ES 缺少键（3）',
        ])
        expect(formatLocaleDiffDetails(report.details)).toContain('  缺少键：')
    })

    it('重复键与非字符串值单独报告', () => {
        const target = createLoadedLocale(
            { 'common.json': { appName: '{name}', plain: 42 } },
            [{ key: 'appName', files: ['common.json', 'auth.json'] }],
        )

        const report = auditLocaleDirectory({
            locale: 'es-ES',
            target,
            base: createLoadedLocale({ 'common.json': { appName: '{name}', plain: '纯文案' } }),
            baseLocale: 'zh-CN',
        })

        expect(report.errors).toContain('es-ES 存在跨模块重复键：appName')
        expect(report.errors).toContain('es-ES 的 plain 不是字符串（结构不一致）')
    })

    it('目录未创建时只进待建清单', async () => {
        const result = await auditDisabledLocales({
            locales: ['es-ES', 'fr-FR'],
            directories: ['zh-CN'],
            base,
            baseLocale: 'zh-CN',
        })

        expect(result.errors).toEqual([])
        expect(result.pending).toEqual(['es-ES', 'fr-FR'])
        expect(result.reports).toEqual([])
    })

    it('目录存在时执行审计并汇总错误', async () => {
        const result = await auditDisabledLocales({
            locales: ['es-ES', 'fr-FR'],
            directories: ['es-ES'],
            base,
            baseLocale: 'zh-CN',
            loadMessages: async () => createLoadedLocale({
                'common.json': { appName: '{name}', plain: 'Solo texto' },
                'auth.json': { login: 'Acceder' },
            }),
        })

        expect(result.pending).toEqual(['fr-FR'])
        expect(result.reports).toHaveLength(1)
        expect(result.reports[0]?.errors).toEqual(['es-ES 占位符不一致（1）'])
        expect(result.errors).toEqual(['es-ES 占位符不一致（1）'])
    })

    it('--allow-incomplete 白名单降级为 warning，不进阻断列表', async () => {
        const result = await auditDisabledLocales({
            locales: ['de-DE'],
            directories: ['de-DE'],
            base,
            baseLocale: 'zh-CN',
            allowIncomplete: ['de-DE'],
            loadMessages: async () => createLoadedLocale({
                'common.json': { appName: 'Anmelden' },
                'auth.json': { login: 'Anmelden {count}' },
            }),
        })

        expect(result.errors).toEqual([])
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]?.locale).toBe('de-DE')
        expect(result.reports[0]?.errors).not.toEqual([])
    })

    it('解析白名单参数：只接受等号形式，裸参数回报 bare 由调用方报错', () => {
        expect(parseAllowIncompleteArg(['node', 'script', '--allow-incomplete=de-DE,es-ES']))
            .toEqual({ codes: ['de-DE', 'es-ES'], bare: false })
        expect(parseAllowIncompleteArg(['--allow-incomplete=de-DE', '--allow-incomplete=ru-RU,pt-BR']))
            .toEqual({ codes: ['de-DE', 'ru-RU', 'pt-BR'], bare: false })
        expect(parseAllowIncompleteArg(['--allow-incomplete=', 'x'])).toEqual({ codes: [], bare: false })
        expect(parseAllowIncompleteArg(['--allow-incomplete', 'de-DE'])).toEqual({ codes: [], bare: true })
        expect(parseAllowIncompleteArg([])).toEqual({ codes: [], bare: false })
    })

    it('当前仓态：未启用语言目录未创建且不产生错误', async () => {
        const registry = await loadLocaleRegistry()
        const directories = await listLocaleDirectories()
        const defaultLocale = String(registry.DEFAULT_LOCALE)
        const disabledLocales = registry.LOCALE_REGISTRY
            .filter((locale: Record<string, unknown>) => locale.enabled !== true)
            .map((locale: Record<string, unknown>) => String(locale.code))
        const baseLocale = await loadLocaleMessages(defaultLocale)

        /* 补数据开始时，这里与 `i18n:check` 会同时变红：按需更新断言并走 --allow-incomplete 分批 */
        expect(
            disabledLocales,
            '补数据开始时：更新本断言、在 package.json 的 i18n:check-sync 登记白名单，并把已同构语言移出 pending 期望',
        ).toEqual(['es-ES', 'fr-FR', 'de-DE', 'ru-RU', 'pt-BR'])

        const result = await auditDisabledLocales({
            locales: disabledLocales,
            directories,
            base: baseLocale,
            baseLocale: defaultLocale,
        })

        expect(result.errors).toEqual([])
        expect(result.pending).toEqual(disabledLocales)
        expect(result.reports).toEqual([])
    })
})
