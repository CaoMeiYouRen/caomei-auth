<template>
    <Dialog
        v-model:visible="visible"
        header="OIDC API 端点文档"
        :modal="true"
        class="api-docs-dialog"
        :style="{width: '800px'}"
    >
        <div class="api-docs-content">
            <Accordion :value="['0', '1', '2']" multiple>
                <AccordionPanel value="0">
                    <AccordionHeader>
                        <i class="mdi mdi-api" />
                        <span>OpenID Connect Discovery</span>
                    </AccordionHeader>
                    <AccordionContent>
                        <p class="section-description">
                            OpenID Connect 配置端点，包含所有支持的端点和功能信息。
                        </p>
                        <div class="endpoint-group">
                            <div class="endpoint-item">
                                <label>Discovery 端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/.well-known/openid-configuration</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/.well-known/openid-configuration`)"
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <AccordionPanel value="1">
                    <AccordionHeader>
                        <i class="mdi mdi-cloud-outline" />
                        <span>主要 OAuth 2.0 / OIDC 端点</span>
                    </AccordionHeader>
                    <AccordionContent>
                        <p class="section-description">
                            以下是平台提供的主要 OAuth 2.0 和 OpenID Connect 端点。
                        </p>
                        <div class="endpoint-group">
                            <div class="endpoint-item">
                                <label>授权端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/oauth2/authorize</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/authorize`)"
                                    />
                                </div>
                            </div>
                            <div class="endpoint-item">
                                <label>令牌端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/oauth2/token</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/token`)"
                                    />
                                </div>
                            </div>
                            <div class="endpoint-item">
                                <label>用户信息端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/oauth2/userinfo</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/userinfo`)"
                                    />
                                </div>
                            </div>
                            <div class="endpoint-item">
                                <label>JWKS 端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/jwks</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/jwks`)"
                                    />
                                </div>
                            </div>
                            <div class="endpoint-item">
                                <label>动态客户端注册端点</label>
                                <div class="endpoint-url">
                                    <code>{{ authBaseUrl }}/api/auth/oauth2/register</code>
                                    <Button
                                        icon="mdi mdi-content-copy"
                                        class="p-button-sm p-button-text"
                                        @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/register`)"
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <AccordionPanel value="2">
                    <AccordionHeader>
                        <i class="mdi mdi-code-json" />
                        <span>Discovery 配置示例</span>
                    </AccordionHeader>
                    <AccordionContent>
                        <p class="section-description">
                            以下是 OpenID Connect Discovery 端点返回的配置示例。
                        </p>
                        <div class="config-example">
                            <pre><code>{{ JSON.stringify(oidcConfig, null, 2) }}</code></pre>
                            <Button
                                icon="mdi mdi-content-copy"
                                class="copy-config-btn p-button-sm p-button-text"
                                @click="copyToClipboard(JSON.stringify(oidcConfig, null, 2))"
                            />
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <div class="notice-section section">
                <h3>
                    <i class="mdi mdi-information-outline" />
                    注意事项
                </h3>
                <div class="notice">
                    <ul>
                        <li>当前 OIDC 实现基于 Better Auth，仅支持标准 OpenID Connect 核心功能</li>
                        <li>支持授权码流程（Authorization Code Flow）和刷新令牌</li>
                        <li>不支持隐式流程、密码流程、客户端流程等非标准模式</li>
                        <li>所有端点都要求使用 HTTPS</li>
                    </ul>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="关闭" @click="visible = false" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits(['update:visible'])

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

const oidcConfig = computed(() => ({
    issuer: authBaseUrl.value,
    authorization_endpoint: `${authBaseUrl.value}/api/auth/oauth2/authorize`,
    token_endpoint: `${authBaseUrl.value}/api/auth/oauth2/token`,
    userinfo_endpoint: `${authBaseUrl.value}/api/auth/oauth2/userinfo`,
    jwks_uri: `${authBaseUrl.value}/api/auth/jwks`,
    registration_endpoint: `${authBaseUrl.value}/api/auth/oauth2/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    claims_supported: ['sub', 'name', 'email', 'email_verified', 'preferred_username', 'picture'],
}))

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({
            severity: 'success',
            summary: '已复制',
            detail: '内容已复制到剪贴板',
            life: 2000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '复制失败',
            detail: '无法复制到剪贴板',
            life: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.api-docs-content {
    .section-description {
        color: #718096;
        margin-bottom: 1rem;
    }

    .endpoint-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .endpoint-item {
        label {
            display: block;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.5rem;
        }

        .endpoint-url {
            display: flex;
            align-items: center;
            background: #f7fafc;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid #e2e8f0;

            code {
                flex: 1;
                font-family: monospace;
                color: #2d3748;
                word-break: break-all;
            }
        }
    }

    .config-example {
        position: relative;
        background: #2d3748;
        border-radius: 8px;
        padding: 1rem;
        overflow: hidden;

        pre {
            margin: 0;
            overflow-x: auto;
        }

        code {
            color: #e2e8f0;
            font-family: monospace;
            font-size: 0.875rem;
        }

        .copy-config-btn {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            color: #a0aec0;

            &:hover {
                color: white;
                background: rgb(255 255 255 / 0.1);
            }
        }
    }

    .notice-section {
        margin-top: 2rem;
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-radius: 8px;
        padding: 1rem;

        h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #c53030;
            margin: 0 0 1rem;
            font-size: 1.1rem;
        }

        .notice {
            ul {
                margin: 0;
                padding-left: 1.5rem;
                color: #742a2a;

                li {
                    margin-bottom: 0.5rem;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }
    }
}
</style>
