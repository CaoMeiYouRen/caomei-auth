<template>
    <CaomeiButton
        class="theme-toggle"
        type="button"
        :label="buttonLabel"
        :aria-pressed="effectiveDark"
        :title="buttonLabel"
        icon-only
        @click="toggle()"
    >
        <template #icon>
            <i
                class="mdi"
                :class="iconClass"
                aria-hidden="true"
            />
        </template>
    </CaomeiButton>
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
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #fff !important;
    color: $primary !important;
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
}

@include dark-mode {
    .theme-toggle {
        background: #1f2937 !important;
        color: #fbbf24 !important;
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
