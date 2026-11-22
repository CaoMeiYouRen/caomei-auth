<template>
    <div class="auth-container">
        <div class="auth-right">
            <div class="auth-card security-card">
                <div class="security-header-actions">
                    <CaomeiButton
                        variant="ghost"
                        class="btn-link"
                        @click="security.goProfile"
                    >
                        <template #icon>
                            <i class="mdi mdi-arrow-left" />
                        </template>
                        {{ t('security.page.back') }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="ghost"
                        class="btn-link"
                        @click="security.goOAuthClients"
                    >
                        <template #icon>
                            <i class="mdi mdi-key-variant" aria-hidden="true" />
                        </template>
                        {{ t('security.page.oauthClients') }}
                    </CaomeiButton>
                </div>
                <h2 class="auth-title">
                    {{ t('security.page.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('security.page.subtitle') }}
                </p>

                <RecoveryCodePanel
                    :two-factor-enabled="Boolean(security.userSession?.user.twoFactorEnabled)"
                />

                <div class="divider" />

                <ChannelChangeCard
                    :phone-verified="Boolean(security.userSession?.user.phoneNumberVerified)"
                />

                <div class="divider" />

                <TwoFactorPanel
                    v-model:verification-code="security.verificationCode"
                    v-model:password="security.password"
                    v-model:show-password-dialog="security.showPasswordDialog"
                    v-model:show-backup-regenerate-dialog="security.showBackupRegenerateDialog"
                    :user-session="security.userSession"
                    :show-totp-setup="security.showTotpSetup"
                    :show-backup-codes="security.showBackupCodes"
                    :qr-code-url="security.qrCodeUrl"
                    :backup-codes="security.backupCodes"
                    :password-dialog-mode="security.passwordDialogMode"
                    @enable="security.enable2FA"
                    @disable="security.disable2FA"
                    @verify="security.verifyAndEnable2FA"
                    @open-backup-regenerate="security.openBackupRegenerateDialog"
                    @confirm-backup-regenerate="security.confirmRegenerateBackupCodes"
                    @backup-regenerate-dialog-hide="security.onBackupRegenerateDialogHide"
                    @copy-backup-codes="security.copyBackupCodes"
                    @download-backup-codes="security.downloadBackupCodes"
                    @finish-setup="security.finishSetup"
                    @password-dialog-hide="security.onPasswordDialogHide"
                    @password-confirm="security.onPasswordConfirm"
                />

                <div class="divider" />

                <SessionTable
                    v-model:show-revoke-session-confirm="security.showRevokeSessionConfirm"
                    v-model:show-revoke-other-sessions-confirm="security.showRevokeOtherSessionsConfirm"
                    v-model:show-revoke-all-sessions-confirm="security.showRevokeAllSessionsConfirm"
                    :user-session="security.userSession"
                    :session-list="security.sessionList"
                    @revoke-session="security.confirmRevokeSession"
                    @revoke-other-sessions="security.confirmRevokeOtherSessions"
                    @revoke-all-sessions="security.confirmRevokeAllSessions"
                    @confirm-revoke-session="security.revokeSingleSession"
                    @confirm-revoke-other-sessions="security.revokeOtherSessions"
                    @confirm-revoke-all-sessions="security.revokeAllSessions"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import TwoFactorPanel from '@/components/security/two-factor-panel.vue'
import SessionTable from '@/components/security/session-table.vue'
import RecoveryCodePanel from '@/components/security/recovery-code-panel.vue'
import ChannelChangeCard from '@/components/security/channel-change-card.vue'
import { useSecuritySettings } from '@/composables/use-security-settings'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import { useNoIndex } from '@/composables/utils/use-no-index'

const { t } = useI18n()
usePageMeta('security.page.title', 'security.page.subtitle')
useNoIndex()

const security = reactive(useSecuritySettings())
</script>

<style scoped lang="scss">

.auth-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column-reverse;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-right {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 60vh;
    width: 100%;

    @media (width >= 768px) {
        width: 100%;
        min-height: 100vh;
    }
}

.auth-card.security-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 1200px;
}

.auth-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    text-align: center;
}

.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
    text-align: center;
}

.divider {
    border-bottom: 1px solid $secondary-bg;
    margin: 2rem 0;
}

.security-header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    :deep(.btn-link) {
        flex: 0 1 auto;
    }
}

@media (width <= 600px) {
    .auth-container {
        padding: 1.2rem;
    }

    .auth-title {
        font-size: 1.3rem;
    }

    .auth-card.security-card {
        padding: 1rem;
    }
}

// 暗色模式支持
@include dark-mode {
    .auth-container {
        background: #{$dark-background} !important;
    }

    .auth-card.security-card {
        background-color: #{$dark-background-light} !important;
        box-shadow: 0 10px 25px rgb(0 0 0 / 0.3) !important;
    }

    .auth-title {
        color: #{$dark-secondary} !important;
    }

    .auth-subtitle {
        color: #{$dark-secondary-light} !important;
    }

    .divider {
        border-color: #{$dark-border-color} !important;
    }
}
</style>

<style scoped lang="scss">

.auth-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column-reverse;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-right {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 60vh;
    width: 100%;

    @media (width >= 768px) {
        width: 100%;
        min-height: 100vh;
    }
}

.auth-card.security-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 1200px;
}

.auth-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    text-align: center;
}

.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
    text-align: center;
}

