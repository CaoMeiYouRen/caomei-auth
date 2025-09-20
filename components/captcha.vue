<template>
    <div v-if="enabled" class="captcha-container">
        <VueHcaptcha
            v-if="provider === 'hcaptcha'"
            ref="widget"
            :sitekey="siteKey!"
            @verify="onVerify"
            @expired="onExpired"
            @error="onError"
        />

        <!-- Cloudflare Turnstile -->
        <VueTurnstile
            v-if="provider === 'cloudflare-turnstile'"
            ref="widget"
            v-model="token"
            :site-key="siteKey!"
            @expired="onExpired"
            @error="onError"
            @unsupported="onUnsupported"
        />
        <!-- 在这里可以为其他提供商添加 v-if，例如 google-recaptcha -->
        <div v-if="error" class="mt-1 p-error text-xs">
            {{ error }}
        </div>
    </div>
</template>

<script setup lang="ts">
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import VueTurnstile from 'vue-turnstile'
import { useCaptcha } from '@/composables/use-captcha'

const {
    enabled,
    provider,
    siteKey,
    widget,
    token,
    error,
    onVerify,
    onExpired,
    onError,
    onUnsupported,
    reset,
} = useCaptcha()

// 暴露 token 和 reset 方法给父组件
defineExpose({
    token,
    reset,
})
</script>

<style scoped lang="scss">
.captcha-container {
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>
