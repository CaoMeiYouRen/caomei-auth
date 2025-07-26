/**
 * Clarity 分析工具 Composable
 * 提供 Microsoft Clarity 的所有功能
 */
export const useClarity = () => {
    const { $clarity } = useNuxtApp()

    return {
        /**
         * 标识 API - 用于设置自定义标识符
         * 为获得最佳用户跟踪效果，即使不传递 custom-session-id 或 custom-page-id，
         * 也应为网站的每个页面调用 Identify API
         *
         * @param customId 客户的唯一标识符（必需）- Clarity 会在客户端安全地对此 ID 进行哈希处理
         * @param customSessionId 自定义会话标识符（可选）
         * @param customPageId 自定义页面标识符（可选）
         * @param friendlyName 客户的友好名称（可选）
         */
        identify: (customId: string, customSessionId?: string, customPageId?: string, friendlyName?: string) => {
            if ($clarity) {
                $clarity.identify(customId, customSessionId, customPageId, friendlyName)
            }
        },

        /**
         * 自定义标签 API - 为会话应用任意标签
         * Clarity 提供了许多预定义的过滤和分析网站数据的方法。
         * 但是，您可能希望跟踪特定于您的网站或用户体验的元素。
         * 使用自定义标签，您可以为您的 Clarity 会话应用任意标签。
         *
         * @param key 标签的键
         * @param value 标签的值（可以是字符串或字符串数组）
         */
        setTag: (key: string, value: string | string[]) => {
            if ($clarity) {
                $clarity.setTag(key, value)
            }
        },

        /**
         * 自定义事件 API - 跟踪自定义事件
         * 如果您更喜欢通过 Clarity API 手动跟踪这些用户操作，
         * 请使用您想要跟踪的操作调用事件 API。
         * 当 Clarity 收集此事件的数据时，它会与您的其他智能事件一起出现在
         * 过滤器、仪表板、设置和录制垂直区域中。
         *
         * @param eventName 事件名称
         */
        event: (eventName: string) => {
            if ($clarity) {
                $clarity.event(eventName)
            }
        },

        /**
         * Cookie 同意 API - 设置 Cookie 同意状态
         * 如果您的项目配置为需要 Cookie 同意，Clarity 使用唯一的第一方 Cookie
         * 通过浏览器 Cookie 跟踪每个用户。如果需要 Cookie 同意，
         * 您必须调用同意 API 以表明您已获得用户同意使用 Cookie 跟踪他们。
         *
         * @param consent 是否同意使用 Cookie（默认为 true）
         */
        consent: (consent = true) => {
            if ($clarity) {
                $clarity.consent(consent)
            }
        },

        /**
         * 升级会话 API - 优先记录特定类型的会话
         * 您可以使用升级 API 来优先记录特定类型的会话。
         * 如果您有具有特定类型事件（如点击）的会话，或者与网站特定部分
         * （如购物车）的交互，这将很有用。
         *
         * @param reason 升级原因
         */
        upgrade: (reason: string) => {
            if ($clarity) {
                $clarity.upgrade(reason)
            }
        },
    }
}
