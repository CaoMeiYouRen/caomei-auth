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
@import url("@/styles/theme");

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
}

.auth-subtitle {
    margin-bottom: 2rem;
    color: $secondary-light;
    font-size: 1.15rem;
    opacity: 0.92;
}
</style>
