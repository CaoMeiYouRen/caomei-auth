<template>
    <div>
        <CaomeiToastProvider>
            <CaomeiConfirmDialog>
                <Toast />
                <ConfirmDialog />
                <NuxtLayout>
                    <NuxtPage />
                </NuxtLayout>
            </CaomeiConfirmDialog>
        </CaomeiToastProvider>
    </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const publicConfig = runtimeConfig.public

// SEO / html lang：由 Locale Registry 驱动的 useLocaleHead 输出（M5 技术验证）
const i18nHead = useLocaleHead({ seo: true })
useHead(() => ({
    htmlAttrs: {
        lang: i18nHead.value.htmlAttrs?.lang,
        dir: i18nHead.value.htmlAttrs?.dir,
    },
    link: i18nHead.value.link,
    meta: i18nHead.value.meta,
}))

if (import.meta.client && publicConfig.captchaProvider === 'google-recaptcha' && publicConfig.recaptchaSiteKey) {
    const { useRecaptchaProvider } = await import('vue-recaptcha')
    useRecaptchaProvider()
}
</script>
