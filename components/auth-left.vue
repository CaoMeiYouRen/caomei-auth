<template>
    <div class="auth-left">
        <h1 class="auth-title">
            {{ title || t('auth.left.defaultTitle') }}
        </h1>
        <p v-if="subtitle" class="auth-subtitle">
            {{ subtitle }}
        </p>
        <slot name="content" />
        <div v-if="showLogo" class="auth-logo">
            <img src="/logo.png" alt="logo">
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18nText } from '@/composables/utils/use-i18n-text'

const t = useI18nText()

defineProps({
    title: {
        type: String,
        default: '',
    },
    subtitle: {
        type: String,
        default: '',
    },
    showLogo: {
        type: Boolean,
        default: true,
    },
})
</script>

<style scoped lang="scss">

.auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 20vh;
    padding: 1rem;
    color: $background-light;
    text-align: center;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;

        .auth-logo img {
            width: 25%;
            max-width: none;
        }
    }
}

.auth-title {
    margin-bottom: 0.7rem;
    color: $secondary;
    font-weight: 700;
    font-size: 2.3rem;
    letter-spacing: 1px;

    @include dark-mode {
        color: $dark-secondary-light !important;
    }
}

.auth-subtitle {
    margin-bottom: 2rem;
    color: $secondary-light;
    font-size: 1.15rem;
    opacity: 0.92;
}
</style>
