/**
 * Google Analytics 插件 - 客户端插件
 * 实现 Google Analytics gtag.js
 */

// Google Analytics gtag 函数定义
function gtag(...args: unknown[]) {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(args)
    }
}

export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()
    const googleAnalyticsId = runtimeConfig.public.googleAnalyticsId as string

    // 只在客户端且配置了 Google Analytics ID 时执行
    if (googleAnalyticsId && import.meta.client) {
        // 初始化 Google Analytics 全局变量
        window.dataLayer = window.dataLayer || []

        // 将 gtag 函数添加到 window 对象
        window.gtag = gtag

        gtag('js', new Date())
        gtag('config', googleAnalyticsId)

        // 动态加载 Google Analytics gtag.js 脚本
        const script = document.createElement('script')
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`
        script.async = true

        // 将脚本插入到 head 中
        document.head.appendChild(script)

        // 提供全局访问方法
        return {
            provide: {
                googleAnalytics: {
                    /**
                     * 跟踪页面访问
                     * @param pageConfig 配置对象
                     */
                    trackPageview(pageConfig?: {
                        page_title?: string
                        page_location?: string
                        page_path?: string
                    }) {
                        if (window.gtag) {
                            window.gtag('config', googleAnalyticsId, pageConfig)
                        }
                    },

                    /**
                     * 跟踪自定义事件
                     * @param eventName 事件名称
                     * @param parameters 事件参数
                     */
                    trackEvent(eventName: string, parameters?: Record<string, unknown>) {
                        if (window.gtag) {
                            window.gtag('event', eventName, parameters)
                        }
                    },

                    /**
                     * 设置用户属性
                     * @param properties 用户属性
                     */
                    setUserProperties(properties: Record<string, unknown>) {
                        if (window.gtag) {
                            window.gtag('set', properties)
                        }
                    },

                    /**
                     * 设置配置
                     * @param measurementId 测量 ID
                     * @param configOptions 配置对象
                     */
                    setConfig(measurementId: string, configOptions?: Record<string, unknown>) {
                        if (window.gtag) {
                            window.gtag('config', measurementId, configOptions)
                        }
                    },

                    /**
                     * 检查 Google Analytics 是否已加载
                     */
                    isLoaded() {
                        return typeof window !== 'undefined' &&
                            typeof window.gtag === 'function' &&
                            Array.isArray(window.dataLayer)
                    },
                },
            },
        }
    }

    // 如果没有配置 Google Analytics ID，返回空的提供者
    return {
        provide: {
            googleAnalytics: {
                trackPageview: () => {
                    // 空实现，不执行任何操作
                },
                trackEvent: () => {
                    // 空实现，不执行任何操作
                },
                setUserProperties: () => {
                    // 空实现，不执行任何操作
                },
                setConfig: () => {
                    // 空实现，不执行任何操作
                },
                isLoaded: () => false,
            },
        },
    }
})
