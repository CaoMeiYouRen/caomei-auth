<template>
    <div class="profile-header">
        <h2 class="auth-title">
            {{ t('profile.header.title') }}
        </h2>
    </div>
    <div class="profile-header-actions">
        <BaseTooltip :content="privacyMode ? t('profile.header.privacyDisableTip') : t('profile.header.privacyEnableTip')">
            <CaomeiButton
                :variant="privacyMode ? 'secondary' : 'primary'"
                :tone="privacyMode ? 'warning' : undefined"
                @click="togglePrivacyMode"
            >
                <template #icon>
                    <i :class="privacyMode ? 'mdi mdi-eye-off' : 'mdi mdi-eye'" />
                </template>
                {{ privacyMode ? t('profile.header.privacyOn') : t('profile.header.privacyOff') }}
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip :content="t('profile.header.oauthTip')">
            <CaomeiButton
                variant="secondary"
                @click="emit('goOAuthClients')"
            >
                <template #icon>
                    <i class="mdi mdi-key-variant" />
                </template>
                {{ t('profile.header.oauth') }}
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip :content="t('profile.header.securityTip')">
            <CaomeiButton
                variant="secondary"
                @click="emit('goSecurity')"
            >
                <template #icon>
                    <i class="mdi mdi-shield-account" />
                </template>
                {{ t('profile.header.security') }}
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip :content="t('profile.header.logoutTip')">
            <CaomeiButton
                variant="secondary"
                @click="emit('logout')"
            >
                <template #icon>
                    <i class="mdi mdi-logout" />
                </template>
                {{ t('profile.header.logout') }}
            </CaomeiButton>
        </BaseTooltip>
    </div>
    <p class="auth-subtitle">
        {{ t('profile.header.subtitle') }}
    </p>
</template>

<script setup lang="ts">
const { t } = useI18n()
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
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
}

@media (width <= 600px) {
    .profile-header-actions {
        justify-content: flex-start;
    }
}
</style>
