<template>
    <div>
        <Toast />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useRecaptchaProvider } from 'vue-recaptcha'

const runtimeConfig = useRuntimeConfig()
const publicConfig = runtimeConfig.public

if (publicConfig.captchaProvider === 'google-recaptcha' && publicConfig.recaptchaSiteKey) {
    useRecaptchaProvider()
}
</script>
