import { defaultValidationMessages } from './validation-messages-zh'

/** 校验消息键前缀：schema 内的自定义规则只写键，边界层负责翻译 */
export const VALIDATION_KEY_PREFIX = 'validation.'

const defaultMessages = defaultValidationMessages

export type ValidationTranslator = (key: string) => string

export function isValidationMessageKey(message: string): boolean {
    return message.startsWith(VALIDATION_KEY_PREFIX)
}

/** 未接入翻译时的兜底：返回 zh-CN 文案，避免把键直接暴露给用户 */
export function getDefaultValidationMessage(key: string): string {
    return defaultMessages[key.slice(VALIDATION_KEY_PREFIX.length)] ?? key
}

/**
 * 把 Zod issue 的 message 解析成用户可读文案。
 *
 * - 自定义规则的 message 是 `validation.*` 键 → 用当前语言翻译；
 * - 翻译缺失（vue-i18n 回退为键本身）或未提供翻译函数时 → 使用 zh-CN 兜底；
 * - 普通文本（非键）原样返回。
 */
export function resolveValidationMessage(message: string | undefined | null, translate?: ValidationTranslator): string {
    if (!message) {
        return ''
    }
    if (!isValidationMessageKey(message)) {
        return message
    }
    const translated = translate?.(message)
    if (translated && translated !== message) {
        return translated
    }
    return getDefaultValidationMessage(message)
}
