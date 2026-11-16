/**
 * 统一解析 API 错误文案。
 *
 * ofetch 在非 2xx 时抛出的 `FetchError.message` 是 `[GET] "url": 500 ...` 这类技术串，
 * 服务端本地化后的用户可读文案位于 `error.data.message`。优先取本地化 message，
 * 其次取非技术的 `error.message`，最后回退到调用方提供的兜底文案。
 */

/** ofetch 技术串前缀，例如 `[GET] "https://...": 500 内部错误` */
const TECHNICAL_MESSAGE_PATTERN = /^\[(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\]\s+"?/u

function readMessage(source: unknown): string | undefined {
    if (typeof source !== 'object' || source === null) {
        return undefined
    }
    const message = (source as { message?: unknown }).message
    if (typeof message !== 'string') {
        return undefined
    }
    const trimmed = message.trim()
    return trimmed ? trimmed : undefined
}

/**
 * 从错误对象中取出可直接展示给用户的文案。
 * @param error 捕获到的错误（ofetch FetchError、Error 或任意值）
 * @param fallback 无法解析时使用的本地化兜底文案
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    const data = typeof error === 'object' && error !== null
        ? (error as { data?: unknown }).data
        : undefined
    const localized = readMessage(data)
    if (localized) {
        return localized
    }

    const message = readMessage(error)
    if (message && !TECHNICAL_MESSAGE_PATTERN.test(message)) {
        return message
    }

    return fallback
}
