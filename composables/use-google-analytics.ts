/**
 * Google Analytics composable
 */

// Google Analytics 命令类型定义
type GoogleAnalyticsCommand =
    | ['config', string, Record<string, unknown>?]
    | ['event', string, Record<string, unknown>?]
    | ['set', Record<string, unknown>]
    | ['get', string]
    | ['js', Date]

declare global {
    interface Window {
        gtag?: (...args: GoogleAnalyticsCommand) => void
        dataLayer?: unknown[]
    }
}

export interface GoogleAnalyticsMethods {
    /**
     * 跟踪页面访问
     * @param config 配置对象
     */
    trackPageview: (config?: {
        page_title?: string
        page_location?: string
        page_path?: string
    }) => void

    /**
     * 跟踪自定义事件
     * @param eventName 事件名称
     * @param parameters 事件参数
     */
    trackEvent: (eventName: string, parameters?: Record<string, unknown>) => void

    /**
     * 设置用户属性
     * @param properties 用户属性
     */
    setUserProperties: (properties: Record<string, unknown>) => void

    /**
     * 设置配置
     * @param measurementId 测量 ID
     * @param config 配置对象
     */
    setConfig: (measurementId: string, config?: Record<string, unknown>) => void

    /**
     * 检查 Google Analytics 是否已加载
     */
    isLoaded: () => boolean
}

/**
 * 使用 Google Analytics
 * @returns Google Analytics 方法集合
 */
export const useGoogleAnalytics = (): GoogleAnalyticsMethods => {
    const checkGoogleAnalytics = (): boolean => typeof window !== 'undefined'
        && typeof window.gtag === 'function'
        && Array.isArray(window.dataLayer)

    const trackPageview = (config?: {
        page_title?: string
        page_location?: string
        page_path?: string
    }): void => {
        if (checkGoogleAnalytics() && window.gtag) {
            const runtimeConfig = useRuntimeConfig()
            const googleAnalyticsId = runtimeConfig.public.googleAnalyticsId as string
            if (googleAnalyticsId) {
                window.gtag('config', googleAnalyticsId, config)
            }
        }
    }

    const trackEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
        if (checkGoogleAnalytics() && window.gtag) {
            window.gtag('event', eventName, parameters)
        }
    }

    const setUserProperties = (properties: Record<string, unknown>): void => {
        if (checkGoogleAnalytics() && window.gtag) {
            window.gtag('set', properties)
        }
    }

    const setConfig = (measurementId: string, configObject?: Record<string, unknown>): void => {
        if (checkGoogleAnalytics() && window.gtag) {
            window.gtag('config', measurementId, configObject)
        }
    }

    const isLoaded = (): boolean => checkGoogleAnalytics()

    return {
        trackPageview,
        trackEvent,
        setUserProperties,
        setConfig,
        isLoaded,
    }
}
