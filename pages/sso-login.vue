# coding=utf-8
<template>
    <div class="sso-login">
        <div class="sso-container">
            <div class="sso-header">
                <h1 class="sso-title">
                    SSO 单点登录
                </h1>
                <p class="sso-subtitle">
                    通过企业身份提供商进行安全登录
                </p>
            </div>

            <!-- SSO 登录方式 -->
            <div class="sso-methods">
                <!-- 通过邮箱域名登录 -->
                <div class="sso-method">
                    <h3>通过邮箱登录</h3>
                    <p class="text-muted">
                        输入您的企业邮箱地址，系统将自动识别对应的 SSO 提供商
                    </p>
                    <form @submit.prevent="signInWithEmail">
                        <div class="form-group">
                            <label for="email">企业邮箱</label>
                            <InputText
                                id="email"
                                v-model="emailForm.email"
                                type="email"
                                placeholder="例如：user@company.com"
                                :disabled="emailForm.loading"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            label="使用 SSO 登录"
                            icon="mdi mdi-account-network"
                            :loading="emailForm.loading"
                            class="sso-button"
                        />
                    </form>
                </div>

                <!-- 通过域名登录 -->
                <div class="sso-method">
                    <h3>通过企业域名登录</h3>
                    <p class="text-muted">
                        如果您知道企业的域名，可以直接使用域名进行 SSO 登录
                    </p>
                    <form @submit.prevent="signInWithDomain">
                        <div class="form-group">
                            <label for="domain">企业域名</label>
                            <InputText
                                id="domain"
                                v-model="domainForm.domain"
                                placeholder="例如：company.com"
                                :disabled="domainForm.loading"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            label="使用域名登录"
                            icon="mdi mdi-domain"
                            :loading="domainForm.loading"
                            class="sso-button"
                        />
                    </form>
                </div>

                <!-- 通过组织登录 -->
                <div class="sso-method">
                    <h3>通过组织登录</h3>
                    <p class="text-muted">
                        如果您属于特定组织，可以使用组织名称进行登录
                    </p>
                    <form @submit.prevent="signInWithOrganization">
                        <div class="form-group">
                            <label for="organization">组织名称</label>
                            <InputText
                                id="organization"
                                v-model="orgForm.organizationSlug"
                                placeholder="例如：company-org"
                                :disabled="orgForm.loading"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            label="使用组织登录"
                            icon="mdi mdi-office-building"
                            :loading="orgForm.loading"
                            class="sso-button"
                        />
                    </form>
                </div>

                <!-- 通过 Provider ID 登录 -->
                <div class="sso-method">
                    <h3>通过 Provider ID 登录</h3>
                    <p class="text-muted">
                        如果您知道具体的 SSO 提供商 ID，可以直接使用
                    </p>
                    <form @submit.prevent="signInWithProvider">
                        <div class="form-group">
                            <label for="providerId">Provider ID</label>
                            <InputText
                                id="providerId"
                                v-model="providerForm.providerId"
                                placeholder="例如：company-sso"
                                :disabled="providerForm.loading"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            label="使用 Provider 登录"
                            icon="mdi mdi-key-variant"
                            :loading="providerForm.loading"
                            class="sso-button"
                        />
                    </form>
                </div>
            </div>

            <!-- 已配置的 SSO 提供商列表 -->
            <div v-if="availableProviders.length > 0" class="available-providers">
                <h3>可用的 SSO 提供商</h3>
                <div class="providers-grid">
                    <div
                        v-for="provider in availableProviders"
                        :key="provider.providerId"
                        class="provider-card"
                        @click="signInWithSpecificProvider(provider)"
                    >
                        <div class="provider-info">
                            <Badge
                                :value="provider.type?.toUpperCase() || 'OIDC'"
                                :severity="provider.type === 'saml' ? 'warning' : 'info'"
                                class="provider-type"
                            />
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
                            <Button
                                icon="mdi mdi-login"
                                label="登录"
                                size="small"
                                :loading="specificProviderLoading === provider.providerId"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 普通登录链接 -->
            <div class="regular-login">
                <p class="text-muted">
                    不使用 SSO 登录？
                    <NuxtLink to="/login" class="login-link">
                        使用常规方式登录
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useSsoLoginFlow } from '@/composables/use-sso-login-flow'

definePageMeta({
    title: 'SSO 单点登录 - 草梅 Auth',
    layout: 'default',
    auth: false, // 允许未登录用户访问
})

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

    .sso-button {
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
        :deep(.p-button) {
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
