// plugins/recaptcha.client.ts
import { VueReCaptcha } from 'vue-recaptcha-v3'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    const provider = config.public.captchaProvider
    const siteKey = config.public.recaptchaSiteKey

    // 仅当提供商是 google-recaptcha 且 siteKey 存在时才加载
    if (provider === 'google-recaptcha' && siteKey) {
        nuxtApp.vueApp.use(VueReCaptcha, {
            siteKey,
            loaderOptions: {
                autoHideBadge: true, // 自动隐藏右下角的 reCAPTCHA 徽章
            },
        })
    }
})
