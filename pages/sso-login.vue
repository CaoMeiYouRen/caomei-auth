# coding=utf-8
<template>
    <div class="sso-login">
        <div class="sso-container">
            <div class="sso-header">
                <h1 class="sso-title">
                    {{ t('sso.title') }}
                </h1>
                <p class="sso-subtitle">
                    {{ t('sso.subtitle') }}
                </p>
            </div>

            <!-- SSO 登录方式 -->
            <div class="sso-methods">
                <!-- 通过邮箱域名登录 -->
                <div class="sso-method">
                    <h3>{{ t('sso.emailHeading') }}</h3>
                    <p class="text-muted">
                        {{ t('sso.emailDescription') }}
                    </p>
                    <form @submit.prevent="signInWithEmail">
                        <div class="form-group">
                            <BaseInputV2
                                id="email"
                                v-model="emailForm.email"
                                type="email"
                                :label="t('sso.emailLabel')"
                                :placeholder="t('sso.emailPlaceholder')"
                                :disabled="emailForm.loading"
                                required
                            />
                        </div>
                        <CaomeiButton
                            type="submit"
                            class="sso-button"
                            :loading="emailForm.loading"
                        >
                            <template #icon>
                                <i class="mdi mdi-account-network" />
                            </template>
                            {{ t('sso.emailSubmit') }}
                        </CaomeiButton>
                    </form>
                </div>

                <!-- 通过域名登录 -->
                <div class="sso-method">
                    <h3>{{ t('sso.domainHeading') }}</h3>
                    <p class="text-muted">
                        {{ t('sso.domainDescription') }}
                    </p>
                    <form @submit.prevent="signInWithDomain">
                        <div class="form-group">
                            <BaseInputV2
                                id="domain"
                                v-model="domainForm.domain"
                                :label="t('sso.domainLabel')"
                                :placeholder="t('sso.domainPlaceholder')"
                                :disabled="domainForm.loading"
                                required
                            />
                        </div>
                        <CaomeiButton
                            type="submit"
                            class="sso-button"
                            :loading="domainForm.loading"
                        >
                            <template #icon>
                                <i class="mdi mdi-domain" />
                            </template>
                            {{ t('sso.domainSubmit') }}
                        </CaomeiButton>
                    </form>
                </div>

                <!-- 通过组织登录 -->
                <div class="sso-method">
                    <h3>{{ t('sso.orgHeading') }}</h3>
                    <p class="text-muted">
                        {{ t('sso.orgDescription') }}
                    </p>
                    <form @submit.prevent="signInWithOrganization">
                        <div class="form-group">
                            <BaseInputV2
                                id="organization"
                                v-model="orgForm.organizationSlug"
                                :label="t('sso.orgLabel')"
                                :placeholder="t('sso.orgPlaceholder')"
                                :disabled="orgForm.loading"
                                required
                            />
                        </div>
                        <CaomeiButton
                            type="submit"
                            class="sso-button"
                            :loading="orgForm.loading"
                        >
                            <template #icon>
                                <i class="mdi mdi-office-building" />
                            </template>
                            {{ t('sso.orgSubmit') }}
                        </CaomeiButton>
                    </form>
                </div>

                <!-- 通过 Provider ID 登录 -->
                <div class="sso-method">
                    <h3>{{ t('sso.providerHeading') }}</h3>
                    <p class="text-muted">
                        {{ t('sso.providerDescription') }}
                    </p>
                    <form @submit.prevent="signInWithProvider">
                        <div class="form-group">
                            <BaseInputV2
                                id="providerId"
                                v-model="providerForm.providerId"
                                :label="t('sso.providerLabel')"
                                :placeholder="t('sso.providerPlaceholder')"
                                :disabled="providerForm.loading"
                                required
                            />
                        </div>
                        <CaomeiButton
                            type="submit"
                            class="sso-button"
                            :loading="providerForm.loading"
                        >
                            <template #icon>
                                <i class="mdi mdi-key-variant" />
                            </template>
                            {{ t('sso.providerSubmit') }}
                        </CaomeiButton>
                    </form>
                </div>
            </div>

            <!-- 已配置的 SSO 提供商列表 -->
            <div v-if="availableProviders.length > 0" class="available-providers">
                <h3>{{ t('sso.availableHeading') }}</h3>
                <div class="providers-grid">
                    <div
                        v-for="provider in availableProviders"
                        :key="provider.providerId"
                        class="provider-card"
                        @click="signInWithSpecificProvider(provider)"
                    >
                        <div class="provider-info">
                            <CaomeiTag
                                :tone="provider.type === 'saml' ? 'warning' : 'primary'"
                                class="provider-type"
                            >
                                {{ provider.type?.toUpperCase() || 'OIDC' }}
                            </CaomeiTag>
                            <h4 class="provider-name">
                                {{ provider.name || provider.providerId }}
                            </h4>
                            <p class="provider-domain">
                                <i class="mdi mdi-domain" />
                                {{ provider.domain }}
                            </p>
                            <p class="provider-issuer">
                                <i class="mdi mdi-link" />
                                {{ provider.issuer }}
                            </p>
                        </div>
                        <div class="provider-action">
                            <CaomeiButton
                                size="sm"
                                :loading="specificProviderLoading === provider.providerId"
                            >
                                <template #icon>
                                    <i class="mdi mdi-login" />
                                </template>
                                {{ t('sso.providerLogin') }}
                            </CaomeiButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 普通登录链接 -->
            <div class="regular-login">
                <p class="text-muted">
                    {{ t('sso.regularPrompt') }}
                    <NuxtLink to="/login" class="login-link">
                        {{ t('sso.regularLink') }}
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useSsoLoginFlow } from '@/composables/use-sso-login-flow'
import { usePageMeta } from '@/composables/utils/use-page-meta'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
usePageMeta('sso.title', 'sso.subtitle')

