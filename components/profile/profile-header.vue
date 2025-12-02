<template>
    <div class="profile-header">
        <h2 class="auth-title">
            个人资料
        </h2>
    </div>
    <div class="profile-header-actions">
        <Button
            v-tooltip.top="privacyMode ? '关闭隐私模式，显示完整信息' : '开启隐私模式，隐藏敏感信息'"
            :label="privacyMode ? '隐私模式' : '显示详情'"
            :icon="privacyMode ? 'mdi mdi-eye-off' : 'mdi mdi-eye'"
            :severity="privacyMode ? 'warn' : 'info'"
            @click="togglePrivacyMode"
        />
        <Button
            v-tooltip.top="'已授权应用管理'"
            label="授权应用"
            icon="mdi mdi-key-variant"
            severity="secondary"
            @click="emit('goOAuthClients')"
        />
        <Button
            v-tooltip.top="'账号安全设置'"
            label="安全设置"
            icon="mdi mdi-shield-account"
            severity="secondary"
            @click="emit('goSecurity')"
        />
        <Button
            v-tooltip.top="'退出登录'"
            label="退出登录"
            icon="mdi mdi-logout"
            severity="secondary"
            @click="emit('logout')"
        />
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
