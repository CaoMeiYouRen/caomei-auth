/**
 * 百度统计插件 - 客户端插件
 * 等效实现百度统计的原始 JavaScript 代码
 */

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const baiduAnalyticsId = config.public.baiduAnalyticsId as string

    // 只在客户端且配置了百度统计 ID 时执行
    if (baiduAnalyticsId && import.meta.client) {
        // 初始化百度统计全局变量
        window._hmt = window._hmt || []

        // 等效实现原始的百度统计代码
        // var _hmt = _hmt || [];
        // (function() {
        //   var hm = document.createElement("script");
        //   hm.src = "https://hm.baidu.com/hm.js?xxx";
        //   var s = document.getElementsByTagName("script")[0];
        //   s.parentNode.insertBefore(hm, s);
        // })();

        // 创建脚本元素
        const script = document.createElement('script')
        script.src = `https://hm.baidu.com/hm.js?${baiduAnalyticsId}`
        script.async = true

        // 将脚本插入到第一个 script 标签之前
        const firstScript = document.getElementsByTagName('script')[0]
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript)
        } else {
            // 如果没有找到 script 标签，就插入到 head 中
            document.head.appendChild(script)
        }

        // 提供全局访问方法
        return {
            provide: {
                baiduAnalytics: {
                    /**
                     * 跟踪页面访问
                     * @param page 页面路径（可选）
                     */
                    trackPageview(page?: string) {
                        if (window._hmt) {
                            if (page) {
                                window._hmt.push(['_trackPageview', page])
                            } else {
                                window._hmt.push(['_trackPageview'])
                            }
                        }
                    },

                    /**
                     * 跟踪自定义事件
                     * @param category 事件类别
                     * @param action 事件动作
                     * @param label 事件标签（可选）
                     * @param value 事件值（可选）
                     */
                    trackEvent(category: string, action: string, label?: string, value?: number) {
                        if (window._hmt) {
                            if (value !== undefined && label) {
                                window._hmt.push(['_trackEvent', category, action, label, value])
                            } else if (label) {
                                window._hmt.push(['_trackEvent', category, action, label])
                            } else {
                                window._hmt.push(['_trackEvent', category, action])
                            }
                        }
                    },

                    /**
                     * 设置自定义变量
                     * @param index 自定义变量索引 (1-5)
                     * @param name 变量名称
                     * @param value 变量值
                     * @param scope 作用域 (1=访客级别, 2=会话级别, 3=页面级别)
                     */
                    setCustomVar(index: number, name: string, value: string, scope: number) {
                        if (window._hmt && index >= 1 && index <= 5) {
                            window._hmt.push(['_setCustomVar', index, name, value, scope])
                        }
                    },

                    /**
                     * 检查百度统计是否已加载
                     */
                    isLoaded() {
                        return typeof window !== 'undefined' && typeof window._hmt !== 'undefined'
                    },
                },
            },
        }
    }
})
