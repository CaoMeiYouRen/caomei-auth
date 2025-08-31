<template>
    <div class="oauth-clients-page">
        <div class="container">
            <!-- 页面标题 -->
            <div class="page-header">
                <div class="header-content">
                    <h1 class="page-title">
                        <i class="mdi mdi-key-variant" />
                        已授权应用
                    </h1>
                    <p class="page-description">
                        管理您授权访问账户的第三方应用
                    </p>
                </div>
                <div class="header-actions">
                    <Button
                        label="返回个人中心"
                        icon="mdi mdi-arrow-left"
                        outlined
                        severity="secondary"
                        @click="goProfile"
                    />
                </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <div class="loading-content">
                    <i class="loading-icon mdi mdi-loading mdi-spin" />
                    <p>正在加载授权应用...</p>
                </div>
            </div>

            <!-- 应用列表 -->
            <div v-else-if="authorizedApps.length > 0" class="apps-grid">
                <div
                    v-for="app in authorizedApps"
                    :key="app.clientId"
                    class="app-card"
                >
                    <div class="app-header">
                        <div class="app-logo">
                            <img
                                v-if="app.application.logoUri"
                                :src="app.application.logoUri"
                                :alt="app.application.name"
                            >
                            <i v-else class="mdi mdi-application" />
                        </div>
                        <div class="app-info">
                            <h3 class="app-name">
                                {{ app.application.name }}
                            </h3>
                            <p v-if="app.application.description" class="app-description">
                                {{ app.application.description }}
                            </p>
                            <a
                                v-if="app.application.clientUri"
                                :href="app.application.clientUri"
                                target="_blank"
                                rel="noopener"
                                class="app-website"
                            >
                                <i class="mdi mdi-open-in-new" />
                                访问官网
                            </a>
                        </div>
                    </div>

                    <div class="app-details">
                        <div class="detail-item">
                            <strong>授权时间：</strong>
                            <span>{{ formatDateTime(app.consentedAt) }}</span>
                        </div>
                        <div class="detail-item">
                            <strong>应用权限：</strong>
                            <div class="scopes-list">
                                <span
                                    v-for="scope in app.scopes"
                                    :key="scope"
                                    class="scope-tag"
                                >
                                    {{ getScopeDescription(scope) }}
                                </span>
                                <span v-if="app.scopes.length === 0" class="no-scopes">
                                    基本访问权限
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="app-actions">
                        <div class="app-links">
                            <Button
                                v-if="app.application.tosUri"
                                label="服务条款"
                                size="small"
                                text
                                @click="openLink(app.application.tosUri)"
                            />
                            <Button
                                v-if="app.application.policyUri"
                                label="隐私政策"
                                size="small"
                                text
                                @click="openLink(app.application.policyUri)"
                            />
                        </div>
                        <Button
                            label="撤销授权"
                            severity="danger"
                            size="small"
                            :loading="revokingApps.has(app.clientId)"
                            @click="confirmRevokeAuthorization(app)"
                        />
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
                <div class="empty-content">
                    <i class="empty-icon mdi mdi-key-variant" />
                    <h3>暂无授权应用</h3>
                    <p>您还没有授权任何第三方应用访问您的账户</p>
                    <Button
                        label="了解更多"
                        outlined
                        @click="goDocs"
                    />
                </div>
            </div>
        </div>

        <!-- 撤销授权确认对话框 -->
        <Dialog
            v-model:visible="showRevokeDialog"
            modal
            header="撤销授权"
            :style="{width: '450px'}"
            :closable="!revoking"
        >
            <template #header>
                <div class="dialog-header">
                    <i class="mdi mdi-alert-circle-outline" />
                    <span>撤销授权</span>
                </div>
            </template>

            <div class="revoke-dialog-content">
                <p>您确定要撤销对 <strong>{{ selectedApp?.application?.name }}</strong> 的授权吗？</p>
                <div class="warning-notice">
                    <i class="mdi mdi-information-outline" />
                    <div>
                        <p><strong>撤销后：</strong></p>
                        <ul>
                            <li>该应用将无法继续访问您的账户信息</li>
                            <li>您可能需要重新登录该应用</li>
                            <li>已获取的数据不会被自动删除</li>
                        </ul>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <Button
                        label="取消"
                        severity="secondary"
                        :disabled="revoking"
                        @click="showRevokeDialog = false"
                    />
                    <Button
                        label="确认撤销"
                        severity="danger"
                        :loading="revoking"
                        @click="revokeAuthorization"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { formatDateTime } from '@/utils/date'

