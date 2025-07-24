# coding=utf-8
<template>
    <div class="oauth-consent">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <div class="loading-content">
                <i class="loading-icon mdi mdi-loading mdi-spin" />
                <p>正在验证应用信息...</p>
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="hasError" class="error-container">
            <div class="error-content">
                <i class="error-icon mdi mdi-alert-circle" />
                <h2>授权请求无效</h2>
                <p>无法处理此授权请求，请检查链接是否正确或联系应用提供方。</p>
                <Button label="返回首页" @click="navigateTo('/profile')" />
            </div>
        </div>

        <!-- 正常的同意页面 -->
        <div v-else class="consent-container">
            <div class="consent-header">
                <h1 class="consent-title">
                    授权申请
                </h1>
                <p class="consent-subtitle">
                    {{ applicationName }} 正在请求访问您的账户
                </p>
            </div>
            <div class="consent-body">
                <div v-if="application?.logoUri" class="application-logo">
                    <img :src="application.logoUri" :alt="applicationName">
                </div>
                <div class="application-info">
                    <h3>应用信息</h3>
                    <div class="info-item">
                        <strong>应用名称：</strong>{{ applicationName }}
                    </div>
                    <div v-if="application?.description" class="info-item">
                        <strong>描述：</strong>{{ application.description }}
                    </div>
                    <div v-if="application?.clientUri" class="info-item">
                        <strong>官网：</strong>
                        <a
                            :href="application.clientUri"
                            target="_blank"
                            rel="noopener"
                        >
                            {{ application.clientUri }}
                        </a>
                    </div>
                    <div v-if="application?.tosUri" class="info-item">
                        <strong>服务条款：</strong>
                        <a
                            :href="application.tosUri"
                            target="_blank"
                            rel="noopener"
                        >
                            查看服务条款
                        </a>
                    </div>
                    <div v-if="application?.policyUri" class="info-item">
                        <strong>隐私政策：</strong>
                        <a
                            :href="application.policyUri"
                            target="_blank"
                            rel="noopener"
                        >
                            查看隐私政策
                        </a>
                    </div>
                </div>
                <div class="scopes-list">
                    <h3>将获得以下权限：</h3>
                    <!-- 受信任客户端提示 -->
                    <div v-if="isTrustedClient" class="trusted-client-badge">
                        <i class="mdi mdi-shield-check" />
                        <span>这是一个受信任的应用</span>
                    </div>
                    <ul>
                        <li v-for="scopeItem in parsedScopes" :key="scopeItem.scope">
                            <i class="mdi mdi-check-circle" />
                            <span>{{ scopeItem.description }}</span>
                        </li>
                    </ul>
                    <!-- 如果没有特定权限，显示基本信息 -->
                    <div v-if="parsedScopes.length === 0" class="no-scopes">
                        <p>该应用将获得基本的身份验证权限。</p>
                    </div>
                </div>
                <!-- OAuth 参数信息（仅开发环境显示） -->
                <div v-if="$config.public.NODE_ENV === 'development'" class="debug-info">
                    <details>
                        <summary>调试信息（仅开发环境显示）</summary>
                        <pre>{{ JSON.stringify(oauthParams, null, 2) }}</pre>
                    </details>
                </div>
            </div>
            <!-- 法律信息区域 -->
            <div v-if="application?.tosUri || application?.policyUri" class="legal-info">
                <p class="legal-text">
                    在授权前，建议您仔细阅读该应用的
                    <template v-if="application?.tosUri">
                        <a
                            :href="application.tosUri"
                            target="_blank"
                            rel="noopener"
                            class="legal-link"
                        >
                            服务条款
                        </a>
                    </template>
                    <template v-if="application?.tosUri && application?.policyUri">
                        和
                    </template>
                    <template v-if="application?.policyUri">
                        <a
                            :href="application.policyUri"
                            target="_blank"
                            rel="noopener"
                            class="legal-link"
                        >
                            隐私政策
                        </a>
                    </template>
                    ，了解您的权利和义务。
                </p>
            </div>
            <div class="consent-footer">
                <Button
                    label="拒绝"
                    class="btn-deny"
                    severity="secondary"
                    :disabled="submitting"
                    @click="denyConsent"
                />
                <Button
                    :label="submitting ? '处理中...' : '授权'"
                    class="btn-allow"
                    :loading="submitting"
                    :disabled="submitting"
                    @click="allowConsent"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

const toast = useToast()

interface Scope {
    scope: string
    description: string
}

