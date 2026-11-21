/**
 * 换邮箱冷静期配置（阶段 10 D5 / M2.4）。
 *
 * 默认 24 小时，上限 72 小时；非法值、0 与负数一律回退默认，
 * 不做「0 就立即生效」的隐式语义（回滚场景才用，见阶段 10 登记 §9）。
 */
export const CHANNEL_CHANGE_COOLING_OFF_DEFAULT_HOURS = 24
export const CHANNEL_CHANGE_COOLING_OFF_MAX_HOURS = 72

/** 解析冷静期小时数：越界或非法值回退默认值 */
export function resolveCoolingOffHours(value: unknown): number {
    const hours = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(hours) || hours <= 0 || hours > CHANNEL_CHANGE_COOLING_OFF_MAX_HOURS) {
        return CHANNEL_CHANGE_COOLING_OFF_DEFAULT_HOURS
    }
    return hours
}

/** 小时转毫秒 */
export function coolingOffHoursToMs(hours: number): number {
    return hours * 60 * 60 * 1000
}
