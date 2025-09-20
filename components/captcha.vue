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
        <!-- 在这里可以为其他提供商添加 v-if，例如 google-recaptcha -->
        <div v-if="error" class="mt-1 p-error text-xs">
            {{ error }}
        </div>
    </div>
</template>

<script setup lang="ts">
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { useCaptcha } from '@/composables/use-captcha'

const {
    enabled,
    provider,
    siteKey,
    widget,
    error,
    onVerify,
    onExpired,
    onError,
    reset,
} = useCaptcha()

// 暴露 token 和 reset 方法给父组件
defineExpose({
    token: computed(() => (widget.value ? widget.value.token : null)),
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
