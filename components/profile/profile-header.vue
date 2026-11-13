<template>
    <div class="profile-header">
        <h2 class="auth-title">
            个人资料
        </h2>
    </div>
    <div class="profile-header-actions">
        <BaseTooltip :content="privacyMode ? '关闭隐私模式，显示完整信息' : '开启隐私模式，隐藏敏感信息'">
            <CaomeiButton
                :variant="privacyMode ? 'secondary' : 'primary'"
                :tone="privacyMode ? 'warning' : undefined"
                @click="togglePrivacyMode"
            >
                <template #icon>
                    <i :class="privacyMode ? 'mdi mdi-eye-off' : 'mdi mdi-eye'" />
                </template>
                {{ privacyMode ? '隐私模式' : '显示详情' }}
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip content="已授权应用管理">
            <CaomeiButton
                variant="secondary"
                @click="emit('goOAuthClients')"
            >
                <template #icon>
                    <i class="mdi mdi-key-variant" />
                </template>
                授权应用
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip content="账号安全设置">
            <CaomeiButton
                variant="secondary"
                @click="emit('goSecurity')"
            >
                <template #icon>
                    <i class="mdi mdi-shield-account" />
                </template>
                安全设置
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip content="退出登录">
            <CaomeiButton
                variant="secondary"
                @click="emit('logout')"
            >
                <template #icon>
                    <i class="mdi mdi-logout" />
                </template>
                退出登录
            </CaomeiButton>
        </BaseTooltip>
    </div>
    <p class="auth-subtitle">
        管理您的账号信息
    </p>
</template>

<script setup lang="ts">
const privacyMode = defineModel<boolean>('privacyMode')

const emit = defineEmits<{
    (e: 'goOAuthClients'): void
    (e: 'goSecurity'): void
    (e: 'logout'): void
}>()

function togglePrivacyMode() {
    privacyMode.value = !privacyMode.value
}
</script>

<style scoped lang="scss">
.profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.profile-header-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
}
</style>
