// plugins/recaptcha.client.ts
import VueRecaptchaPlugin from 'vue-recaptcha'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    const provider = config.public.captchaProvider
    const siteKey = config.public.recaptchaSiteKey

    // 仅当提供商是 google-recaptcha 且 siteKey 存在时才加载
    if (provider === 'google-recaptcha' && siteKey) {
        nuxtApp.vueApp.use(VueRecaptchaPlugin, {
            v3SiteKey: siteKey,
        })
    }
})