const {
    emailForm,
    domainForm,
    orgForm,
    providerForm,
    availableProviders,
    specificProviderLoading,
    signInWithEmail,
    signInWithDomain,
    signInWithOrganization,
    signInWithProvider,
    signInWithSpecificProvider,
} = useSsoLoginFlow()
</script>

<style lang="scss" scoped>

.sso-login {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
}

.sso-container {
    max-width: 1200px;
    margin: 0 auto;
}

.sso-header {
    text-align: center;
    margin-bottom: 3rem;

    .sso-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 1rem;
    }

    .sso-subtitle {
        font-size: 1.125rem;
        color: $secondary-light;
        margin: 0;
    }
}

.sso-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.sso-method {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

    h3 {
        color: $primary;
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .text-muted {
        color: $secondary-light;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .form-group {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: $secondary;
        }
    }

    :deep(.sso-button) {
        width: 100%;
    }
}

.available-providers {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 2rem;

    h3 {
        color: $primary;
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
        font-weight: 600;
    }
}

.providers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.provider-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: $background;

    &:hover {
        border-color: $primary;
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
        transform: translateY(-2px);
    }

    .provider-info {
        margin-bottom: 1rem;

        .provider-type {
            margin-bottom: 0.5rem;
        }

        .provider-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: $secondary;
            margin: 0 0 0.5rem;
        }

        .provider-domain,
        .provider-issuer {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: $secondary-light;
            margin-bottom: 0.25rem;

            i {
                width: 16px;
            }
        }
    }

    .provider-action {
        :deep(.caomei-button) {
            width: 100%;
        }
    }
}

.regular-login {
    text-align: center;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

    .text-muted {
        color: $secondary-light;
        margin: 0;
    }

    .login-link {
        color: $primary;
        text-decoration: none;
        font-weight: 500;

        &:hover {
            text-decoration: underline;
        }
    }
}

// 响应式优化
@media (width <= 768px) {
    .sso-login {
        padding: 1rem;
    }

    .sso-header {
        .sso-title {
            font-size: 2rem;
        }

        .sso-subtitle {
            font-size: 1rem;
        }
    }

    .sso-methods {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .sso-method {
        padding: 1.5rem;
    }

    .providers-grid {
        grid-template-columns: 1fr;
    }
}
</style>
