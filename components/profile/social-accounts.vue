<template>
    <div class="form-group">
        <label class="form-label">第三方账号</label>
        <div class="social-list">
            <!-- 已绑定的第三方账号 -->
            <CaomeiButton
                v-for="account in userAccounts"
                :key="account.providerId"
                variant="secondary"
                class="social-btn"
                :style="{color: getProviderColor(account.providerId)}"
                :title="privacyMode ? `点击解绑 ${getProviderName(account.providerId)} 账号，ID: ${maskUserId(account.accountId)}` : `点击解绑 ${getProviderName(account.providerId)} 账号，完整 ID: ${account.accountId}`"
                @click="emit('unlink', account.providerId, account.accountId)"
            >
                <template #icon>
                    <i :class="getProviderIcon(account.providerId)" />
                </template>
                {{ privacyMode ? `${getProviderName(account.providerId)}(ID: ${maskUserId(account.accountId)})` : `${getProviderName(account.providerId)}(ID: ${account.accountId.slice(0, 10)}${account.accountId.length > 10 ? '...' : ''})` }}
            </CaomeiButton>

            <!-- 绑定新账号   -->
            <template v-for="provider in enabledProviders">
                <CaomeiButton
                    v-if="!userAccounts.some(account => account.providerId === provider.provider) && !provider.anonymous"
                    :key="provider.provider"
                    variant="secondary"
                    class="social-btn"
                    :style="{color: provider.color}"
                    @click="emit('link', provider)"
                >
                    <template #icon>
                        <i :class="getProviderIcon(provider.provider)" />
                    </template>
                    绑定 {{ provider.name }} 账号
                </CaomeiButton>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { maskUserId } from '@/utils/shared/privacy'
import { getSocialColor } from '@/utils/web/social-colors'
import type { SocialProvider } from '@/types/social'

const props = defineProps<{
    userAccounts: {
        id: string
        providerId: string
        createdAt: Date
        updatedAt: Date
        accountId: string
        scopes: string[]
    }[]
    enabledProviders: any[]
    socialProviders: any[]
    privacyMode: boolean
}>()

const emit = defineEmits<{
    (e: 'unlink', providerId: string, accountId: string): void
    (e: 'link', provider: SocialProvider): void
}>()

const isDark = useDark()

// 根据 provider 获取对应的名称
const getProviderName = (provider: string) => {
    const providerObj = props.socialProviders.find((p) => p.provider === provider)
    return providerObj ? providerObj.name : provider
}
const getProviderIcon = (provider: string) => {
    const providerObj = props.socialProviders.find((p) => p.provider === provider)
    return providerObj?.icon || `mdi mdi-${provider}`
}
// 根据 provider 获取对应的颜色（考虑暗色模式）
const getProviderColor = (provider: string) => {
    const theme = isDark.value ? 'dark' : 'light'
    return getSocialColor(provider, theme)
}
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
}

.social-list {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .linked {
        background: $primary;
        color: #fff;
    }

    .social-btn {
        margin-bottom: 0.2rem;
    }
}
</style>
