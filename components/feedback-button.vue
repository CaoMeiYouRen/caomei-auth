<template>
    <div
        v-if="feedbackUrl"
        class="feedback-button-container"
        :class="{inline: variant === 'inline'}"
    >
        <NuxtLink
            :to="feedbackUrl"
            external
            target="_blank"
            class="feedback-button"
            :title="title"
            :aria-label="title"
        >
            <i v-tooltip.top="text" class="mdi mdi-message-text-outline" />
            <!-- <span class="feedback-text">{{ text }}</span> -->
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title?: string
    text?: string
    variant?: 'floating' | 'inline'
}

const props = withDefaults(defineProps<Props>(), {
    title: '反馈建议',
    text: '问题反馈',
    variant: 'floating',
})

const config = useRuntimeConfig()
const feedbackUrl = computed(() => config.public.feedbackUrl)
</script>

<style lang="scss" scoped>
.feedback-button-container {
    &.floating {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
}

.feedback-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #e63946;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 16px;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgb(230 57 70 / 0.3);
    transition: all 0.3s ease;
    font-weight: 500;

    &:hover {
        background: #d12f3a;
        color: white;
        text-decoration: none;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgb(230 57 70 / 0.4);
    }

    &:focus {
        outline: 2px solid #e63946;
        outline-offset: 2px;
    }

    i {
        font-size: 1.125rem;
        flex-shrink: 0;
    }

    .feedback-text {
        font-size: 14px;
        white-space: nowrap;
    }
}

// 浮动样式变体
.feedback-button-container:not(.inline) {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;

    @media (width <= 768px) {
        bottom: 16px;
        right: 16px;

        .feedback-button {
            border-radius: 50%;
            padding: 12px;

            .feedback-text {
                display: none;
            }
        }
    }
}

// 内联样式变体
.feedback-button-container.inline {
    .feedback-button {
        background: transparent;
        color: #6b7280;
        box-shadow: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;

        &:hover {
            background: #f3f4f6;
            color: #e63946;
            transform: none;
            box-shadow: none;
        }
    }
}
</style>
