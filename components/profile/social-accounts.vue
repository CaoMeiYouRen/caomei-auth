<template>
    <div class="form-group">
        <label class="form-label">第三方账号</label>
        <div class="social-list">
            <!-- 已绑定的第三方账号 -->
            <Button
                v-for="account in userAccounts"
                :key="account.providerId"
                v-tooltip.top="privacyMode ? `点击解绑 ${getProviderName(account.providerId)} 账号，ID: ${maskUserId(account.accountId)}` : `点击解绑 ${getProviderName(account.providerId)} 账号，完整 ID: ${account.accountId}`"
                class="social-btn"
                :style="{color: getProviderColor(account.providerId)}"
                :icon="getProviderIcon(account.providerId)"
                :label="privacyMode ? `${getProviderName(account.providerId)}(ID: ${maskUserId(account.accountId)})` : `${getProviderName(account.providerId)}(ID: ${account.accountId.slice(0, 10)}${account.accountId.length > 10 ? '...' : ''})`"
                outlined
                @click="emit('unlink', account.providerId, account.accountId)"
            />

            <!-- 绑定新账号   -->
            <template v-for="provider in enabledProviders">
                <Button
                    v-if="!userAccounts.some(account => account.providerId === provider.provider) && !provider.anonymous"
                    :key="provider.provider"
                    class="social-btn"
                    :style="{color: provider.color}"
                    :icon="getProviderIcon(provider.provider)"
                    :label="`绑定 ${provider.name} 账号`"
                    outlined
                    @click="emit('link', provider)"
                />
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { maskUserId } from '@/utils/privacy'
import { getSocialColor } from '@/utils/social-colors'
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
