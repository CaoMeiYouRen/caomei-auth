<template>
    <div>
        <Toast />
        <ConfirmDialog />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const publicConfig = runtimeConfig.public

if (import.meta.client && publicConfig.captchaProvider === 'google-recaptcha' && publicConfig.recaptchaSiteKey) {
    const { useRecaptchaProvider } = await import('vue-recaptcha')
    useRecaptchaProvider()
}
</script>
