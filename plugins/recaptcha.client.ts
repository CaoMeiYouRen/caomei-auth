// plugins/recaptcha.client.ts
export default defineNuxtPlugin(async (nuxtApp) => {
    if (!import.meta.client) {
        return
    }

    const config = useRuntimeConfig()
    const provider = config.public.captchaProvider
    const siteKey = config.public.recaptchaSiteKey

    // 仅当提供商是 google-recaptcha 且 siteKey 存在时才加载
    if (provider === 'google-recaptcha' && siteKey) {
        const { default: VueRecaptchaPlugin } = await import('vue-recaptcha')
        nuxtApp.vueApp.use(VueRecaptchaPlugin, {
            v3SiteKey: siteKey,
        })
    }
})
