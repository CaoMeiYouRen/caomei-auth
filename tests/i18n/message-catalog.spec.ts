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
            /* 日语 / 韩语与中文共用汉字或带品牌名，由下一条「本地文字覆盖率」断言覆盖 */
            if (locale.code.startsWith('zh-') || locale.code === 'ja-JP' || locale.code === 'ko-KR') {
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

    /* 汉字区间无法区分中日韩，日语与韩语改为「本地文字覆盖率 + 简体特征字黑名单」 */
    const CJK_SCRIPT_LOCALES = [
        /* 日语汉字合法，只能靠黑名单兜中文；韩语正文不应出现任何汉字，可做更强的逐条断言 */
        { code: 'ja-JP', script: /[\u3040-\u30ff]/u, scriptName: '假名', forbidCjk: false },
        { code: 'ko-KR', script: /[\uac00-\ud7af]/u, scriptName: '한글', forbidCjk: true },
    ] as const

    /* 品牌名「草梅 Auth」是唯一允许出现在非中文语言包里的汉字 */
    const BRAND_PATTERN = /草梅\s*Auth|草梅/gu

    for (const { code, script, scriptName, forbidCjk } of CJK_SCRIPT_LOCALES) {
        it(`${code} 为本地语言文案（${scriptName}覆盖达标且不混入简体中文特征字）`, () => {
            const locale = ENABLED_LOCALES.find((item) => item.code === code)
            expect(locale, `${code} 应处于启用状态`).toBeDefined()
            if (!locale) {
                return
            }

            /* 直接读原始 JSON：主 vitest 配置（Nuxt 环境）下 `import.meta.glob` 取到的可能不是文案本身，
             * 内容类断言会静默失效（见 docs/plan/backlog.md §3.2「message-catalog 内容断言覆盖范围待确认」） */
            const readModule = (moduleName: string) => flattenMessages(JSON.parse(readFileSync(
                join(import.meta.dirname, '..', '..', 'i18n', 'locales', locale.code, `${moduleName}.json`),
                'utf8',
            )))
            const entries = LOCALE_MESSAGE_MODULES.flatMap(readModule)
            const withScript = entries.filter(([, value]) => script.test(value))
            expect(withScript.length / entries.length, `${code} 的${scriptName}覆盖率过低，疑似混入中文原文`).toBeGreaterThan(0.7)

            /* 逐模块下限：整段模块被中文覆盖时全局覆盖率仍可能达标 */
            for (const moduleName of LOCALE_MESSAGE_MODULES) {
                const moduleEntries = readModule(moduleName)
                if (moduleEntries.length === 0) {
                    continue
                }
                const moduleWithScript = moduleEntries.filter(([, value]) => script.test(value))
                expect(moduleWithScript.length / moduleEntries.length, `${code} 的 ${moduleName} ${scriptName}覆盖率过低`).toBeGreaterThan(0.4)
            }

            for (const [key, value] of entries) {
                const simplified = [...value].filter((char) => SIMPLIFIED_ONLY_CHARS.has(char))
                expect(simplified, `${code} 的 ${key} 含简体中文特征字：${simplified.join('')}`).toEqual([])

                if (forbidCjk) {
                    /* 韩语不使用汉字：剥离品牌名后不允许残留任何 CJK，比黑名单更强 */
                    const withoutBrand = value.replace(BRAND_PATTERN, '')
                    expect(CJK_PATTERN.test(withoutBrand), `${code} 的 ${key} 残留中文：${value}`).toBe(false)
                }
            }
        })
    }

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
