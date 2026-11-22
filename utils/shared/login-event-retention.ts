/**
 * 登录事件保留期口径（阶段 12 D19，服务端与维护脚本共享）。
 *
 * 只包含纯常量与解析函数，不依赖项目别名，便于 `node` 直接加载。
 */
export const LOGIN_EVENT_RETENTION_DEFAULT_DAYS = 90
export const LOGIN_EVENT_RETENTION_MIN_DAYS = 1
export const LOGIN_EVENT_RETENTION_MAX_DAYS = 3650

/** 非法、缺省与越界值统一回落默认 90 天，不把 0 / 空串当成「立即删除」 */
export function resolveLoginEventRetentionDays(value: unknown): number {
    if (value === null || value === undefined || value === '') {
        return LOGIN_EVENT_RETENTION_DEFAULT_DAYS
    }
    const days = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(days) || !Number.isInteger(days)) {
        return LOGIN_EVENT_RETENTION_DEFAULT_DAYS
    }
    if (days < LOGIN_EVENT_RETENTION_MIN_DAYS || days > LOGIN_EVENT_RETENTION_MAX_DAYS) {
        return LOGIN_EVENT_RETENTION_DEFAULT_DAYS
    }
    return days
}
