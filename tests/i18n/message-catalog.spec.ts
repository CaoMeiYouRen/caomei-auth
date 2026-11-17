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
            if (locale.code.startsWith('zh-')) {
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
