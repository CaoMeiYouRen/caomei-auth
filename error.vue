<template>
    <div
        class="auth-container"
        role="main"
        aria-label="错误页面"
    >
        <AuthLeft
            title="草梅Auth统一登录平台"
            subtitle="安全、便捷的一站式登录体验"
        />
        <div class="auth-right">
            <div class="auth-card error-card">
                <h1 class="error-code">
                    {{ displayStatusCode }}
                </h1>
                <h2 class="auth-title">
                    {{ title }}
                </h2>
                <p class="auth-subtitle">
                    {{ description }}
                </p>
                <div
                    v-if="error.data?.message"
                    class="error-message"
                    aria-live="polite"
                >
                    {{ error.data.message }}
                </div>
                <div class="error-actions">
                    <Button
                        class="btn btn-primary"
                        aria-label="返回首页"
                        @click="goHome"
                    >
                        返回首页
                    </Button>
                    <Button
                        class="btn btn-secondary"
                        outlined
                        aria-label="返回上一页"
                        @click="goBack"
                    >
                        返回上一页
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import Button from 'primevue/button'
import type { NuxtError } from '#app'
import AuthLeft from '@/components/auth-left.vue'

const props = defineProps({
    error: {
        type: Object as () => NuxtError<any>,
        default: () => ({ statusCode: 404 }),
    },
})

const router = useRouter()

const statusCode = computed(() => props.error?.statusCode || 404)
const displayStatusCode = computed(() => {
    if ([400, 401, 403, 404, 500].includes(statusCode.value)) {
        return statusCode.value
    }
    return '错误'
})

const title = computed(() => {
    switch (statusCode.value) {
        case 400:
            return '请求错误 (400)'
        case 401:
            return '未授权 (401)'
        case 403:
            return '禁止访问 (403)'
        case 404:
            return '页面未找到 (404)'
        case 500:
            return '服务器错误 (500)'
        default:
            return props.error.statusMessage || '出错啦'
    }
})

const description = computed(() => {
    if (props.error.statusMessage) {
        return props.error.statusMessage
    }
    switch (statusCode.value) {
        case 400:
            return '请求无效，请检查请求参数。'
        case 401:
            return '您尚未登录或登录已过期。'
        case 403:
            return '您没有权限访问该页面。'
        case 404:
            return '您访问的页面不存在或已被删除。'
        case 500:
            return '服务器发生错误，请稍后重试。'
        default:
            return '发生未知错误，请稍后再试。'
    }
})

function goHome() {
    navigateTo('/')
}
function goBack() {
    window.history.length > 1 ? router.back() : navigateTo('/')
}
</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.error-card {
    text-align: center;
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
}
.error-code {
    font-size: 4.5rem;
    font-weight: 800;
    color: $primary;
    margin-bottom: 0.5rem;
    letter-spacing: 2px;
}
.error-actions {
    display: flex;
    justify-content: center;
    gap: 1.2rem;
    margin-top: 2.5rem;
    flex-wrap: wrap;
}
.btn-secondary {
    background: $secondary-bg !important;
    color: $secondary !important;
    border: 1px solid $secondary-bg !important;
}
.error-message {
    color: $error;
    margin-top: 1rem;
    font-size: 1.05rem;
}
</style>
