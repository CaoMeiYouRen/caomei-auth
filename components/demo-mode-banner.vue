# coding=utf-8
<template>
    <div v-if="demoMode" class="demo-mode-banner">
        <div class="banner-content">
            <i class="banner-icon mdi mdi-information-outline" />
            <div class="banner-text">
                <strong>演示模式</strong>
                <span>{{ message || '当前为演示模式，您可以浏览所有功能，但无法进行实际的修改操作。如需体验完整功能，请部署您自己的实例。' }}</span>
            </div>
            <button
                v-if="closable"
                class="banner-close"
                @click="$emit('close')"
            >
                <i class="mdi mdi-close" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    closable?: boolean
    message?: string
}

withDefaults(defineProps<Props>(), {
    closable: false,
})

defineEmits<{
    close: []
}>()

const config = useRuntimeConfig()
const demoMode = computed(() => config.public.demoMode)
</script>

<style lang="scss" scoped>
.demo-mode-banner {
    // margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    color: #856404;
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border: 1px solid #ffeaa7;

    // border-radius: 8px;
    box-shadow: 0 2px 4px rgb(255 234 167 / 0.3);
}

.banner-content {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.banner-icon {
    flex-shrink: 0;
    font-size: 1.25rem;
    color: #b08800;
}

.banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
        font-weight: 600;
        font-size: 0.875rem;
    }

    span {
        font-size: 0.8rem;
        opacity: 0.9;
    }
}

.banner-close {
    flex-shrink: 0;
    padding: 0.25rem;
    color: #856404;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: #b08800;
        background: rgb(255 255 255 / 0.5);
    }

    i {
        font-size: 1rem;
    }
}

@media (width <= 768px) {
    .demo-mode-banner {
        margin: 0 -1rem 1rem;
        border-radius: 0;
    }

    .banner-text {
        span {
            font-size: 0.75rem;
        }
    }
}
</style>
