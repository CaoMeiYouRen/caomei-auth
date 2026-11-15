/** 错误页可识别的 HTTP 状态码；其余一律按 `unknown` 文案处理。 */
export const ERROR_STATUS_CODES = [400, 401, 403, 404, 500] as const

export type ErrorStatusKey = `${(typeof ERROR_STATUS_CODES)[number]}` | 'unknown'

/** 状态码 → `app.error.status.*` 文案键；字面量集中在此，便于 i18n 审计扫描到完整键名。 */
export const ERROR_STATUS_MESSAGE_KEYS: Record<ErrorStatusKey, { title: string, description: string }> = {
    '400': { title: 'app.error.status.400.title', description: 'app.error.status.400.description' },
    '401': { title: 'app.error.status.401.title', description: 'app.error.status.401.description' },
    '403': { title: 'app.error.status.403.title', description: 'app.error.status.403.description' },
    '404': { title: 'app.error.status.404.title', description: 'app.error.status.404.description' },
    '500': { title: 'app.error.status.500.title', description: 'app.error.status.500.description' },
    unknown: { title: 'app.error.status.unknown.title', description: 'app.error.status.unknown.description' },
}

/** 把任意状态码映射到 `app.error.status.*` 的键段；缺失或非标准值回退 `unknown`。 */
export function resolveErrorStatusKey(statusCode?: number): ErrorStatusKey {
    const known = ERROR_STATUS_CODES.includes(statusCode as (typeof ERROR_STATUS_CODES)[number])
    return known ? (String(statusCode) as ErrorStatusKey) : 'unknown'
}

export interface ErrorViewInput {
    statusCode?: number
    statusMessage?: string
    dataMessage?: unknown
}

export interface ErrorView {
    statusKey: ErrorStatusKey
    code: string
    title: string
    description: string
    /** 附加详情：优先 `error.data.message`；未知状态码时才回退框架 `statusMessage` */
    detail: string
}

/**
 * 错误页展示文案的唯一解析入口。
 *
 * 标题 / 描述一律本地化：`statusMessage` 是框架英文（`Page not found: /x`），只允许在
 * 未知状态码时作为附加详情出现，避免中文页面混入英文标题。
 */
export function resolveErrorView(input: ErrorViewInput, translate: (key: string) => string): ErrorView {
    const statusKey = resolveErrorStatusKey(input.statusCode)
    const keys = ERROR_STATUS_MESSAGE_KEYS[statusKey]
    const dataMessage = typeof input.dataMessage === 'string' ? input.dataMessage : ''
    return {
        statusKey,
        code: statusKey === 'unknown' ? translate('app.error.status.unknown.code') : String(input.statusCode ?? ''),
        title: translate(keys.title),
        description: translate(keys.description),
        detail: dataMessage || (statusKey === 'unknown' ? input.statusMessage || '' : ''),
    }
}
