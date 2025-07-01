<template>
    <div class="auth-left">
        <h1 class="auth-title">
            {{ title }}
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
import { defineProps } from 'vue'
const props = defineProps({
    title: {
        type: String,
        default: '草梅Auth统一登录平台',
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
@import '@/styles/theme';
.auth-left {
    color: $background-light;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    min-height: 20vh;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;
        .auth-logo img {
            width: 25%;
            max-width: none;
        }
    }
}
.auth-title {
    font-size: 2.3rem;
    font-weight: 700;
    margin-bottom: 0.7rem;
    color: $secondary;
    letter-spacing: 1px;
}
.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
    font-size: 1.15rem;
    opacity: 0.92;
}
</style>
