import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * 单测用的 `useI18nText` 替身。
 *
 * Nuxt 测试环境不会加载语言包（`$i18n` 的 message 为空），直接调用 composer 会得到
 * 键名。这里在测试侧读取 zh-CN 语言文件并提供同样的 `t(key, named)` 语义，让断言
 * 仍针对真实中文文案，而不是键名。
 */
function flatten(value: unknown, prefix = ''): Record<string, string> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return prefix ? { [prefix]: String(value) } : {}
    }
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, child]) => {
        Object.assign(acc, flatten(child, prefix ? `${prefix}.${key}` : key))
        return acc
    }, {})
}

function loadZhMessages(): Record<string, string> {
    const dir = path.resolve(process.cwd(), 'i18n/locales/zh-CN')
    return Object.fromEntries(
        readdirSync(dir)
            .filter((file) => file.endsWith('.json'))
            .flatMap((file) => Object.entries(flatten(JSON.parse(readFileSync(path.join(dir, file), 'utf8'))))),
    )
}

const messages = loadZhMessages()

function interpolate(template: string, named?: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (raw, name: string) => (named && name in named ? String(named[name]) : raw))
}

export function useI18nText() {
    return (key: string, named?: Record<string, unknown>): string => {
        const template = messages[key]
        return typeof template === 'string' ? interpolate(template, named) : key
    }
}
