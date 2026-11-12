<template>
    <BaseDialogV2
        :visible="visible"
        title="OIDC API 端点文档"
        size="lg"
        @update:visible="visible = $event"
    >
        <div class="api-docs-content">
            <CaomeiAccordion
                type="multiple"
                :default-value="['0', '1', '2']"
            >
                <CaomeiAccordionItem value="0">
                    <template #trigger>
                        <i
                            class="mdi mdi-api"
                            aria-hidden="true"
                        />
                        <span>OpenID Connect Discovery</span>
                    </template>
                    <p class="api-docs-content__description">
                        OpenID Connect 配置端点，包含所有支持的端点和功能信息。
                    </p>
                    <div class="endpoint-group">
                        <div class="endpoint-item">
                            <span class="endpoint-item__label">Discovery 端点</span>
                            <div class="endpoint-item__url">
                                <code>{{ authBaseUrl }}/api/auth/.well-known/openid-configuration</code>
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    label="复制 Discovery 端点"
                                    @click="copyToClipboard(`${authBaseUrl}/api/auth/.well-known/openid-configuration`)"
                                >
                                    <template #icon>
                                        <i
                                            class="mdi mdi-content-copy"
                                            aria-hidden="true"
                                        />
                                    </template>
                                </CaomeiButton>
                            </div>
                        </div>
                    </div>
                </CaomeiAccordionItem>

                <CaomeiAccordionItem value="1">
                    <template #trigger>
                        <i
                            class="mdi mdi-cloud-outline"
                            aria-hidden="true"
                        />
                        <span>主要 OAuth 2.0 / OIDC 端点</span>
                    </template>
                    <p class="api-docs-content__description">
                        以下是平台提供的主要 OAuth 2.0 和 OpenID Connect 端点。
                    </p>
                    <div class="endpoint-group">
                        <div
                            v-for="endpoint in endpoints"
                            :key="endpoint.path"
                            class="endpoint-item"
                        >
                            <span class="endpoint-item__label">{{ endpoint.label }}</span>
                            <div class="endpoint-item__url">
                                <code>{{ authBaseUrl }}{{ endpoint.path }}</code>
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    :label="`复制${endpoint.label}`"
                                    @click="copyToClipboard(`${authBaseUrl}${endpoint.path}`)"
                                >
                                    <template #icon>
                                        <i
                                            class="mdi mdi-content-copy"
                                            aria-hidden="true"
                                        />
                                    </template>
                                </CaomeiButton>
                            </div>
                        </div>
                    </div>
                </CaomeiAccordionItem>

                <CaomeiAccordionItem value="2">
                    <template #trigger>
                        <i
                            class="mdi mdi-code-json"
                            aria-hidden="true"
                        />
                        <span>Discovery 配置示例</span>
                    </template>
                    <p class="api-docs-content__description">
                        以下是 OpenID Connect Discovery 端点返回的配置示例。
                    </p>
                    <div class="config-example">
                        <pre><code>{{ oidcConfigJson }}</code></pre>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            label="复制配置示例"
                            class="config-example__copy"
                            @click="copyToClipboard(oidcConfigJson)"
                        >
                            <template #icon>
                                <i
                                    class="mdi mdi-content-copy"
                                    aria-hidden="true"
                                />
                            </template>
                        </CaomeiButton>
                    </div>
                </CaomeiAccordionItem>
            </CaomeiAccordion>

            <CaomeiAlert
                tone="danger"
                class="api-docs-content__notice"
            >
                <h3>
                    <i
                        class="mdi mdi-information-outline"
                        aria-hidden="true"
                    />
                    注意事项
                </h3>
                <ul>
                    <li>当前 OIDC 实现基于 Better Auth，仅支持标准 OpenID Connect 核心功能</li>
                    <li>支持授权码流程（Authorization Code Flow）和刷新令牌</li>
                    <li>不支持隐式流程、密码流程、客户端流程等非标准模式</li>
                    <li>不开放动态客户端注册，OAuth 应用需由管理员在管理后台创建</li>
                    <li>所有端点都要求使用 HTTPS</li>
                </ul>
            </CaomeiAlert>
        </div>

        <template #footer>
            <CaomeiButton @click="visible = false">
                关闭
            </CaomeiButton>
        </template>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'caomei-ui'

const props = defineProps<{
    visible: boolean
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

const authBaseUrl = computed(() => {
    if (config.authBaseUrl) {
        return config.authBaseUrl
    }
    if (import.meta.client && window.location) {
        return `${window.location.protocol}//${window.location.host}`
    }
    return 'https://example.com'
})

/** 端点清单：模板与原实现的 4 个端点一一对应，避免重复的复制按钮块 */
const endpoints = [
    { label: '授权端点', path: '/api/auth/oauth2/authorize' },
    { label: '令牌端点', path: '/api/auth/oauth2/token' },
    { label: '用户信息端点', path: '/api/auth/oauth2/userinfo' },
    { label: 'JWKS 端点', path: '/api/auth/jwks' },
]

const oidcConfig = computed(() => ({
    issuer: authBaseUrl.value,
    authorization_endpoint: `${authBaseUrl.value}/api/auth/oauth2/authorize`,
    token_endpoint: `${authBaseUrl.value}/api/auth/oauth2/token`,
    userinfo_endpoint: `${authBaseUrl.value}/api/auth/oauth2/userinfo`,
    jwks_uri: `${authBaseUrl.value}/api/auth/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    claims_supported: ['sub', 'name', 'email', 'email_verified', 'preferred_username', 'picture'],
}))

const oidcConfigJson = computed(() => JSON.stringify(oidcConfig.value, null, 2))

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.success({
            title: '已复制',
            description: '内容已复制到剪贴板',
            duration: 2000,
        })
    } catch {
        toast.danger({
            title: '复制失败',
            description: '无法复制到剪贴板',
            duration: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.api-docs-content {
    &__description {
        margin-bottom: 1rem;
        color: var(--admin-muted);
    }

    &__notice {
        margin-top: 2rem;

        h3 {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            margin: 0 0 1rem;
            font-size: 1.1rem;
        }

        ul {
            margin: 0;
            padding-left: 1.5rem;

            li {
                margin-bottom: 0.5rem;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }
}

.endpoint-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.endpoint-item {
    &__label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--admin-text);
    }

    &__url {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem 1rem;
        border: 1px solid var(--admin-border);
        border-radius: 6px;
        background: var(--admin-surface-muted);

        code {
            flex: 1;
            font-family: monospace;
            color: var(--admin-text);
            word-break: break-all;
        }
    }
}

.config-example {
    position: relative;
    overflow: hidden;
    padding: 1rem;
    border-radius: 8px;
    background: #2d3748;

    pre {
        margin: 0;
        overflow-x: auto;
    }

    code {
        font-family: monospace;
        font-size: 0.875rem;
        color: #e2e8f0;
    }

    &__copy {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        color: #a0aec0;
    }
}
</style>
