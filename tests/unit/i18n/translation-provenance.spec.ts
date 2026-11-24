import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { provenancePath } from '../../../scripts/i18n/lib/locale-data.mjs'
import { validateTranslationProvenance } from '../../../scripts/i18n/lib/translation-provenance.mjs'
import { LOCALE_MESSAGE_MODULES } from '@/i18n/config/locale-modules'
import { LOCALE_REGISTRY } from '@/i18n/config/locale-registry'

/**
 * 译文台账消费方（阶段 14 M2.1）：台账条目集合、模块名、readiness 与 nativeReview
 * 必须与 Registry 对齐。
 */

const localeModules = ['app', 'common']
type LocaleDefinition = { code: string, readiness: string, enabled: boolean }

const jaDefinition: LocaleDefinition[] = [{ code: 'ja-JP', readiness: 'ui-ready', enabled: true }]

function entry(overrides: Record<string, unknown> = {}) {
    return {
        nativeReview: false,
        readiness: 'ui-ready',
        reviewedModules: ['app'],
        pendingModules: ['common'],
        ...overrides,
    }
}

function validate(provenance: unknown, definitions: LocaleDefinition[] = jaDefinition) {
    return validateTranslationProvenance({ provenance, localeModules, localeDefinitions: definitions })
}

describe('译文台账校验', () => {
    it('模块名、readiness 与 nativeReview 一致时不报错', () => {
        expect(validate({ locales: { 'ja-JP': entry() } })).toEqual([])
    })

    it('模块名不在 LOCALE_MESSAGE_MODULES 时报错', () => {
        expect(validate({ locales: { 'ja-JP': entry({ pendingModules: ['common', 'ghost'] }) } })).toEqual([
            'ja-JP 的模块名不在 LOCALE_MESSAGE_MODULES：ghost',
        ])
    })

    it('readiness 与 Registry 不一致时报错', () => {
        expect(validate({ locales: { 'ja-JP': entry({ readiness: 'seo-ready' }) } })).toEqual([
            'ja-JP 的 readiness（seo-ready）与 Registry（ui-ready）不一致',
        ])
    })

    it('nativeReview 非布尔时报错', () => {
        expect(validate({ locales: { 'ja-JP': entry({ nativeReview: 'no' }) } })).toEqual([
            'ja-JP 的 nativeReview 必须为布尔值',
        ])
    })

    it('模块并集未覆盖全集时报错', () => {
        expect(validate({ locales: { 'ja-JP': entry({ pendingModules: [] }) } })).toEqual([
            'ja-JP 的 reviewedModules ∪ pendingModules 未覆盖：common',
        ])
    })

    it('同一模块同时出现在已审校与待审校时报错', () => {
        expect(validate({ locales: { 'ja-JP': entry({ pendingModules: ['app', 'common'] }) } })).toEqual([
            'ja-JP 的模块同时出现在 reviewedModules 与 pendingModules：app',
        ])
    })

    it('非 seo-ready 的启用语言漏登记时报错', () => {
        expect(validate({ locales: {} })).toEqual([
            'ja-JP 是非 seo-ready 启用语言，必须在台账登记',
        ])
    })

    it('已 seo-ready 或未启用的语言不应登记', () => {
        const definitions = [
            ...jaDefinition,
            { code: 'zh-CN', readiness: 'seo-ready', enabled: true },
            { code: 'de-DE', readiness: 'draft', enabled: false },
        ]
        const errors = validate({
            locales: {
                'ja-JP': entry(),
                'zh-CN': entry({ readiness: 'seo-ready' }),
                'de-DE': entry({ readiness: 'draft' }),
            },
        }, definitions)

        expect(errors).toEqual([
            'zh-CN 已为 seo-ready，不应登记在台账',
            'de-DE 未启用，不应登记在台账',
        ])
    })

    it('未登记语言与非法条目分别报错', () => {
        expect(validate({ locales: { 'xx-XX': entry() } }, [])).toEqual(['xx-XX 未在 Locale Registry 中登记'])
        expect(validate({ locales: { 'ja-JP': null } })).toEqual(['ja-JP 的台账条目不是对象'])
        expect(validate({ locales: { 'ja-JP': { ...entry(), reviewedModules: 'app' } } })).toEqual([
            'ja-JP 的 reviewedModules / pendingModules 必须为数组',
        ])
    })

    it('缺少 locales 对象或形态非法时报错', () => {
        expect(validate({})).toEqual(['台账缺少 locales 对象'])
        expect(validate(null)).toEqual(['台账缺少 locales 对象'])
        expect(validate({ locales: [] })).toEqual(['台账的 locales 必须是对象'])
    })

    it('当前台账与 Registry / 模块表一致', () => {
        const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'))

        expect(validateTranslationProvenance({
            provenance,
            localeModules: LOCALE_MESSAGE_MODULES,
            localeDefinitions: LOCALE_REGISTRY,
        })).toEqual([])
    })
})