definePageMeta({
    layout: 'default',
})

const toast = useToast()

interface AuthorizedApp {
    id: string
    clientId: string
    consentedAt: string
    scopes: string[]
    application: {
        name: string
        description?: string
        logoUri?: string
        clientUri?: string
        tosUri?: string
        policyUri?: string
    }
}

// 标准 OAuth2.0 和 OpenID Connect scopes 的描述映射
const scopeDescriptions: Record<string, string> = {
    // OpenID Connect 核心 scopes
    openid: '基本身份信息',
    profile: '个人资料信息',
    email: '电子邮件地址',
    address: '地址信息',
    phone: '手机号码',

    // 扩展 scopes
    offline_access: '离线访问权限',

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

const showRevokeDialog = ref(false)
const selectedApp = ref<AuthorizedApp>()
const revoking = ref(false)
const revokingApps = ref(new Set<string>())

// 使用 useFetch 进行 SSR 优化的数据获取
const { data: authorizedAppsData, pending: loading, error, refresh: refreshApps } = await useFetch<{
    success: boolean
    data: AuthorizedApp[]
    message?: string
}>('/api/oauth/consents', {
    default: () => ({ success: false, data: [], message: '' }),
    server: true,
    lazy: false,
})

// 计算属性，从 useFetch 结果中提取数据
const authorizedApps = computed(() => {
    if (authorizedAppsData.value?.success) {
        return authorizedAppsData.value.data
    }
    return []
})

// 处理错误
watch(error, (newError) => {
    if (newError) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: newError.message || '获取授权应用列表失败',
            life: 3000,
        })
    }
})

// 重新加载授权应用列表
async function loadAuthorizedApps() {
    await refreshApps()
}

// 获取权限描述
function getScopeDescription(scope: string) {
    return scopeDescriptions[scope] || scope
}

// 确认撤销授权
function confirmRevokeAuthorization(app: AuthorizedApp) {
    selectedApp.value = app
    showRevokeDialog.value = true
}

// 撤销授权
async function revokeAuthorization() {
    if (!selectedApp.value) {
        return
    }

    try {
        revoking.value = true
        revokingApps.value.add(selectedApp.value.clientId)

        const response = await $fetch<any>('/api/oauth/revoke-consent', {
            method: 'POST',
            body: {
                clientId: selectedApp.value.clientId,
            },
        })

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: '撤销成功',
                detail: `已成功撤销对 ${selectedApp.value.application.name} 的授权`,
                life: 3000,
            })

            await loadAuthorizedApps()
        } else {
            throw new Error(response.message || '撤销授权失败')
        }
    } catch (revokeError: any) {
        toast.add({
            severity: 'error',
            summary: '撤销失败',
            detail: revokeError.message || '撤销授权失败',
            life: 3000,
        })
    } finally {
        revoking.value = false
        revokingApps.value.delete(selectedApp.value.clientId)
        showRevokeDialog.value = false
        selectedApp.value = {} as any
    }
}

// 打开链接
function openLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
}

function goProfile() {
    navigateTo('/profile')
}

function goDocs() {
    navigateTo('/docs')
}
</script>

<style lang="scss" scoped>

