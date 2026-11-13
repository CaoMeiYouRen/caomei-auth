<template>
    <BaseDialogV2
        :visible="visible"
        title="SSO 提供商详情"
        size="lg"
        @update:visible="visible = $event"
    >
        <div v-if="provider" class="provider-detail">
            <section class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    基本信息
                </h4>
                <div class="provider-detail__grid">
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">Provider ID:</span>
                        <code class="provider-detail__code">{{ provider.providerId }}</code>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">协议类型:</span>
                        <CaomeiTag
                            variant="soft"
                            :tone="provider.type === 'saml' ? 'warning' : 'primary'"
                        >
                            {{ provider.type?.toUpperCase() || 'OIDC' }}
                        </CaomeiTag>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">显示名称:</span>
                        <span>{{ provider.name || provider.providerId }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">域名:</span>
                        <span>{{ provider.domain }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">发行者:</span>
                        <span>{{ provider.issuer }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">状态:</span>
                        <BaseStatusBadge
                            variant="yes-no"
                            :status="provider.enabled"
                            true-label="启用"
                            false-label="禁用"
                        />
                    </div>
                    <div v-if="provider.organizationId" class="provider-detail__item">
                        <span class="provider-detail__label">关联组织:</span>
                        <span>{{ provider.organizationId }}</span>
                    </div>
                </div>
            </section>

            <section v-if="provider.description" class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    描述
                </h4>
                <p>{{ provider.description }}</p>
            </section>

            <section class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    回调 URL
                </h4>
                <div class="provider-detail__urls">
                    <div class="provider-detail__url">
                        <span class="provider-detail__label">{{ provider.type === 'saml' ? 'SAML 回调:' : 'OIDC 回调:' }}</span>
                        <div class="provider-detail__url-row">
                            <code class="provider-detail__code">{{ getCallbackUrl(provider) }}</code>
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                label="复制"
                                @click="copyToClipboard(getCallbackUrl(provider))"
                            >
                                <template #icon>
                                    <i class="mdi mdi-content-copy" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </div>
                    <div v-if="provider.type === 'saml'" class="provider-detail__url">
                        <span class="provider-detail__label">SP 元数据:</span>
                        <div class="provider-detail__url-row">
                            <code class="provider-detail__code">{{ getMetadataUrl(provider) }}</code>
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                label="复制"
                                @click="copyToClipboard(getMetadataUrl(provider))"
                            >
                                <template #icon>
                                    <i class="mdi mdi-content-copy" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </div>
                </div>
            </section>

            <section class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    时间信息
                </h4>
                <div class="provider-detail__grid">
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">创建时间:</span>
                        <span>{{ formatDateLocale(provider.createdAt) }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">更新时间:</span>
                        <span>{{ formatDateLocale(provider.updatedAt) }}</span>
                    </div>
                </div>
            </section>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'caomei-ui'
import { formatDateLocale } from '@/utils/shared/date'
import type { AdminSsoProviderDetail } from '@/types/admin'

const props = defineProps<{
    visible: boolean
    provider?: AdminSsoProviderDetail | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const toast = useToast()
const config = useRuntimeConfig().public

// 从配置获取基础 URL
const authBaseUrl = computed(() => {
    if (config.authBaseUrl) {
        return config.authBaseUrl
    }
    if (import.meta.client && window.location) {
        return `${window.location.protocol}//${window.location.host}`
    }
    return 'https://example.com'
})

// 生成回调 URL
function getCallbackUrl(provider: AdminSsoProviderDetail | null): string {
    if (!provider) {
        return ''
    }
    if (provider.type === 'saml') {
        return `${authBaseUrl.value}/api/auth/sso/saml2/callback/${provider.providerId}`
    }
    return `${authBaseUrl.value}/api/auth/sso/callback/${provider.providerId}`
}

// 生成元数据 URL（仅 SAML）
function getMetadataUrl(provider: AdminSsoProviderDetail | null): string {
    if (!provider) {
        return ''
    }
    return `${authBaseUrl.value}/api/auth/sso/saml2/sp/metadata?providerId=${provider.providerId}`
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.success({
            title: '复制成功',
            description: '已复制到剪贴板',
            duration: 2000,
        })
    } catch {
        toast.danger({
            title: '复制失败',
            description: '无法访问剪贴板',
            duration: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.provider-detail {
    &__section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--admin-border);

        &:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
    }

    &__heading {
        margin: 0 0 1rem;
        color: var(--color-primary);
        font-size: 1.125rem;
        font-weight: 600;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    &__item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__label {
        color: var(--admin-muted);
        font-size: 0.875rem;
        font-weight: 500;
    }

    &__code {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        background: var(--admin-surface-muted);
        font-size: 0.875rem;
        word-break: break-all;
    }

    &__url {
        margin-bottom: 1rem;

        .provider-detail__label {
            display: block;
            margin-bottom: 0.5rem;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__url-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;

        .provider-detail__code {
            flex: 1;
            padding: 0.75rem;
            line-height: 1.4;
        }
    }

    @media (width <= 768px) {
        &__grid {
            grid-template-columns: 1fr;
        }

        &__url-row {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
}
</style>
