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
                <Button label="返回首页" @click="handleGoHome" />
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
                <div v-if="config.public.NODE_ENV === 'development'" class="debug-info">
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
import { useOAuthConsent } from '@/composables/use-oauth-consent'

const {
    loading,
    hasError,
    applicationName,
    application,
    isTrustedClient,
    parsedScopes,
    config,
    oauthParams,
    submitting,
    handleGoHome,
    allowConsent,
    denyConsent,
} = await useOAuthConsent()
</script>

<style lang="scss" scoped>

.oauth-consent {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: var(--surface-ground);

    .consent-container {
        width: 100%;
        max-width: 600px;
        padding: 2rem;
        background: var(--surface-card);
        border-radius: 1rem;
        box-shadow: var(--card-shadow);
    }

    .loading-container,
    .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 600px;
        min-height: 400px;
    }

    .loading-content,
    .error-content {
        padding: 3rem 2rem;
        text-align: center;
        background: var(--surface-card);
        border-radius: 1rem;
        box-shadow: var(--card-shadow);
    }

    .loading-icon {
        margin-bottom: 1rem;
        color: var(--primary-color);
        font-size: 3rem;
    }

    .error-icon {
        margin-bottom: 1rem;
        color: var(--red-500);
        font-size: 3rem;
    }

    .error-content h2 {
        margin-bottom: 1rem;
        color: var(--text-color);
        font-size: 1.5rem;
    }

    .error-content p {
        margin-bottom: 2rem;
        color: var(--text-color-secondary);
        line-height: 1.6;
    }

    .consent-header {
        margin-bottom: 2rem;
        text-align: center;

        .consent-title {
            margin-bottom: 0.5rem;
            color: var(--text-color);
            font-weight: 600;
            font-size: 1.5rem;
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
                box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
            }
        }

        .application-info {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--surface-100);
            border-radius: 0.5rem;

            h3 {
                margin-bottom: 0.75rem;
                color: var(--text-color);
                font-size: 1rem;
            }

            .info-item {
                margin-bottom: 0.5rem;
                color: var(--text-color-secondary);
                font-size: 0.9rem;

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
                margin-bottom: 1rem;
                font-size: 1rem;
            }

            .trusted-client-badge {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 1rem;
                padding: 0.5rem 0.75rem;
                color: #166534; // 深绿色文字
                font-size: 0.9rem;
                background: #f0fdf4; // 浅绿色背景
                border: 1px solid #bbf7d0; // 绿色边框
                border-radius: 0.5rem;

                i {
                    font-size: 1.1rem;
                }
            }

            ul {
                padding: 0;
                list-style: none;

                li {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    padding: 0.5rem 0;
                    color: var(--text-color-secondary);

                    i {
                        color: var(--primary-color);
                    }
                }
            }

            .no-scopes {
                padding: 1rem;
                text-align: center;
                background: var(--surface-100);
                border-radius: 0.5rem;

                p {
                    margin: 0;
                    color: var(--text-color-secondary);
                }
            }
        }
    }

    .legal-info {
        margin-bottom: 2rem;
        padding: 1rem;
        background: #eff6ff; // 浅蓝色背景
        border: 1px solid #bfdbfe; // 蓝色边框
        border-radius: 0.5rem;

        .legal-text {
            margin: 0;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
            text-align: center;

            .legal-link {
                color: var(--primary-color);
                font-weight: 500;
                text-decoration: none;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .consent-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;

        .btn-deny {
            &:hover {
                background-color: var(--surface-hover);
            }
        }

        .btn-allow {
            color: var(--primary-color-text);
            background-color: var(--primary-color);

            &:hover:not(:disabled) {
                background-color: var(--primary-600);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }
        }
    }

    // 调试信息样式
    .debug-info {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--surface-border);

        details {
            padding: 0.75rem;
            background: var(--surface-100);
            border-radius: 0.5rem;

            summary {
                color: var(--text-color-secondary);
                font-weight: 500;
                cursor: pointer;
                user-select: none;

                &:hover {
                    color: var(--text-color);
                }
            }

            pre {
                margin-top: 0.75rem;
                color: var(--text-color-secondary);
                font-size: 0.8rem;
                white-space: pre-wrap;
                word-break: break-all;
            }
        }
    }

    // 响应式设计
    @media (width <= 768px) {
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
