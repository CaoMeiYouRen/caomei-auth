const READINESS_LEVELS = new Set(['draft', 'ui-ready', 'seo-ready'])

/**
 * 校验 Locale Registry 与磁盘语言包的一致性。
 *
 * @param {{ DEFAULT_LOCALE: string, LOCALE_REGISTRY: Array<Record<string, unknown>> }} registry
 * @param {{ directories: string[], filesByLocale: Record<string, string[]> }} diskState
 *   `filesByLocale` 的值是该 locale 目录下的 JSON 文件名（如 `common.json`）。
 * @returns {string[]} 错误列表；空数组表示通过
 */
export function validateLocaleRegistry(registry, diskState) {
    const errors = []
    const locales = Array.isArray(registry.LOCALE_REGISTRY) ? registry.LOCALE_REGISTRY : []
    const directories = new Set(diskState.directories)
    const codes = new Set()

    if (locales.length === 0) {
        errors.push('Locale Registry 为空')
        return errors
    }

    for (const locale of locales) {
        const code = typeof locale.code === 'string' ? locale.code : ''
        if (!code) {
            errors.push('存在缺少 code 的 locale')
            continue
        }
        if (codes.has(code)) {
            errors.push(`locale 重复：${code}`)
        }
        codes.add(code)
    }

    const defaults = locales.filter((locale) => locale.default === true)
    if (defaults.length !== 1) {
        errors.push(`必须且只能有一个默认语言，当前为 ${defaults.length} 个`)
    } else if (defaults[0].code !== registry.DEFAULT_LOCALE) {
        errors.push(`DEFAULT_LOCALE（${registry.DEFAULT_LOCALE}）必须与默认语言（${defaults[0].code}）一致`)
    }

    const prefixes = new Set()
    for (const locale of locales) {
        const code = typeof locale.code === 'string' ? locale.code : ''
        if (!code) {
            continue
        }
        const label = `locale ${code}`

        if (typeof locale.name !== 'string' || !locale.name.trim()) {
            errors.push(`${label} 缺少 name`)
        }
        if (typeof locale.nativeName !== 'string' || !locale.nativeName.trim()) {
            errors.push(`${label} 缺少 nativeName`)
        }
        if (locale.dir !== 'ltr' && locale.dir !== 'rtl') {
            errors.push(`${label} 的 dir 必须是 ltr 或 rtl`)
        }
        if (!READINESS_LEVELS.has(String(locale.readiness))) {
            errors.push(`${label} 的 readiness 非法：${String(locale.readiness)}`)
        }

        const indexable = locale.indexable === true
        if (indexable && locale.readiness !== 'seo-ready') {
            errors.push(`${label} 尚未 seo-ready，indexable 必须为 false`)
        }
        if (locale.switchable === true && locale.readiness === 'draft') {
            errors.push(`${label} 仍是 draft，不能开放切换`)
        }

        if (!directories.has(code)) {
            errors.push(`${label} 在 i18n/locales 下缺少目录`)
        }

        const fallbackChain = Array.isArray(locale.fallbackChain) ? locale.fallbackChain.map(String) : []
        if (fallbackChain.length === 0) {
            errors.push(`${label} 缺少 fallbackChain`)
        } else {
            if (fallbackChain[0] !== code) {
                errors.push(`${label} 的 fallbackChain 首项必须是自身`)
            }
            for (const fallback of fallbackChain) {
                if (!codes.has(fallback)) {
                    errors.push(`${label} 的 fallbackChain 引用了未注册语言：${fallback}`)
                }
            }
            if (!fallbackChain.includes(registry.DEFAULT_LOCALE)) {
                errors.push(`${label} 的 fallbackChain 必须最终回退到 ${registry.DEFAULT_LOCALE}`)
            }
        }

        const routePrefix = typeof locale.routePrefix === 'string' ? locale.routePrefix : ''
        if (locale.default === true) {
            if (routePrefix !== '') {
                errors.push(`${label} 是默认语言，routePrefix 必须为空`)
            }
        } else {
            if (!routePrefix.startsWith('/')) {
                errors.push(`${label} 的 routePrefix 必须以 / 开头`)
            }
            if (routePrefix.endsWith('/')) {
                errors.push(`${label} 的 routePrefix 不能以 / 结尾`)
            }
        }
        if (routePrefix) {
            if (prefixes.has(routePrefix)) {
                errors.push(`routePrefix 重复：${routePrefix}`)
            }
            prefixes.add(routePrefix)
        }

        const registeredFiles = Array.isArray(locale.files) ? locale.files.map(String) : []
        if (registeredFiles.length === 0) {
            errors.push(`${label} 未声明任何语言文件`)
        }

        const seenFiles = new Set()
        for (const file of registeredFiles) {
            const expectedPrefix = `${code}/`
            if (!file.startsWith(expectedPrefix)) {
                errors.push(`${label} 的语言文件必须以 ${expectedPrefix} 开头：${file}`)
                continue
            }
            if (!file.endsWith('.json')) {
                errors.push(`${label} 的语言文件必须是 JSON：${file}`)
            }
            const fileName = file.slice(expectedPrefix.length)
            if (fileName.includes('/') || !fileName) {
                errors.push(`${label} 的语言文件必须位于 locale 目录第一层：${file}`)
            }
            if (seenFiles.has(fileName)) {
                errors.push(`${label} 重复声明语言文件：${file}`)
            }
            seenFiles.add(fileName)

            const diskFiles = diskState.filesByLocale[code] ?? []
            if (!diskFiles.includes(fileName)) {
                errors.push(`${label} 声明的语言文件不存在：${file}`)
            }
        }

        const diskFiles = diskState.filesByLocale[code] ?? []
        for (const fileName of diskFiles) {
            if (!seenFiles.has(fileName)) {
                errors.push(`${label} 存在未注册的语言文件：${code}/${fileName}`)
            }
        }
    }

    for (const directory of directories) {
        if (!codes.has(directory)) {
            errors.push(`i18n/locales/${directory} 未在 Locale Registry 中登记`)
        }
    }

    return errors
}
