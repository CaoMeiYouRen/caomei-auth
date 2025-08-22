/**
 * 百度统计 (Baidu Analytics) 类型定义
 */

// 百度统计全局变量类型
type BaiduAnalyticsCommand =
    | ['_trackPageview', string?]
    | ['_trackEvent', string, string, string?, number?]
    | ['_setCustomVar', number, string, string, number]
    | ['_setAccount', string]
    | ['_setDomainName', string]
    | ['_addIgnoredOrganic', string]
    | ['_addIgnoredRef', string]

declare global {
    interface Window {
        /**
         * 百度统计命令队列
         * 用于向百度统计发送跟踪命令
         */
        _hmt?: BaiduAnalyticsCommand[]
    }

    /**
     * 百度统计全局变量
     */

    var _hmt: BaiduAnalyticsCommand[] | undefined
}

/**
 * 百度统计工具方法接口
 */
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

declare module '#app' {
    interface NuxtApp {
        $baidu?: BaiduAnalyticsMethods
    }
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $baidu?: BaiduAnalyticsMethods
    }
}

export { }
