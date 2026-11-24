/**
 * 译文台账校验（口径见 docs/standards/i18n.md §5.1）。
 *
 * 台账 `i18n/translation-provenance.json` 记录非 seo-ready 启用语言的译文来源与审校状态；
 * 本模块把「台账条目集合」与「登记字段」同时对齐 Registry / 模块表，供 `pnpm i18n:check` 调用。
 */

/**
 * @param {object} options
 * @param {unknown} options.provenance 解析后的台账对象
 * @param {readonly string[]} options.localeModules `LOCALE_MESSAGE_MODULES`
 * @param {readonly { code: string, readiness: string, enabled: boolean }[]} options.localeDefinitions Registry 语言定义
 * @returns {string[]} 错误清单（空表示通过）
 */
export function validateTranslationProvenance({ provenance, localeModules, localeDefinitions }) {
    if (!provenance || typeof provenance !== 'object' || !provenance.locales || typeof provenance.locales !== 'object') {
        return ['台账缺少 locales 对象']
    }
    if (Array.isArray(provenance.locales)) {
        return ['台账的 locales 必须是对象']
    }

    const moduleSet = new Set(localeModules)
    const definitionByCode = new Map(localeDefinitions.map((locale) => [locale.code, locale]))
    const registeredCodes = Object.keys(provenance.locales)
    const errors = []

    /* 条目集合必须与「非 seo-ready 的启用语言」一致：漏登记与多登记都会静默漂移 */
    const expectedCodes = localeDefinitions
        .filter((locale) => locale.enabled === true && locale.readiness !== 'seo-ready')
        .map((locale) => locale.code)
    for (const code of expectedCodes) {
        if (!registeredCodes.includes(code)) {
            errors.push(`${code} 是非 seo-ready 启用语言，必须在台账登记`)
        }
    }
    const skipCodes = new Set()
    for (const code of registeredCodes) {
        const definition = definitionByCode.get(code)
        if (!definition) {
            continue
        }
        if (definition.enabled !== true) {
            errors.push(`${code} 未启用，不应登记在台账`)
            skipCodes.add(code)
        } else if (definition.readiness === 'seo-ready') {
            errors.push(`${code} 已为 seo-ready，不应登记在台账`)
            skipCodes.add(code)
        }
    }

    for (const code of registeredCodes) {
        const definition = definitionByCode.get(code)
        if (!definition) {
            errors.push(`${code} 未在 Locale Registry 中登记`)
            continue
        }
        if (skipCodes.has(code)) {
            continue
        }

        const entry = provenance.locales[code]
        if (!entry || typeof entry !== 'object') {
            errors.push(`${code} 的台账条目不是对象`)
            continue
        }

        if (typeof entry.nativeReview !== 'boolean') {
            errors.push(`${code} 的 nativeReview 必须为布尔值`)
        }
        if (entry.readiness !== definition.readiness) {
            errors.push(`${code} 的 readiness（${String(entry.readiness)}）与 Registry（${definition.readiness}）不一致`)
        }
        if (!Array.isArray(entry.reviewedModules) || !Array.isArray(entry.pendingModules)) {
            errors.push(`${code} 的 reviewedModules / pendingModules 必须为数组`)
            continue
        }

        const listedModules = [...new Set([...entry.reviewedModules, ...entry.pendingModules])]
        const unknownModules = listedModules.filter((moduleName) => !moduleSet.has(moduleName))
        if (unknownModules.length > 0) {
            errors.push(`${code} 的模块名不在 LOCALE_MESSAGE_MODULES：${unknownModules.join(', ')}`)
        }

        const overlapModules = entry.reviewedModules.filter((moduleName) => entry.pendingModules.includes(moduleName))
        if (overlapModules.length > 0) {
            errors.push(`${code} 的模块同时出现在 reviewedModules 与 pendingModules：${[...new Set(overlapModules)].join(', ')}`)
        }

        const coveredModules = new Set(listedModules)
        const uncoveredModules = localeModules.filter((moduleName) => !coveredModules.has(moduleName))
        if (uncoveredModules.length > 0) {
            errors.push(`${code} 的 reviewedModules ∪ pendingModules 未覆盖：${uncoveredModules.join(', ')}`)
        }
    }

    return errors
}
