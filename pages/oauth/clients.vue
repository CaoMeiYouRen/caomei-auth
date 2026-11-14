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
                    <CaomeiButton
                        variant="secondary"
                        @click="goProfile"
                    >
                        <template #icon>
                            <i class="mdi mdi-arrow-left" aria-hidden="true" />
                        </template>
                        返回个人中心
                    </CaomeiButton>
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
                            <CaomeiButton
                                v-if="app.application.tosUri"
                                variant="ghost"
                                size="sm"
                                @click="openLink(app.application.tosUri)"
                            >
                                服务条款
                            </CaomeiButton>
                            <CaomeiButton
                                v-if="app.application.policyUri"
                                variant="ghost"
                                size="sm"
                                @click="openLink(app.application.policyUri)"
                            >
                                隐私政策
                            </CaomeiButton>
                        </div>
                        <CaomeiButton
                            tone="danger"
                            size="sm"
                            :loading="revokingApps.has(app.clientId)"
                            @click="confirmRevokeAuthorization(app)"
                        >
                            撤销授权
                        </CaomeiButton>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
                <div class="empty-content">
                    <i class="empty-icon mdi mdi-key-variant" />
                    <h3>暂无授权应用</h3>
                    <p>您还没有授权任何第三方应用访问您的账户</p>
                    <CaomeiButton
                        variant="secondary"
                        @click="goDocs"
                    >
                        了解更多
                    </CaomeiButton>
                </div>
            </div>
        </div>

        <!-- 撤销授权确认对话框 -->
        <BaseDialogV2
            v-model:visible="showRevokeDialog"
            title="撤销授权"
            size="md"
            :closable="!revoking"
            :close-on-esc="!revoking"
            :close-on-overlay="!revoking"
        >
            <div class="revoke-dialog-content">
                <p>您确定要撤销对 <strong>{{ selectedApp?.application?.name }}</strong> 的授权吗？</p>
                <CaomeiAlert
                    tone="warning"
                    title="撤销后："
                >
                    <ul>
                        <li>该应用将无法继续访问您的账户信息</li>
                        <li>您可能需要重新登录该应用</li>
                        <li>已获取的数据不会被自动删除</li>
                    </ul>
                </CaomeiAlert>
            </div>

            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    :disabled="revoking"
                    @click="showRevokeDialog = false"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton
                    tone="danger"
                    :loading="revoking"
                    @click="revokeAuthorization"
                >
                    确认撤销
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script lang="ts" setup>
import { useOAuthClients } from '@/composables/use-oauth-clients'

definePageMeta({
    layout: 'default',
})

const {
    loading,
    authorizedApps,
    showRevokeDialog,
    selectedApp,
    revoking,
    revokingApps,
    getScopeDescription,
    confirmRevokeAuthorization,
    revokeAuthorization,
    openLink,
    goProfile,
    goDocs,
    formatDateTime,
} = await useOAuthClients()
</script>

<style lang="scss" scoped>

.oauth-clients-page {
    min-height: 100vh;
    background-color: var(--admin-bg);

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
                color: var(--admin-text);
                font-weight: 600;
                font-size: 2rem;

                i {
                    color: var(--color-primary);
                }
            }

            .page-description {
                color: var(--admin-muted);
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
                color: var(--color-primary);
                font-size: 3rem;
            }

            p {
                color: var(--admin-muted);
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
        background: var(--admin-surface);
        border: 1px solid var(--admin-border);
        border-radius: 1rem;
        box-shadow: var(--admin-shadow);
        transition: all 0.2s ease;

        &:hover {
            box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
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
                background: var(--admin-surface-muted);
                border-radius: 0.75rem;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 0.75rem;
                }

                i {
                    color: var(--admin-muted);
                    font-size: 2rem;
                }
            }

            .app-info {
                flex: 1;
                min-width: 0;

                .app-name {
                    margin-bottom: 0.5rem;
                    color: var(--admin-text);
                    font-weight: 600;
                    font-size: 1.25rem;
                }

                .app-description {
                    display: -webkit-box;
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                    color: var(--admin-muted);
                    font-size: 0.9rem;
                    line-height: 1.4;
                    line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .app-website {
                    display: inline-flex;
                    gap: 0.25rem;
                    align-items: center;
                    color: var(--color-primary);
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
                    color: var(--admin-text);
                    font-size: 0.9rem;
                }

                >span {
                    color: var(--admin-muted);
                    font-size: 0.9rem;
                }

                .scopes-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;

                    .scope-tag {
                        padding: 0.25rem 0.5rem;
                        color: var(--color-primary);
                        font-weight: 500;
                        font-size: 0.8rem;
                        background: var(--admin-primary-soft);
                        border-radius: 0.375rem;
                    }

                    .no-scopes {
                        color: var(--admin-muted);
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
            border-top: 1px solid var(--admin-border);

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
                color: var(--admin-muted);
                font-size: 4rem;
                opacity: 0.6;
            }

            h3 {
                margin-bottom: 1rem;
                color: var(--admin-text);
                font-size: 1.5rem;
            }

            p {
                margin-bottom: 2rem;
                color: var(--admin-muted);
                line-height: 1.6;
            }
        }
    }

    .revoke-dialog-content {
        p {
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        ul {
            margin: 0;
            padding-left: 1.2rem;

            li {
                margin-bottom: 0.25rem;
                color: var(--admin-muted);
                font-size: 0.9rem;
            }
        }
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
