/**
 * 时区工具：解析优先级为「用户设置 > 浏览器时区 > UTC」。
 * 存储使用 IANA 名称（如 Asia/Shanghai），非法值一律回退，避免 Intl 抛错。
 */

export const DEFAULT_TIME_ZONE = 'UTC'

/** 是否为合法 IANA 时区名 */
export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
    if (!timeZone || typeof timeZone !== 'string' || timeZone.length > 64) {
        return false
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date(0))
        return true
    } catch {
        return false
    }
}

/** 按「用户设置 > 浏览器时区 > UTC」解析生效时区 */
export function resolveTimeZone(userTimeZone?: string | null, browserTimeZone?: string | null): string {
    if (isValidTimeZone(userTimeZone)) {
        return userTimeZone
    }
    if (isValidTimeZone(browserTimeZone)) {
        return browserTimeZone
    }
    return DEFAULT_TIME_ZONE
}

/** 读取浏览器时区（SSR / 旧环境返回 undefined） */
export function getBrowserTimeZone(): string | undefined {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return undefined
    }
}

/** 可选项列表：IANA 时区 + UTC，按名称排序 */
export function getTimeZoneOptions(): { label: string, value: string }[] {
    let zones: string[] = []
    try {
        zones = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
    } catch {
        zones = []
    }
    if (zones.length === 0) {
        zones = ['Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles']
    }
    /* Intl.supportedValuesOf('timeZone') 不包含 UTC，单独补在首位 */
    return ['UTC', ...zones.filter((zone) => zone !== 'UTC')].map((zone) => ({ label: zone, value: zone }))
}

/** 按指定时区格式化日期时间（服务端 / 邮件复用；非法时区回退 UTC） */
export function formatDateTimeInTimeZone(date: string | number | Date, timeZone: string | null | undefined, locale = 'zh-CN'): string {
    const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: zone,
    }).format(new Date(date))
}
