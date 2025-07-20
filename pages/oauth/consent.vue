# coding=utf-8
<template>
    <div class="oauth-consent">
        <div class="consent-container">
            <div class="consent-header">
                <h1 class="consent-title">
                    授权申请
                </h1>
                <p class="consent-subtitle">
                    {{ applicationName }} 正在请求访问您的账户
                </p>
            </div>
            <div class="consent-body">
                <div v-if="application?.image" class="application-logo">
                    <img :src="application.image" :alt="application.name">
                </div>
                <div class="scopes-list">
                    <h3>将获得以下权限：</h3>
                    <ul>
                        <li v-for="scope in parsedScopes" :key="scope.scope">
                            <i class="mdi mdi-check-circle" />
                            <span>{{ scope.description }}</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="consent-footer">
                <Button
                    label="拒绝"
                    class="btn-deny"
                    severity="secondary"
                    @click="denyConsent"
                />
                <Button
                    label="授权"
                    class="btn-allow"
                    @click="allowConsent"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

const toast = useToast()

interface Scope {
    scope: string
    description: string
}

const scopeDescriptions: Record<string, string> = {
    openid: '获取您的基本身份信息',
    profile: '访问您的个人资料',
    email: '访问您的电子邮件地址',
    phone: '访问您的手机号码',
}

const application = ref<any>(null)
const scopes = ref<string[]>([])
const applicationName = ref('')

const parsedScopes = computed(() => scopes.value.map((scope) => ({
    scope,
    description: scopeDescriptions[scope] || `访问 ${scope} 权限`,
})))

onMounted(async () => {
    try {
        // 从 URL 参数中获取 clientId 和 scopes
        const { clientId, scope } = useRoute().query
        scopes.value = (scope as string || '').split(' ')
        // 获取应用信息
        const { data, error } = await authClient.$fetch<any>(`/oauth2/client/${clientId}`)

        if (error) {
            throw new Error(error.message)
        }

        application.value = data
        applicationName.value = data?.name
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '获取应用信息失败',
            life: 3000,
        })
    }
})

async function allowConsent() {
    try {
        const { error } = await authClient.oauth2.consent({
            accept: true,
        })

        if (error) {
            throw new Error(error.message)
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '授权失败',
            life: 3000,
        })
    }
}

async function denyConsent() {
    try {
        const { error } = await authClient.oauth2.consent({
            accept: false,
        })

        if (error) {
            throw new Error(error.message)
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '拒绝授权失败',
            life: 3000,
        })
    }
}
</script>

<style lang="scss" scoped>
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
            margin-bottom: 1rem;

            img {
                max-width: 100px;
                border-radius: 0.5rem;
            }
        }

        .scopes-list {
            h3 {
                font-size: 1rem;
                margin-bottom: 1rem;
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

            &:hover {
                background-color: var(--primary-600);
            }
        }
    }
}
</style>
