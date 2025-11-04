# coding=utf-8
<template>
    <div v-if="demoMode" class="demo-mode-banner">
        <div class="banner-content">
            <i class="banner-icon mdi mdi-information-outline" />
            <div class="banner-text">
                <strong>演示模式</strong>
                <span>
                    {{ displayMessage }}
                    <template v-if="showDocLink">
                        Demo账号密码详见
                        <NuxtLink
                            :to="finalDocUrl"
                            external
                            class="external-link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ docText }}
                        </NuxtLink>
                    </template>
                </span>
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
    docUrl?: string
    docText?: string
    showDocLink?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    closable: false,
    showDocLink: true,
    docText: '文档说明',
})

defineEmits<{
    close: []
}>()

const config = useRuntimeConfig()
const demoMode = computed(() => config.public.demoMode)

// 默认消息文本
const defaultMessage = '当前为演示模式，您可以浏览所有功能，但无法进行实际的修改操作。如需体验完整功能，请部署您自己的实例。'

// 显示的消息（不包含文档链接部分）
const displayMessage = computed(() => {
    return props.message || defaultMessage
})

// 最终的文档链接
const finalDocUrl = computed(() => {
    // 优先使用传入的docUrl，否则使用配置中的，最后使用默认值
    return props.docUrl
        || config.public.docUrl
        || 'https://auth-docs.cmyr.dev/'
})
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

.external-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

// 暗色模式样式
@include dark-mode {
    .demo-mode-banner {
        color: #fbbf24; // 暖黄色文本
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%); // 现代深灰蓝色渐变
        border: 1px solid #475569;
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
    }

    .banner-icon {
        color: #fbbf24; // 保持温暖的黄色图标
    }

    .banner-close {
        color: #cbd5e1;

        &:hover {
            color: #f1f5f9;
            background: rgb(148 163 184 / 0.2);
        }
    }

}
</style>
