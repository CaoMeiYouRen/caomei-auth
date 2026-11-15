<template>
    <div
        class="auth-container"
        role="main"
        :aria-label="t('app.error.page.ariaLabel')"
    >
        <AuthLeft
            :title="t('auth.left.defaultTitle')"
            :subtitle="t('app.error.page.leftSubtitle')"
        />
        <div class="auth-right">
            <div class="auth-card error-card">
                <h1 class="error-code">
                    {{ view.code }}
                </h1>
                <h2 class="auth-title">
                    {{ view.title }}
                </h2>
                <p class="auth-subtitle">
                    {{ view.description }}
                </p>
                <div
                    v-if="view.detail"
                    class="error-message"
                    aria-live="polite"
                >
                    {{ view.detail }}
                </div>
                <div class="error-actions">
                    <CaomeiButton
                        :aria-label="t('app.error.actions.home')"
                        @click="goHome"
                    >
                        {{ t('app.error.actions.home') }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="secondary"
                        :aria-label="t('app.error.actions.back')"
                        @click="goBack"
                    >
                        {{ t('app.error.actions.back') }}
                    </CaomeiButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import type { NuxtError } from '#app'
import AuthLeft from '@/components/auth-left.vue'
import { resolveErrorView } from '@/utils/web/error-status'

const props = defineProps({
    error: {
        type: Object as () => NuxtError<any>,
        default: () => ({ statusCode: 404 }),
    },
})

const router = useRouter()
const { t } = useI18n()

const view = computed(() => resolveErrorView({
    statusCode: props.error?.statusCode || 404,
    statusMessage: props.error?.statusMessage,
    dataMessage: props.error?.data?.message,
}, t))

function goHome() {
    navigateTo('/')
}
function goBack() {
    window.history.length > 1 ? router.back() : navigateTo('/')
}
</script>

<style scoped lang="scss">

.error-card {
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
    text-align: center;
}

.error-code {
    margin-bottom: 0.5rem;
    color: $primary;
    font-weight: 800;
    font-size: 4.5rem;
    letter-spacing: 2px;
}

.error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
    justify-content: center;
    margin-top: 2.5rem;
}

.error-message {
    margin-top: 1rem;
    color: $error;
    font-size: 1.05rem;
}
</style>
