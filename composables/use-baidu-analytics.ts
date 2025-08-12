/**
 * 百度统计 composable
 */

// 百度统计命令类型定义
type BaiduAnalyticsCommand =
    | ['_trackPageview']
    | ['_trackPageview', string]
    | ['_trackEvent', string, string]
    | ['_trackEvent', string, string, string]
    | ['_trackEvent', string, string, string, number]
    | ['_setCustomVar', number, string, string, number]

declare global {
    interface Window {
        _hmt?: BaiduAnalyticsCommand[]
    }
}

export interface BaiduAnalyticsMethods {
    /**
     * 跟踪页面访问
     * @param page 页面路径（可选）
     */
    trackPageview: (page?: string) => void

    /**
     * 跟踪自定义事件
     * @param category 事件类别
     * @param action 事件动作
     * @param label 事件标签（可选）
     * @param value 事件值（可选）
     */
    trackEvent: (category: string, action: string, label?: string, value?: number) => void

    /**
     * 设置自定义变量
     * @param index 自定义变量索引 (1-5)
     * @param name 变量名称
     * @param value 变量值
     * @param scope 作用域 (1=访客级别, 2=会话级别, 3=页面级别)
     */
    setCustomVar: (index: number, name: string, value: string, scope: number) => void

    /**
     * 检查百度统计是否已加载
     */
    isLoaded: () => boolean
}

/**
 * 使用百度统计
 * @returns 百度统计方法集合
 */
export const useBaiduAnalytics = (): BaiduAnalyticsMethods => {
    const checkBaiduAnalytics = (): boolean => typeof window !== 'undefined' && typeof window._hmt !== 'undefined'

    const trackPageview = (page?: string): void => {
        if (checkBaiduAnalytics() && window._hmt) {
            if (page) {
                window._hmt.push(['_trackPageview', page])
            } else {
                window._hmt.push(['_trackPageview'])
            }
        }
    }

    const trackEvent = (category: string, action: string, label?: string, value?: number): void => {
        if (checkBaiduAnalytics() && window._hmt) {
            if (value !== undefined && label) {
                window._hmt.push(['_trackEvent', category, action, label, value])
            } else if (label) {
                window._hmt.push(['_trackEvent', category, action, label])
            } else {
                window._hmt.push(['_trackEvent', category, action])
            }
        }
    }

    const setCustomVar = (index: number, name: string, value: string, scope: number): void => {
        if (checkBaiduAnalytics() && window._hmt && index >= 1 && index <= 5) {
            window._hmt.push(['_setCustomVar', index, name, value, scope])
        }
    }

    const isLoaded = (): boolean => checkBaiduAnalytics()

    return {
        trackPageview,
        trackEvent,
        setCustomVar,
        isLoaded,
    }
}
