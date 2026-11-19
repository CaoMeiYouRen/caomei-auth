import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { LOCALE_MESSAGE_MODULES, getLocaleMessageFilePaths } from '@/i18n/config/locale-modules'
import { DEFAULT_LOCALE, ENABLED_LOCALES } from '@/i18n/config/locale-registry'

/**
 * 语言包运行时门禁：结构、可编译性与文案卫生。
 *
 * 与 `pnpm i18n:check`（文件系统 + 治理脚本）互补：这里用 vue-i18n 真实编译每条文案，
 * 能拦住「`|` 复数分隔符误用、占位符未闭合、花括号语法错误」这类运行期才暴露的问题。
 */
type LocaleMessages = Record<string, unknown>

const catalogs = import.meta.glob('../../i18n/locales/**/*.json', {
    eager: true,
    import: 'default',
}) as Record<string, LocaleMessages>

const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u

/**
 * 简体中文特征字（日语新字体里不出现的写法）。
 *
 * 兜底而非完备：汉字区间无法区分中日，这里只拦高频简体写法（含「败 / 编 / 辑」这类
 * 中文 Admin 文案常见字），完整判定仍需母语审校或简繁对照表。
 */
const SIMPLIFIED_ONLY_CHARS = new Set([
    ...'这们应该户录验证设页载时间关于请谢语说读输类选择删认为无网络邮账显权开统图标题帮联变浏览广拦缓备链隐议决产监复击码识记忆转单员组构节环现发确实际质强败编辑',
])

function localeCatalogPath(locale: string, moduleName: string): string {
    return `../../i18n/locales/${locale}/${moduleName}.json`
}

function flattenMessages(value: unknown, prefix = ''): [string, string][] {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return prefix ? [[prefix, String(value)]] : []
    }
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
        flattenMessages(child, prefix ? `${prefix}.${key}` : key),
    )
}

function mergeModules(locale: string): LocaleMessages {
    return LOCALE_MESSAGE_MODULES.reduce<LocaleMessages>((messages, moduleName) => {
        const moduleMessages = catalogs[localeCatalogPath(locale, moduleName)] ?? {}
        return { ...messages, ...moduleMessages }
    }, {})
}

describe('i18n 语言包运行时门禁', () => {
    it('每个启用语言都有全部模块文件', () => {
        for (const locale of ENABLED_LOCALES) {
            for (const file of getLocaleMessageFilePaths(locale.code)) {
                expect(catalogs[`../../i18n/locales/${file}`], file).toBeDefined()
            }
        }
    })

    it('各语言与默认语言的键集合一致', () => {
        const baseKeys = flattenMessages(mergeModules(DEFAULT_LOCALE)).map(([key]) => key).sort()

        for (const locale of ENABLED_LOCALES) {
            if (locale.code === DEFAULT_LOCALE) {
                continue
            }
            const targetKeys = flattenMessages(mergeModules(locale.code)).map(([key]) => key).sort()
            expect(targetKeys).toEqual(baseKeys)
        }
    })

    it('非中文语言包不含中文', () => {
        for (const locale of ENABLED_LOCALES) {
            /* 日语与中文共用汉字区间，由下一条假名覆盖率断言覆盖 */
            if (locale.code.startsWith('zh-') || locale.code === 'ja-JP') {
                continue
            }
            for (const [key, value] of flattenMessages(mergeModules(locale.code))) {
                /* `language.short` / `language.label` 是语言切换器里的母语名（如 中文），允许保留中文 */
                if (key === 'language.short' || key === 'language.label') {
                    continue
                }
                expect(CJK_PATTERN.test(value), `${locale.code} 的 ${key} 仍含中文`).toBe(false)
            }
        }
    })

    it('ja-JP 为日文文案（假名覆盖达标且不混入简体中文特征字）', () => {
        const locale = ENABLED_LOCALES.find((item) => item.code === 'ja-JP')
        expect(locale, 'ja-JP 应处于启用状态（阶段 8 M8 起）').toBeDefined()
        if (!locale) {
            return
        }

        /* 直接读原始 JSON：主 vitest 配置（Nuxt 环境）下 `import.meta.glob` 拿到的是带位置元数据的结构，
         * 不是文案本身，内容类断言会静默失效（见 docs/plan/backlog.md §3.2「message-catalog 内容断言覆盖范围待确认」） */
        const entries = LOCALE_MESSAGE_MODULES.flatMap((moduleName) => flattenMessages(
            JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'i18n', 'locales', locale.code, `${moduleName}.json`), 'utf8')),
        ))
        const kanaPattern = /[\u3040-\u30ff]/u
        const withKana = entries.filter(([, value]) => kanaPattern.test(value))
        /* 汉字与中文同区间，改用覆盖率断言：日文文案绝大多数含假名（当前 86%，阈值留足机翻与短标签余量） */
        expect(withKana.length / entries.length, 'ja-JP 假名覆盖率过低，疑似混入中文原文').toBeGreaterThan(0.7)

        /* 逐模块下限：整段模块被中文覆盖时全局覆盖率仍可能达标（当前最低 admin / common 约 45%–68%） */
        for (const moduleName of LOCALE_MESSAGE_MODULES) {
            const moduleEntries = flattenMessages(JSON.parse(readFileSync(
                join(import.meta.dirname, '..', '..', 'i18n', 'locales', locale.code, `${moduleName}.json`),
                'utf8',
            )))
            if (moduleEntries.length === 0) {
                continue
            }
            const moduleKana = moduleEntries.filter(([, value]) => kanaPattern.test(value))
            expect(moduleKana.length / moduleEntries.length, `ja-JP 的 ${moduleName} 假名覆盖率过低`).toBeGreaterThan(0.4)
        }

        for (const [key, value] of entries) {
            const simplified = [...value].filter((char) => SIMPLIFIED_ONLY_CHARS.has(char))
            expect(simplified, `ja-JP 的 ${key} 含简体中文特征字：${simplified.join('')}`).toEqual([])
        }
    })

    it('文案不使用 `|` 复数分隔符', () => {
        for (const locale of ENABLED_LOCALES) {
            for (const [key, value] of flattenMessages(mergeModules(locale.code))) {
                expect(value.includes('|'), `${locale.code} 的 ${key} 含复数分隔符`).toBe(false)
            }
        }
    })

    it('每条文案都能被 vue-i18n 编译并取到值', () => {
        for (const locale of ENABLED_LOCALES) {
            const messages = mergeModules(locale.code)
            /* Registry 含未启用语言，类型上只允许当前启用语言；运行时仍逐语言校验 */
            const i18n = createI18n({ legacy: false, locale: locale.code as never, fallbackLocale: false })
            i18n.global.setLocaleMessage(locale.code, messages)

            for (const [key] of flattenMessages(messages)) {
                expect(() => i18n.global.t(key), `${locale.code} 的 ${key} 编译失败`).not.toThrow()
            }
        }
    })
})
