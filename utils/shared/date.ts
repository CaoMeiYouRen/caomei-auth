import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 安装插件
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化日期时间为标准格式
 * @param date 日期字符串、数字或Date对象
 * @returns 格式化后的日期时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: string | number | Date | null | undefined): string {
    if (!date) {
        return '-'
    }
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期为简短格式
 * @param date 日期字符串、数字或Date对象
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(date: string | number | Date | null | undefined): string {
    if (!date) {
        return '-'
    }
    return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化日期为本地化格式
 * @param date 日期字符串、数字或Date对象
 * @param locale 本地化设置，默认为 'zh-CN'
 * @returns 格式化后的日期时间字符串
 */
export function formatDateLocale(date: string | number | Date | null | undefined, locale: string = 'zh-CN'): string {
    if (!date) {
        return '-'
    }
    return new Date(date).toLocaleString(locale)
}

/**
 * 格式化相对时间
 * @param date 日期字符串、数字或Date对象
 * @returns 相对时间描述
 */
export function formatRelativeTime(date: string | number | Date | null | undefined): string {
    if (!date) {
        return '-'
    }
    return dayjs(date).fromNow()
}

/**
 * 格式化日期为自定义格式
 * @param date 日期字符串、数字或Date对象
 * @param format 自定义格式字符串
 * @returns 格式化后的日期字符串
 */
export function formatCustomDate(date: string | number | Date | null | undefined, format: string): string {
    if (!date) {
        return '-'
    }
    return dayjs(date).format(format)
}
