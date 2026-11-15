<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('admin.oauth.docs.title')"
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
                        {{ t('admin.oauth.docs.intro') }}
                    </p>
                    <div class="endpoint-group">
                        <div class="endpoint-item">
                            <span class="endpoint-item__label">{{ t('admin.oauth.docs.discoveryLabel') }}</span>
                            <div class="endpoint-item__url">
                                <code>{{ authBaseUrl }}/api/auth/.well-known/openid-configuration</code>
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    :label="t('admin.oauth.docs.copyDiscovery')"
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
                        <span>{{ t('admin.oauth.docs.mainTitle') }}</span>
                    </template>
                    <p class="api-docs-content__description">
                        {{ t('admin.oauth.docs.mainIntro') }}
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
                                    :label="t('admin.oauth.docs.copyEndpoint', {label: endpoint.label})"
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
                        <span>{{ t('admin.oauth.docs.exampleTitle') }}</span>
                    </template>
                    <p class="api-docs-content__description">
                        {{ t('admin.oauth.docs.exampleIntro') }}
                    </p>
                    <div class="config-example">
                        <pre><code>{{ oidcConfigJson }}</code></pre>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            :label="t('admin.oauth.docs.copyExample')"
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
                    {{ t('admin.oauth.docs.notesTitle') }}
                </h3>
                <ul>
                    <li>{{ t('admin.oauth.docs.note1') }}</li>
                    <li>{{ t('admin.oauth.docs.note2') }}</li>
                    <li>{{ t('admin.oauth.docs.note3') }}</li>
                    <li>{{ t('admin.oauth.docs.note4') }}</li>
                    <li>{{ t('admin.oauth.docs.note5') }}</li>
                </ul>
            </CaomeiAlert>
        </div>

        <template #footer>
            <CaomeiButton @click="visible = false">
                {{ t('admin.oauth.docs.close') }}
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
const { t } = useI18n()

const endpoints = computed(() => [
    { label: t('admin.oauth.docs.endpoints.authorize'), path: '/api/auth/oauth2/authorize' },
    { label: t('admin.oauth.docs.endpoints.token'), path: '/api/auth/oauth2/token' },
    { label: t('admin.oauth.docs.endpoints.userinfo'), path: '/api/auth/oauth2/userinfo' },
    { label: t('admin.oauth.docs.endpoints.jwks'), path: '/api/auth/jwks' },
])

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
            title: t('admin.oauth.docs.copiedTitle'),
            description: t('admin.oauth.docs.copied'),
            duration: 2000,
        })
    } catch {
        toast.danger({
            title: t('admin.oauth.docs.copyFailedTitle'),
            description: t('admin.oauth.docs.copyFailed'),
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
