<template>
    <BaseTooltip :content="buttonLabel">
        <Button
            class="theme-toggle"
            type="button"
            :aria-label="buttonLabel"
            :aria-pressed="effectiveDark"
            @click="toggle()"
        >
            <i
                class="mdi"
                :class="iconClass"
                aria-hidden="true"
            />
            <span class="sr-only">{{ buttonLabel }}</span>
        </Button>
    </BaseTooltip>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppTheme } from '@/composables/use-app-theme'

const { isDark, toggle } = useAppTheme()

// 服务端不知道系统主题；挂载前统一按浅色渲染，挂载后再同步，
// 避免 SSR / hydration 的图标与文案不一致
const mounted = ref(false)
onMounted(() => {
    mounted.value = true
})
const effectiveDark = computed(() => mounted.value && isDark.value)

const buttonLabel = computed(() => (effectiveDark.value ? '切换为亮色模式' : '切换为暗色模式'))
const iconClass = computed(() => (effectiveDark.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny'))
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
