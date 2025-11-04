<template>
    <Button
        class="theme-toggle"
        type="button"
        :aria-label="buttonLabel"
        :aria-pressed="isDark"
        :title="buttonLabel"
        @click="toggleDark()"
    >
        <i
            class="mdi"
            :class="iconClass"
            aria-hidden="true"
        />
        <span class="sr-only">{{ buttonLabel }}</span>
    </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDark, usePreferredDark, useToggle } from '@vueuse/core'

const isDark = useDark({})
const toggleDark = () => isDark.value = !isDark.value

const buttonLabel = computed(() => (isDark.value ? '切换为亮色模式' : '切换为暗色模式'))
const iconClass = computed(() => (isDark.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny'))

const preferredDark = usePreferredDark()

// 同步系统偏好设置的暗色模式状态
watch(preferredDark, (newVal) => {
    isDark.value = newVal
}, { immediate: true })
</script>

<style scoped lang="scss">
.theme-toggle {
    position: fixed;
    right: 20px;
    bottom: 88px;
    z-index: 1100;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #fff;
    color: $primary;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgb(0 0 0 / 0.24);
    }

    &:focus-visible {
        outline: 2px solid $primary;
        outline-offset: 2px;
    }

    i {
        font-size: 1.25rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
    }
}

@include dark-mode {
    .theme-toggle {
        background: #1f2937;
        color: #fbbf24;
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.35);

        &:hover {
            box-shadow: 0 6px 16px rgb(0 0 0 / 0.45);
        }
    }
}

@media (width <= 768px) {
    .theme-toggle {
        right: 16px;
        bottom: 80px;
    }
}
</style>