// 标准 OAuth2.0 和 OpenID Connect scopes 的描述映射
const scopeDescriptions: Record<string, string> = {
    // OpenID Connect 核心 scopes
    openid: '获取您的基本身份信息',
    profile: '访问您的个人资料信息（姓名、头像等）',
    email: '访问您的电子邮件地址',
    address: '访问您的地址信息',
    phone: '访问您的手机号码',

    // 扩展 scopes
    offline_access: '离线访问权限（获取刷新令牌）',

    // 自定义 scopes
    read: '读取权限',
    write: '写入权限',
    admin: '管理权限',

    // 用户相关
    'user:read': '查看用户信息',
    'user:write': '修改用户信息',
    'user:email': '访问用户邮箱',

    // 应用相关
    'app:read': '查看应用信息',
    'app:write': '修改应用信息',
}

const route = useRoute()
const submitting = ref(false)
const hasError = ref(false)
const isTrustedClient = ref(false)

// 从 URL 参数中获取 OAuth2.0 标准参数
const {
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: responseType,
    scope,
} = route.query

const oauthParams = ref({
    clientId: clientId as string,
    redirectUri: redirectUri as string,
    state: state as string,
    responseType: responseType as string,
    scope: scope as string,
})

// 解析 scopes
const scopes = ref<string[]>((scope as string || '').split(' ').filter((s) => s.trim()))

const parsedScopes = computed(() => scopes.value.map((scopeItem) => ({
    scope: scopeItem,
    description: scopeDescriptions[scopeItem] || `访问 ${scopeItem} 权限`,
})))

// 使用 useFetch 获取应用信息（仅在有 clientId 时）
const { data: applicationData, pending: loading, error: fetchError } = await useFetch(`/api/oauth/client/${clientId}`, {
    key: `oauth-client-${clientId}`,
    default: () => ({ success: false, data: null, message: '' }),
    server: true,
    lazy: false,
})

// 定义应用信息类型
interface ApplicationInfo {
    name: string
    clientId: string
    description?: string
    logoUri?: string
    clientUri?: string
    tosUri?: string
    policyUri?: string
}

// 计算属性：应用信息
const application = computed((): ApplicationInfo => {
    if (applicationData.value?.success && applicationData.value.data) {
        return applicationData.value.data
    }
    // 备用方案
    return {
        name: '第三方应用',
        clientId: clientId as string,
        description: '正在请求访问您的账户权限',
    }
})

const applicationName = computed(() => application.value?.name || '未知应用')

// 处理错误和验证
watch([() => clientId, fetchError], ([newClientId, newError]) => {
    if (!newClientId) {
        hasError.value = true
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '缺少必需参数：client_id',
            life: 3000,
        })
        return
    }

    if (newError) {
        // 如果是 404 或 403 错误，显示特定错误信息
        if (newError.statusCode === 404) {
            hasError.value = true
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '应用不存在，请检查授权链接是否正确',
                life: 3000,
            })
        } else if (newError.statusCode === 403) {
            hasError.value = true
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '该应用已被禁用，无法进行授权',
                life: 3000,
            })
        } else {
            // 对于其他错误，记录警告但不阻止用户继续（使用备用应用信息）
            console.warn('获取应用详细信息失败，使用默认信息:', newError)
        }
    }
}, { immediate: true })

