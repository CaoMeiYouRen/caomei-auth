import { defaultErrorMessages } from './error-messages-zh'

/** 服务端错误消息键前缀 */
export const ERROR_KEY_PREFIX = 'errors.'

export type ErrorTranslator = (key: string) => string

export function isErrorMessageKey(message: string): boolean {
    return message.startsWith(ERROR_KEY_PREFIX)
}

/** 未接入翻译时的兜底：返回 zh-CN 文案，避免把键直接暴露给用户 */
export function getDefaultErrorMessage(key: string): string {
    return defaultErrorMessages[key.slice(ERROR_KEY_PREFIX.length)] ?? key
}

/**
 * 把错误消息键解析成用户可读文案。
 *
 * - `errors.*` 键 → 用当前语言翻译；
 * - 翻译缺失（vue-i18n 回退为键本身）或未提供翻译函数 → 使用 zh-CN 兜底；
 * - 普通文本（非键）原样返回。
 */
export function resolveErrorMessage(message: string | undefined | null, translate?: ErrorTranslator): string {
    if (!message) {
        return ''
    }
    if (!isErrorMessageKey(message)) {
        return message
    }
    const translated = translate?.(message)
    if (translated && translated !== message) {
        return translated
    }
    return getDefaultErrorMessage(message)
}
