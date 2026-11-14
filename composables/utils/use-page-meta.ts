import { computed } from 'vue'

/**
 * 页面级 SEO / 标题：标题与描述统一走 i18n 键，避免在页面里硬编码中文。
 *
 * - `titleKey` 必填；`descriptionKey` 缺省时回退为标题文案；
 * - 站点名取 `app.name`（core 模块），页面键由页面所属模块提供（懒加载模块在
 *   路由中间件执行后已合并，SSR 与客户端都能取到）；
 * - 用函数形式调用 `useHead`，语言切换后标题 / 描述会随之更新。
 */
export function usePageMeta(titleKey: string, descriptionKey?: string) {
    const { t } = useI18n()

    const pageTitle = computed(() => t(titleKey))
    const description = computed(() => (descriptionKey ? t(descriptionKey) : pageTitle.value))
    const fullTitle = computed(() => {
        const appName = t('app.name')
        return pageTitle.value ? `${pageTitle.value} - ${appName}` : appName
    })

    useHead(() => ({
        title: fullTitle.value,
        meta: [
            { name: 'description', content: description.value },
            { property: 'og:title', content: fullTitle.value },
            { property: 'og:description', content: description.value },
        ],
    }))
}