.oauth-clients-page {
    min-height: 100vh;
    background-color: var(--surface-ground);

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .page-header {
        display: flex;
        gap: 2rem;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 2rem;

        .header-content {
            flex: 1;

            .page-title {
                display: flex;
                gap: 0.75rem;
                align-items: center;
                margin-bottom: 0.5rem;
                color: var(--text-color);
                font-weight: 600;
                font-size: 2rem;

                i {
                    color: var(--primary-color);
                }
            }

            .page-description {
                color: var(--text-color-secondary);
                font-size: 1.1rem;
            }
        }

        .header-actions {
            flex-shrink: 0;
        }
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;

        .loading-content {
            text-align: center;

            .loading-icon {
                margin-bottom: 1rem;
                color: var(--primary-color);
                font-size: 3rem;
            }

            p {
                color: var(--text-color-secondary);
                font-size: 1.1rem;
            }
        }
    }

    .apps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 1.5rem;
    }

    .app-card {
        padding: 1.5rem;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 1rem;
        box-shadow: var(--card-shadow);
        transition: all 0.2s ease;

        &:hover {
            box-shadow: var(--card-hover-shadow);
            transform: translateY(-2px);
        }

        .app-header {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;

            .app-logo {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                background: var(--surface-100);
                border-radius: 0.75rem;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 0.75rem;
                }

                i {
                    color: var(--text-color-secondary);
                    font-size: 2rem;
                }
            }

            .app-info {
                flex: 1;
                min-width: 0;

                .app-name {
                    margin-bottom: 0.5rem;
                    color: var(--text-color);
                    font-weight: 600;
                    font-size: 1.25rem;
                }

                .app-description {
                    display: -webkit-box;
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                    color: var(--text-color-secondary);
                    font-size: 0.9rem;
                    line-height: 1.4;
                    line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .app-website {
                    display: inline-flex;
                    gap: 0.25rem;
                    align-items: center;
                    color: var(--primary-color);
                    font-size: 0.85rem;
                    text-decoration: none;

                    &:hover {
                        text-decoration: underline;
                    }

                    i {
                        font-size: 0.85rem;
                    }
                }
            }
        }

        .app-details {
            margin-bottom: 1.5rem;

            .detail-item {
                margin-bottom: 1rem;

                &:last-child {
                    margin-bottom: 0;
                }

                strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-color);
                    font-size: 0.9rem;
                }

                >span {
                    color: var(--text-color-secondary);
                    font-size: 0.9rem;
                }

                .scopes-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;

                    .scope-tag {
                        padding: 0.25rem 0.5rem;
                        color: var(--primary-700);
                        font-weight: 500;
                        font-size: 0.8rem;
                        background: var(--primary-50);
                        border-radius: 0.375rem;
                    }

                    .no-scopes {
                        color: var(--text-color-secondary);
                        font-size: 0.85rem;
                        font-style: italic;
                    }
                }
            }
        }

        .app-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 1rem;
            border-top: 1px solid var(--surface-border);

            .app-links {
                display: flex;
                gap: 0.5rem;
            }
        }
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;

        .empty-content {
            max-width: 400px;
            text-align: center;

            .empty-icon {
                margin-bottom: 1.5rem;
                color: var(--text-color-secondary);
                font-size: 4rem;
                opacity: 0.6;
            }

            h3 {
                margin-bottom: 1rem;
                color: var(--text-color);
                font-size: 1.5rem;
            }

            p {
                margin-bottom: 2rem;
                color: var(--text-color-secondary);
                line-height: 1.6;
            }
        }
    }

    .dialog-header {
        display: flex;
        gap: 0.5rem;
        align-items: center;

        i {
            color: var(--orange-500);
        }
    }

    .revoke-dialog-content {
        p {
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .warning-notice {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: var(--yellow-50);
            border: 1px solid var(--yellow-200);
            border-radius: 0.5rem;

            i {
                flex-shrink: 0;
                margin-top: 0.1rem;
                color: var(--yellow-600);
                font-size: 1.2rem;
            }

            div {
                flex: 1;

                p {
                    margin-bottom: 0.5rem;
                    color: var(--text-color);
                    font-weight: 500;
                }

                ul {
                    margin: 0;
                    padding-left: 1.2rem;

                    li {
                        margin-bottom: 0.25rem;
                        color: var(--text-color-secondary);
                        font-size: 0.9rem;
                    }
                }
            }
        }
    }

    .dialog-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    // 响应式设计
    @media (width <= 768px) {
        .container {
            padding: 1rem;
        }

        .apps-grid {
            grid-template-columns: 1fr;
        }

        .app-card {
            .app-header {
                .app-logo {
                    width: 50px;
                    height: 50px;
                }

                .app-info {
                    .app-name {
                        font-size: 1.1rem;
                    }
                }
            }

            .app-actions {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;

                .app-links {
                    justify-content: center;
                }
            }
        }

        .page-header {
            .header-content {
                .page-title {
                    font-size: 1.5rem;
                }
            }

            flex-direction: column;
            gap: 1rem;
            align-items: stretch;

            .header-actions {
                align-self: flex-start;
            }
        }
    }
}
</style>
