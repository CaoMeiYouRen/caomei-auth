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
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

definePageMeta({
    title: 'SSO 单点登录 - 草梅 Auth',
    layout: 'default',
    auth: false, // 允许未登录用户访问
})

const toast = useToast()

// 表单数据
const emailForm = ref({
    email: '',
    loading: false,
})

const domainForm = ref({
    domain: '',
    loading: false,
})

const orgForm = ref({
    organizationSlug: '',
    loading: false,
})

const providerForm = ref({
    providerId: '',
    loading: false,
})

// 可用的 SSO 提供商
const availableProviders = ref<any[]>([])
const specificProviderLoading = ref('')

// 获取可用的 SSO 提供商列表
async function loadAvailableProviders() {
    try {
        const response = await $fetch('/api/sso/providers/available', {
            method: 'GET',
        })

        if (response.success) {
            availableProviders.value = response.data || []
        }
    } catch (error) {
        console.error('获取 SSO 提供商列表失败:', error)
    }
}

// 通过邮箱登录
async function signInWithEmail() {
    try {
        emailForm.value.loading = true

        const result = await authClient.signIn.sso({
            email: emailForm.value.email,
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })

        if (result.error) {
            throw new Error(result.error.message || 'SSO 登录失败')
        }

        // 成功时会重定向，不需要额外处理
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: error.message || '无法找到匹配的 SSO 提供商',
            life: 5000,
        })
    } finally {
        emailForm.value.loading = false
    }
}

// 通过域名登录
async function signInWithDomain() {
    try {
        domainForm.value.loading = true

        const result = await authClient.signIn.sso({
            domain: domainForm.value.domain,
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })

        if (result.error) {
            throw new Error(result.error.message || 'SSO 登录失败')
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: error.message || '无法找到匹配的 SSO 提供商',
            life: 5000,
        })
    } finally {
        domainForm.value.loading = false
    }
}

// 通过组织登录
async function signInWithOrganization() {
    try {
        orgForm.value.loading = true

        const result = await authClient.signIn.sso({
            organizationSlug: orgForm.value.organizationSlug,
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })

        if (result.error) {
            throw new Error(result.error.message || 'SSO 登录失败')
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: error.message || '无法找到匹配的组织',
            life: 5000,
        })
    } finally {
        orgForm.value.loading = false
    }
}

// 通过 Provider ID 登录
async function signInWithProvider() {
    try {
        providerForm.value.loading = true

        const result = await authClient.signIn.sso({
            providerId: providerForm.value.providerId,
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })

        if (result.error) {
            throw new Error(result.error.message || 'SSO 登录失败')
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: error.message || '无法找到指定的 SSO 提供商',
            life: 5000,
        })
    } finally {
        providerForm.value.loading = false
    }
}

// 通过特定提供商登录
async function signInWithSpecificProvider(provider: any) {
    try {
        specificProviderLoading.value = provider.providerId

        const result = await authClient.signIn.sso({
            providerId: provider.providerId,
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })

        if (result.error) {
            throw new Error(result.error.message || 'SSO 登录失败')
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: error.message || `无法使用 ${provider.name || provider.providerId} 登录`,
            life: 5000,
        })
    } finally {
        specificProviderLoading.value = ''
    }
}

// 页面挂载时获取可用提供商
onMounted(() => {
    loadAvailableProviders()

    // 检查 URL 参数中的错误信息
    const route = useRoute()
    if (route.query.error === 'sso_failed') {
        toast.add({
            severity: 'error',
            summary: 'SSO 登录失败',
            detail: '身份验证过程中发生错误，请重试或联系管理员',
            life: 5000,
        })
    }
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

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
        margin: 0 0 1rem 0;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h3 {
        color: $primary;
        margin: 0 0 1rem 0;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;

    h3 {
        color: $primary;
        margin: 0 0 1.5rem 0;
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
            margin: 0 0 0.5rem 0;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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
@media (max-width: 768px) {
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
