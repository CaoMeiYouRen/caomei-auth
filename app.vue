<template>
    <div>
        <CaomeiConfigProvider :locale="caomeiLocale">
            <CaomeiTooltipProvider>
                <CaomeiToastProvider>
                    <CaomeiConfirmDialog>
                        <NuxtLayout>
                            <NuxtPage />
                        </NuxtLayout>
                    </CaomeiConfirmDialog>
                </CaomeiToastProvider>
            </CaomeiTooltipProvider>
        </CaomeiConfigProvider>
    </div>
</template>

<script setup lang="ts">
import { useCaomeiLocale } from '@/composables/utils/use-caomei-locale'
import { isIndexableHreflang, isIndexableOgLocale } from '@/utils/shared/seo'

const runtimeConfig = useRuntimeConfig()
const publicConfig = runtimeConfig.public

// 组件库内建文案跟随应用 locale（Select 空态 / Paginator / DataTable 空态 / Toast / Confirm）
const caomeiLocale = useCaomeiLocale()

// 默认站点标题跟随语言；页面可用 usePageMeta 覆盖
const { t } = useI18n()

// SEO / html lang：由 Locale Registry 驱动的 useLocaleHead 输出；
// alternates 只保留 `seo-ready` 且可索引的语言（阶段 5 M18），ui-ready 语言不进入索引。
const i18nHead = useLocaleHead({ seo: true })

type HeadLink = { id?: string, hreflang?: string, rel?: string, href?: string }
type HeadMeta = { id?: string, property?: string, content?: string }

/* `@nuxtjs/i18n` 的 baseUrl 在构建期固化；部署域名可能与构建环境不同，
 * 这里按运行时请求源重写 canonical / hreflang / og:url 的 origin。 */
const requestURL = useRequestURL()
const siteOrigin = ref(requestURL.origin)
onMounted(() => {
    siteOrigin.value = window.location.origin
})

function withRuntimeOrigin(href?: string): string | undefined {
    if (!href) {
        return href
    }
    try {
        const url = new URL(href)
        return `${siteOrigin.value}${url.pathname}${url.search}${url.hash}`
    } catch {
        return href
    }
}

const seoLinks = computed(() => (i18nHead.value.link ?? []).filter((link) => {
    const item = link as HeadLink
    if (item.id === 'i18n-xd' || item.id === 'i18n-can') {
        return true
    }
    if (item.id?.startsWith('i18n-alt-')) {
        return isIndexableHreflang(item.hreflang)
    }
    return true
}).map((link) => {
    const item = link as HeadLink
    return { ...link, href: withRuntimeOrigin(item.href) } as (typeof i18nHead.value.link)[number]
}))

const seoMeta = computed(() => (i18nHead.value.meta ?? []).filter((meta) => {
    const item = meta as HeadMeta
    if (item.id?.startsWith('i18n-og-alt-')) {
        return isIndexableOgLocale(item.content)
    }
    if (item.property === 'og:locale') {
        return isIndexableOgLocale(item.content)
    }
    return true
}).map((meta) => {
    const item = meta as HeadMeta
    return (item.property === 'og:url' ? { ...meta, content: withRuntimeOrigin(item.content) } : meta) as (typeof i18nHead.value.meta)[number]
}))

useHead(() => ({
    title: t('app.title'),
    htmlAttrs: {
        lang: i18nHead.value.htmlAttrs?.lang,
        dir: i18nHead.value.htmlAttrs?.dir,
    },
    link: seoLinks.value,
    meta: seoMeta.value,
}))

if (import.meta.client && publicConfig.captchaProvider === 'google-recaptcha' && publicConfig.recaptchaSiteKey) {
    const { useRecaptchaProvider } = await import('vue-recaptcha')
    useRecaptchaProvider()
}
</script>