.section-title {
    font-size: 1.18rem;
    color: $primary-dark;
    font-weight: 600;
    margin-bottom: 0.7rem;
}

.section-desc {
    color: $secondary-light;
    font-size: 1rem;
    margin-bottom: 1rem;
}

.security-section {
    margin-bottom: 2rem;

    ul {
        padding-left: 0;

        li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
            display: flex;
            align-items: center;
            gap: 1.2rem;
        }
    }
}

.status {
    font-size: 0.95rem;

    &.success {
        color: #43a047;
    }

    &.fail {
        color: #e63946;
    }
}

.divider {
    border-bottom: 1px solid $secondary-bg;
    margin: 2rem 0;
}

.security-device-list {
    padding-left: 0;
    width: 100%;

    .device-list-header,
    .device-list-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 0.3rem 0;
        font-size: 1rem;
    }

    .device-list-header {
        font-weight: 600;
        color: $secondary;
        border-bottom: 1px solid $secondary-bg;
        margin-bottom: 0.3rem;

        span {
            flex: 1;
        }

        .device-action-col {
            flex: 0 0 100px;
        }
    }

    .device-list-row {
        span {
            flex: 1;
            word-break: break-all;
        }

        .device-action-col {
            flex: 0 0 100px;
            display: flex;
            justify-content: flex-end;
        }
    }
}

.security-header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    :deep(.btn-link) {
        flex: 0 1 auto;
    }
}

@media (width <= 600px) {
    .auth-container {
        padding: 1.2rem;
    }

    .auth-title {
        font-size: 1.3rem;
    }

    .auth-card.security-card {
        padding: 1rem;
    }
}

.divider {
    border-bottom: 1px solid $secondary-bg;
    margin: 2rem 0;
}

.security-device-list {
    padding-left: 0;
    width: 100%;

    .device-list-header,
    .device-list-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 0.3rem 0;
        font-size: 1rem;
    }

    .device-list-header {
        font-weight: 600;
        color: $secondary;
        border-bottom: 1px solid $secondary-bg;
        margin-bottom: 0.3rem;

        span {
            flex: 1;
        }

        .device-action-col {
            flex: 0 0 100px;
        }
    }

    .device-list-row {
        span {
            flex: 1;
            word-break: break-all;
        }

        .device-action-col {
            flex: 0 0 100px;
            display: flex;
            justify-content: flex-end;
        }
    }
}

.security-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
}

.security-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    justify-content: flex-end;

    :deep(.btn) {
        max-width: 180px;
    }
}

// TOTP 设置相关样式
.totp-setup {
    .setup-title {
        color: $secondary;
        font-size: 1.18rem;
        font-weight: 600;
    }

    .setup-steps {
        color: $secondary-light;
        padding-left: 1.2rem;

        li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
        }
    }

    .qr-code {
        display: flex;
        justify-content: center;

        img {
            max-width: 200px;
            border: 1px solid $border-color;
            border-radius: 8px;
            padding: 1rem;
            background: $background-light;
        }
    }

    .verification-input {
        max-width: 300px;
        margin: 0 auto;
    }
}

// 备份码相关样式
.backup-codes {
    .backup-title {
        color: $secondary;
        font-size: 1.18rem;
        font-weight: 600;
    }

    .backup-codes-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.5rem;
        padding: 1rem;
        background: $background;
        border: 1px solid $border-color;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
    }

    .backup-code {
        padding: 0.5rem;
        background: $background-light;
        border: 1px solid $border-color;
        border-radius: 4px;
        text-align: center;
        font-weight: 600;
        letter-spacing: 1px;
    }
}

// 暗色模式支持
@include dark-mode {
    .auth-container {
        background: #{$dark-background} !important;
    }

    .auth-card.security-card {
        background-color: #{$dark-background-light} !important;
        box-shadow: 0 10px 25px rgb(0 0 0 / 0.3) !important;
    }

    .auth-title {
        color: #{$dark-secondary} !important;
    }

    .auth-subtitle {
        color: #{$dark-secondary-light} !important;
    }

    .section-title {
        color: #{$primary-light} !important;
    }

    .section-desc {
        color: #{$dark-secondary-light} !important;
    }

    .divider {
        border-color: #{$dark-border-color} !important;
    }

    .security-device-list {
        .device-list-header {
            color: #{$dark-secondary} !important;
            border-color: #{$dark-border-color} !important;
        }

        .device-list-row {
            span {
                color: #{$dark-secondary-light} !important;
            }
        }
    }

    // TOTP 设置暗色模式
    .totp-setup {
        .setup-title {
            color: #{$dark-secondary} !important;
        }

        .setup-steps {
            color: #{$dark-secondary-light} !important;
        }

        .qr-code img {
            border-color: #{$dark-border-color} !important;
            background: #{$dark-background-light} !important;
        }
    }

    // 备份码暗色模式
    .backup-codes {
        .backup-title {
            color: #{$dark-secondary} !important;
        }

        .backup-codes-list {
            background: #{$dark-background} !important;
            border-color: #{$dark-border-color} !important;
        }

        .backup-code {
            background: #{$dark-background-light} !important;
            border-color: #{$dark-border-color} !important;
            color: #{$dark-secondary} !important;
        }
    }

    // 状态指示器暗色模式
    .status {
        &.success {
            color: #4ade80 !important; // 暗色模式下使用更亮的绿色
        }

        &.fail {
            color: #f87171 !important; // 暗色模式下使用更亮的红色
        }
    }
}
</style>
