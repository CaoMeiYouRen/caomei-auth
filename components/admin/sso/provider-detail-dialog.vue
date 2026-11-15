<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('admin.sso.detail.title')"
        size="lg"
        @update:visible="visible = $event"
    >
        <div v-if="provider" class="provider-detail">
            <section class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    {{ t('admin.sso.detail.basicInfo') }}
                </h4>
                <div class="provider-detail__grid">
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">Provider ID:</span>
                        <code class="provider-detail__code">{{ provider.providerId }}</code>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.type') }}</span>
                        <CaomeiTag
                            variant="soft"
                            :tone="provider.type === 'saml' ? 'warning' : 'primary'"
                        >
                            {{ provider.type?.toUpperCase() || 'OIDC' }}
                        </CaomeiTag>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.name') }}</span>
                        <span>{{ provider.name || provider.providerId }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.domain') }}</span>
                        <span>{{ provider.domain }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.issuer') }}</span>
                        <span>{{ provider.issuer }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.status') }}</span>
                        <BaseStatusBadge
                            variant="yes-no"
                            :status="provider.enabled"
                            :true-label="t('admin.sso.detail.enabled')"
                            :false-label="t('admin.sso.detail.disabled')"
                        />
                    </div>
                    <div v-if="provider.organizationId" class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.organization') }}</span>
                        <span>{{ provider.organizationId }}</span>
                    </div>
                </div>
            </section>

            <section v-if="provider.description" class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    {{ t('admin.sso.detail.description') }}
                </h4>
                <p>{{ provider.description }}</p>
            </section>

            <section class="provider-detail__section">
                <h4 class="provider-detail__heading">
                    {{ t('admin.sso.detail.callback') }}
                </h4>
                <div class="provider-detail__urls">
                    <div class="provider-detail__url">
                        <span class="provider-detail__label">{{ provider.type === 'saml' ? t('admin.sso.detail.samlCallback') : t('admin.sso.detail.oidcCallback') }}</span>
                        <div class="provider-detail__url-row">
                            <code class="provider-detail__code">{{ getCallbackUrl(provider) }}</code>
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                :label="t('admin.sso.detail.copy')"
                                @click="copyToClipboard(getCallbackUrl(provider))"
                            >
                                <template #icon>
                                    <i class="mdi mdi-content-copy" aria-hidden="true" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </div>
                    <div v-if="provider.type === 'saml'" class="provider-detail__url">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.spMetadata') }}</span>
                        <div class="provider-detail__url-row">
                            <code class="provider-detail__code">{{ getMetadataUrl(provider) }}</code>
                            <CaomeiButton
                                icon-only
                                variant="secondary"
                                :label="t('admin.sso.detail.copy')"
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
                    {{ t('admin.sso.detail.timeInfo') }}
                </h4>
                <div class="provider-detail__grid">
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.createdAt') }}</span>
                        <span>{{ formatDateLocale(provider.createdAt, locale) }}</span>
                    </div>
                    <div class="provider-detail__item">
                        <span class="provider-detail__label">{{ t('admin.sso.detail.updatedAt') }}</span>
                        <span>{{ formatDateLocale(provider.updatedAt, locale) }}</span>
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

const { t, locale } = useI18n()
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
            title: t('admin.sso.detail.copiedTitle'),
            description: t('admin.sso.detail.copied'),
            duration: 2000,
        })
    } catch {
        toast.danger({
            title: t('admin.sso.detail.copyFailedTitle'),
            description: t('admin.sso.detail.copyFailed'),
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
