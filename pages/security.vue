<template>
    <div class="auth-container">
        <div class="auth-right">
            <div class="auth-card security-card">
                <div class="security-header-actions">
                    <Button
                        label="返回个人中心"
                        class="btn btn-link"
                        icon="mdi mdi-arrow-left"
                        severity="secondary"
                        @click="goProfile"
                    />
                </div>
                <h2 class="auth-title">
                    账号安全设置
                </h2>
                <p class="auth-subtitle">
                    管理您的账号安全，设置多因子认证、查看登录日志、管理已登录设备、会话管理等。
                </p>

                <TwoFactorPanel
                    v-model:verification-code="verificationCode"
                    v-model:password="password"
                    v-model:show-password-dialog="showPasswordDialog"
                    :user-session="userSession"
                    :show-totp-setup="showTotpSetup"
                    :show-backup-codes="showBackupCodes"
                    :qr-code-url="qrCodeUrl"
                    :backup-codes="backupCodes"
                    :password-dialog-mode="passwordDialogMode"
                    @enable="enable2FA"
                    @disable="disable2FA"
                    @verify="verifyAndEnable2FA"
                    @copy-backup-codes="copyBackupCodes"
                    @download-backup-codes="downloadBackupCodes"
                    @finish-setup="finishSetup"
                    @password-dialog-hide="onPasswordDialogHide"
                    @password-confirm="onPasswordConfirm"
                />

                <div class="divider" />

                <SessionTable
                    v-model:show-revoke-session-confirm="showRevokeSessionConfirm"
                    v-model:show-revoke-other-sessions-confirm="showRevokeOtherSessionsConfirm"
                    v-model:show-revoke-all-sessions-confirm="showRevokeAllSessionsConfirm"
                    :user-session="userSession"
                    :session-list="sessionList"
                    @revoke-session="confirmRevokeSession"
                    @revoke-other-sessions="confirmRevokeOtherSessions"
                    @revoke-all-sessions="confirmRevokeAllSessions"
                    @confirm-revoke-session="revokeSingleSession"
                    @confirm-revoke-other-sessions="revokeOtherSessions"
                    @confirm-revoke-all-sessions="revokeAllSessions"
                />
            </div>
        </div>
        <!-- Toast -->
        <Toast />
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import TwoFactorPanel from '@/components/security/two-factor-panel.vue'
import SessionTable from '@/components/security/session-table.vue'
import { useSecuritySettings } from '@/composables/use-security-settings'

const {
    userSession,

    // 2FA State
    showTotpSetup,
    showBackupCodes,
    qrCodeUrl,
    verificationCode,
    backupCodes,
    password,
    showPasswordDialog,
    passwordDialogMode,

    // 2FA Actions
    onPasswordDialogHide,
    onPasswordConfirm,
    enable2FA,
    disable2FA,
    verifyAndEnable2FA,
    copyBackupCodes,
    downloadBackupCodes,
    finishSetup,

    // Session State
    sessionList,
    showRevokeSessionConfirm,
    showRevokeOtherSessionsConfirm,
    showRevokeAllSessionsConfirm,

    // Session Actions
    confirmRevokeSession,
    revokeSingleSession,
    confirmRevokeOtherSessions,
    revokeOtherSessions,
    confirmRevokeAllSessions,
    revokeAllSessions,
    goProfile,
} = useSecuritySettings()
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
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    .btn-link {
        max-width: 180px;
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
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    .btn-link {
        max-width: 180px;
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

    .btn {
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
