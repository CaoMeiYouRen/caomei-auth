import Clarity from '@microsoft/clarity'
import type { ClarityMethods } from '@/types/clarity'

export default defineNuxtPlugin((): { provide: { clarity: ClarityMethods } } | void => {
    const config = useRuntimeConfig()
    const clarityProjectId = config.public.clarityProjectId as string

    if (clarityProjectId && import.meta.client) {
        // 初始化 Clarity
        Clarity.init(clarityProjectId)

        // 提供全局访问方法
        return {
            provide: {
                clarity: {
                    /**
                     * 标识 API - 用于设置自定义标识符
                     * @param customId 客户的唯一标识符（必需）
                     * @param customSessionId 自定义会话标识符（可选）
                     * @param customPageId 自定义页面标识符（可选）
                     * @param friendlyName 客户的友好名称（可选）
                     */
                    identify(customId: string, customSessionId?: string, customPageId?: string, friendlyName?: string) {
                        Clarity.identify(customId, customSessionId, customPageId, friendlyName)
                    },

                    /**
                     * 自定义标签 API - 为会话应用任意标签
                     * @param key 标签的键
                     * @param value 标签的值
                     */
                    setTag(key: string, value: string | string[]) {
                        Clarity.setTag(key, value)
                    },

                    /**
                     * 自定义事件 API - 跟踪自定义事件
                     * @param eventName 事件名称
                     */
                    event(eventName: string) {
                        Clarity.event(eventName)
                    },

                    /**
                     * Cookie 同意 API - 设置 Cookie 同意状态
                     * @param consent 是否同意使用 Cookie（默认为 true）
                     */
                    consent(consent = true) {
                        Clarity.consent(consent)
                    },

                    /**
                     * 升级会话 API - 优先记录特定类型的会话
                     * @param reason 升级原因
                     */
                    upgrade(reason: string) {
                        Clarity.upgrade(reason)
                    },
                } satisfies ClarityMethods,
            },
        }
    }
})