async function allowConsent() {
    if (submitting.value) {
        return
    }

    try {
        submitting.value = true

        const { error, data } = await authClient.oauth2.consent({
            accept: true,
        })

        if (error) {
            throw new Error(error.message)
        }
        toast.add({
            severity: 'success',
            summary: '授权成功',
            detail: '您已成功授权该应用访问您的账户',
            life: 3000,
        })
        // 根据 Better Auth 文档，成功后会自动重定向到 redirect_uri
        // 如果没有自动重定向，可以手动处理
        if (data?.redirectURI) {
            window.location.href = data.redirectURI
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '授权失败',
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}

async function denyConsent() {
    if (submitting.value) {
        return
    }

    try {
        submitting.value = true

        const { error, data } = await authClient.oauth2.consent({
            accept: false,
        })

        if (error) {
            throw new Error(error.message)
        }

        // 根据 Better Auth 文档，拒绝后会自动重定向到 redirect_uri 并带有错误参数
        // 如果没有自动重定向，可以手动处理
        if (data?.redirectURI) {
            window.location.href = data.redirectURI
        } else {
            toast.add({
                severity: 'info',
                summary: '已拒绝授权',
                detail: '您已拒绝该应用访问您的账户',
                life: 3000,
            })
            // 可以重定向到首页或其他页面
            setTimeout(() => {
                navigateTo('/profile')
            }, 2000)
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '拒绝授权失败',
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.oauth-consent {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: var(--surface-ground);

    .consent-container {
        background: var(--surface-card);
        border-radius: 1rem;
        padding: 2rem;
        width: 100%;
        max-width: 600px;
        box-shadow: var(--card-shadow);
    }

    .loading-container,
    .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        width: 100%;
        max-width: 600px;
    }

    .loading-content,
    .error-content {
        text-align: center;
        background: var(--surface-card);
        border-radius: 1rem;
        padding: 3rem 2rem;
        box-shadow: var(--card-shadow);
    }

    .loading-icon {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }

    .error-icon {
        font-size: 3rem;
        color: var(--red-500);
        margin-bottom: 1rem;
    }

    .error-content h2 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .error-content p {
        color: var(--text-color-secondary);
        margin-bottom: 2rem;
        line-height: 1.6;
    }

    .consent-header {
        text-align: center;
        margin-bottom: 2rem;

        .consent-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 0.5rem;
        }

        .consent-subtitle {
            color: var(--text-color-secondary);
        }
    }

    .consent-body {
        margin-bottom: 2rem;

        .application-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;

            img {
                max-width: 80px;
                max-height: 80px;
                border-radius: 0.5rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
        }

        .application-info {
            background: var(--surface-100);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;

            h3 {
                font-size: 1rem;
                margin-bottom: 0.75rem;
                color: var(--text-color);
            }

            .info-item {
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                color: var(--text-color-secondary);

                &:last-child {
                    margin-bottom: 0;
                }

                strong {
                    color: var(--text-color);
                }

                a {
                    color: var(--primary-color);
                    text-decoration: none;

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }
        }

        .scopes-list {
            h3 {
                font-size: 1rem;
                margin-bottom: 1rem;
            }

            .trusted-client-badge {
                background: #f0fdf4; // 浅绿色背景
                color: #166534; // 深绿色文字
                border: 1px solid #bbf7d0; // 绿色边框
                border-radius: 0.5rem;
                padding: 0.5rem 0.75rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;

                i {
                    font-size: 1.1rem;
                }
            }

            ul {
                list-style: none;
                padding: 0;

                li {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0;
                    color: var(--text-color-secondary);

                    i {
                        color: var(--primary-color);
                    }
                }
            }

            .no-scopes {
                background: var(--surface-100);
                border-radius: 0.5rem;
                padding: 1rem;
                text-align: center;

                p {
                    color: var(--text-color-secondary);
                    margin: 0;
                }
            }
        }
    }

    .legal-info {
        background: #eff6ff; // 浅蓝色背景
        border: 1px solid #bfdbfe; // 蓝色边框
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 2rem;

        .legal-text {
            color: var(--text-color-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0;
            text-align: center;

            .legal-link {
                color: var(--primary-color);
                text-decoration: none;
                font-weight: 500;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .consent-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;

        .btn-deny {
            &:hover {
                background-color: var(--surface-hover);
            }
        }

        .btn-allow {
            background-color: var(--primary-color);
            color: var(--primary-color-text);

            &:hover:not(:disabled) {
                background-color: var(--primary-600);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }
    }

    // 调试信息样式
    .debug-info {
        margin-top: 1.5rem;
        border-top: 1px solid var(--surface-border);
        padding-top: 1.5rem;

        details {
            background: var(--surface-100);
            border-radius: 0.5rem;
            padding: 0.75rem;

            summary {
                cursor: pointer;
                font-weight: 500;
                color: var(--text-color-secondary);
                user-select: none;

                &:hover {
                    color: var(--text-color);
                }
            }

            pre {
                margin-top: 0.75rem;
                font-size: 0.8rem;
                color: var(--text-color-secondary);
                white-space: pre-wrap;
                word-break: break-all;
            }
        }
    }

    // 响应式设计
    @media (max-width: 768px) {
        .oauth-consent {
            padding: 1rem;

            .consent-container,
            .loading-content,
            .error-content {
                padding: 1.5rem;
            }

            .legal-info {
                .legal-text {
                    font-size: 0.85rem;
                    text-align: left;
                }
            }

            .consent-footer {
                flex-direction: column;

                .btn-deny,
                .btn-allow {
                    width: 100%;
                }
            }
        }
    }
}
</style>
