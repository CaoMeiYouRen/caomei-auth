<template>
    <Dialog
        v-model:visible="visible"
        header="SSO 提供商详情"
        class="view-dialog"
        modal
        :style="{width: '90vw', maxWidth: '800px'}"
    >
        <div v-if="provider" class="view-content">
            <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">Provider ID:</span>
                        <code>{{ provider.providerId }}</code>
                    </div>
                    <div class="detail-item">
                        <span class="label">协议类型:</span>
                        <Badge
                            :value="provider.type?.toUpperCase() || 'OIDC'"
                            :severity="provider.type === 'saml' ? 'warning' : 'info'"
                        />
                    </div>
                    <div class="detail-item">
                        <span class="label">显示名称:</span>
                        <span>{{ provider.name || provider.providerId }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">域名:</span>
                        <span>{{ provider.domain }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">发行者:</span>
                        <span>{{ provider.issuer }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">状态:</span>
                        <Tag
                            :value="provider.enabled ? '启用' : '禁用'"
                            :severity="provider.enabled ? 'success' : 'danger'"
                        />
                    </div>
                    <div v-if="provider.organizationId" class="detail-item">
                        <span class="label">关联组织:</span>
                        <span>{{ provider.organizationId }}</span>
                    </div>
                </div>
            </div>

            <div v-if="provider.description" class="detail-section">
                <h4>描述</h4>
                <p>{{ provider.description }}</p>
            </div>

            <div class="detail-section">
                <h4>回调 URL</h4>
                <div class="callback-urls">
                    <div class="url-item">
                        <span class="label">{{ provider.type === 'saml' ? 'SAML 回调:' : 'OIDC 回调:' }}</span>
                        <div class="url-copy">
                            <code>{{ getCallbackUrl(provider) }}</code>
                            <Button
                                v-tooltip="'复制'"
                                icon="mdi mdi-content-copy"
                                size="small"
                                severity="secondary"
                                @click="copyToClipboard(getCallbackUrl(provider))"
                            />
                        </div>
                    </div>
                    <div v-if="provider.type === 'saml'" class="url-item">
                        <span class="label">SP 元数据:</span>
                        <div class="url-copy">
                            <code>{{ getMetadataUrl(provider) }}</code>
                            <Button
                                v-tooltip="'复制'"
                                icon="mdi mdi-content-copy"
                                size="small"
                                severity="secondary"
                                @click="copyToClipboard(getMetadataUrl(provider))"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>时间信息</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">创建时间:</span>
                        <span>{{ formatDateLocale(provider.createdAt) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">更新时间:</span>
                        <span>{{ formatDateLocale(provider.updatedAt) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { formatDateLocale } from '@/utils/date'

const props = defineProps<{
    visible: boolean
    provider?: any
}>()

const emit = defineEmits(['update:visible'])

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
function getCallbackUrl(provider: any) {
    if (!provider) return ''
    if (provider.type === 'saml') {
        return `${authBaseUrl.value}/api/auth/sso/saml2/callback/${provider.providerId}`
    }
    return `${authBaseUrl.value}/api/auth/sso/callback/${provider.providerId}`
}

// 生成元数据 URL（仅 SAML）
function getMetadataUrl(provider: any) {
    if (!provider) return ''
    return `${authBaseUrl.value}/api/auth/sso/saml2/sp/metadata?providerId=${provider.providerId}`
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({
            severity: 'success',
            summary: '复制成功',
            detail: '已复制到剪贴板',
            life: 2000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '复制失败',
            detail: '无法访问剪贴板',
            life: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.view-dialog {
    .view-content {
        .detail-section {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e2e8f0;

            &:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            h4 {
                color: var(--primary-color);
                margin: 0 0 1rem;
                font-size: 1.125rem;
                font-weight: 600;
            }
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label {
                font-weight: 500;
                color: #718096;
                font-size: 0.875rem;
            }

            code {
                background: #f7fafc;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                word-break: break-all;
            }
        }

        .callback-urls {
            .url-item {
                margin-bottom: 1rem;

                .label {
                    display: block;
                    font-weight: 500;
                    color: #718096;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }

                .url-copy {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;

                    code {
                        flex: 1;
                        background: #f7fafc;
                        padding: 0.75rem;
                        border-radius: 4px;
                        font-size: 0.875rem;
                        word-break: break-all;
                        line-height: 1.4;
                    }
                }
            }
        }
    }

    @media (width <= 768px) {
        .detail-grid {
            grid-template-columns: 1fr;
        }

        .url-copy {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
}
</style>
