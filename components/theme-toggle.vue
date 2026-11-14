<template>
    <BaseTooltip :content="buttonLabel">
        <CaomeiButton
            class="theme-toggle"
            type="button"
            icon-only
            :label="buttonLabel"
            :aria-pressed="effectiveDark"
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
    </BaseTooltip>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppTheme } from '@/composables/use-app-theme'

/**
 * 全站唯一主题切换按钮（默认 / Admin 布局共用）。
 *
 * 共享壳组件不再按路由白名单分叉：M11 收口后只保留本组件，避免同一控件在不同路由
 * 出现两种外观（见阶段 4 登记记录 M11 记录）。
 */
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
    /* 用组件库文档化的覆盖钩子，保证 hover / active 由同一来源派生（避免 primary hover 覆盖成同色） */
    --caomei-button-bg: #fff;
    --caomei-button-fg: #{$primary};

    /* hover / active 的混合色改浅，避免按下时红图标落在偏深灰底（对比度 < 3:1） */
    --caomei-color-neutral-solid: #f2f2f2;

    position: fixed;
    right: 20px;
    bottom: 88px;
    z-index: 1100;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
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
        --caomei-button-bg: #1f2937;
        --caomei-button-fg: #fbbf24;

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
