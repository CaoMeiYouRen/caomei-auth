<template>
    <div class="security-section">
        <h3 class="section-title">
            {{ t('security.twoFactor.title') }}
        </h3>
        <p class="section-desc">
            {{ t('security.twoFactor.desc') }}
        </p>

        <!-- 未启用状态 -->
        <div v-if="!userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
            <CaomeiMessage tone="warning">
                <span>{{ t('security.twoFactor.recommend') }}</span>
            </CaomeiMessage>
            <div class="security-actions">
                <CaomeiButton
                    class="btn btn-primary"
                    @click="$emit('enable')"
                >
                    <template #icon>
                        <i class="mdi mdi-shield-check-outline" />
                    </template>
                    {{ t('security.twoFactor.enable') }}
                </CaomeiButton>
            </div>
        </div>

        <!-- 已启用状态 -->
        <div v-if="userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
            <CaomeiMessage tone="success">
                <span>{{ t('security.twoFactor.enabledNote') }}</span>
            </CaomeiMessage>
            <CaomeiMessage tone="primary" class="mt-2">
                <span>{{ t('security.twoFactor.lostAccessNotice') }}</span>
            </CaomeiMessage>
            <div class="security-actions">
                <CaomeiButton
                    variant="secondary"
                    class="btn"
                    @click="$emit('openBackupRegenerate')"
                >
                    <template #icon>
                        <i class="mdi mdi-refresh" />
                    </template>
                    {{ t('security.twoFactor.backupRegenerate') }}
                </CaomeiButton>
                <CaomeiButton
                    class="btn btn-danger"
                    tone="danger"
                    @click="$emit('disable')"
                >
                    <template #icon>
                        <i class="mdi mdi-shield-off-outline" />
                    </template>
                    {{ t('security.twoFactor.disable') }}
                </CaomeiButton>
            </div>
        </div>

        <!-- 重新生成备份码确认 -->
        <BaseDialogV2
            :visible="showBackupRegenerateDialog"
            :title="t('security.twoFactor.backupRegenerateTitle')"
            @update:visible="$emit('update:showBackupRegenerateDialog', $event)"
            @hide="$emit('backupRegenerateDialogHide')"
        >
            <p class="mb-3">
                {{ t('security.twoFactor.backupRegenerateTip') }}
            </p>
            <BasePasswordV2
                id="backup-regenerate-password"
                :model-value="password"
                :label="t('security.twoFactor.backupRegeneratePasswordLabel')"
                :placeholder="t('security.twoFactor.backupRegeneratePasswordPlaceholder')"
                :feedback="false"
                @update:model-value="$emit('update:password', $event)"
            />
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showBackupRegenerateDialog', false)"
                >
                    {{ t('security.sessions.cancel') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmBackupRegenerate')">
                    {{ t('security.twoFactor.backupRegenerate') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>

        <!-- 设置双因素验证器 -->
        <div v-if="showTotpSetup" class="totp-setup">
            <h4 class="mb-3 setup-title">
                {{ t('security.twoFactor.setupTitle') }}
            </h4>
            <ol class="mb-4 setup-steps">
                <li>{{ t('security.twoFactor.step1') }}</li>
                <li>{{ t('security.twoFactor.step2') }}</li>
                <li>{{ t('security.twoFactor.step3') }}</li>
            </ol>

            <div v-if="qrCodeUrl" class="mb-4 qr-code">
                <img :src="qrCodeUrl" :alt="t('security.twoFactor.qrAlt')">
            </div>

            <div class="mb-4 verification-input">
                <BaseInputV2
                    id="verification-code"
                    :model-value="verificationCode"
                    :label="t('security.twoFactor.codeLabel')"
                    maxlength="6"
                    @update:model-value="(val) => $emit('update:verificationCode', val)"
                />
            </div>

            <div class="security-actions">
                <CaomeiButton @click="$emit('verify')">
                    <template #icon>
                        <i class="mdi mdi-check" />
                    </template>
                    {{ t('security.twoFactor.verify') }}
                </CaomeiButton>
            </div>
        </div>

        <!-- 备份恢复码 -->
        <div v-if="showBackupCodes" class="backup-codes">
            <h4 class="backup-title mb-3">
                {{ t('security.twoFactor.backupTitle') }}
            </h4>
            <CaomeiMessage tone="primary">
                <span>{{ t('security.twoFactor.backupDesc') }}</span>
            </CaomeiMessage>
            <CaomeiMessage tone="warning">
                <span>{{ t('security.twoFactor.backupRegenerateHint') }}</span>
            </CaomeiMessage>

            <div class="backup-codes-list mb-4">
                <div
                    v-for="code in backupCodes"
                    :key="code"
                    class="backup-code"
                >
                    {{ code }}
                </div>
            </div>

            <div class="security-actions">
                <CaomeiButton
                    variant="secondary"
                    class="mr-2"
                    @click="$emit('copyBackupCodes')"
                >
                    <template #icon>
                        <i class="mdi mdi-content-copy" />
                    </template>
                    {{ t('security.twoFactor.copy') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="secondary"
                    class="mr-2"
                    @click="$emit('downloadBackupCodes')"
                >
                    <template #icon>
                        <i class="mdi mdi-download" />
                    </template>
                    {{ t('security.twoFactor.download') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('finishSetup')">
                    <template #icon>
                        <i class="mdi mdi-check" />
                    </template>
                    {{ t('security.twoFactor.finish') }}
                </CaomeiButton>
            </div>
        </div>

        <!-- 双因素认证密码确认对话框 -->
        <BaseDialogV2
            :visible="showPasswordDialog"
            :title="passwordDialogMode === 'enable' ? t('security.twoFactor.enableTitle') : t('security.twoFactor.disableTitle')"
            @update:visible="$emit('update:showPasswordDialog', $event)"
            @hide="$emit('passwordDialogHide')"
        >
            <p class="mb-3">
                {{ passwordDialogMode === 'enable'
                    ? t('security.twoFactor.enablePrompt')
                    : t('security.twoFactor.disablePrompt') }}
            </p>
            <BasePasswordV2
                id="security-password"
                :model-value="password"
                :placeholder="t('security.twoFactor.passwordPlaceholder')"
                :feedback="false"
                @update:model-value="$emit('update:password', $event)"
            />
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showPasswordDialog', false)"
                >
                    {{ t('security.sessions.cancel') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('passwordConfirm')">
                    {{ t('security.sessions.confirm') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineProps<{
    userSession: any
    showTotpSetup: boolean
    showBackupCodes: boolean
    qrCodeUrl: string
    verificationCode: string
    backupCodes: string[]
    password: string
    showPasswordDialog: boolean
    passwordDialogMode: 'enable' | 'disable'
    showBackupRegenerateDialog: boolean
}>()

defineEmits<{
    (e: 'enable'): void
    (e: 'disable'): void
    (e: 'verify'): void
    (e: 'openBackupRegenerate'): void
    (e: 'confirmBackupRegenerate'): void
    (e: 'backupRegenerateDialogHide'): void
    (e: 'copyBackupCodes'): void
    (e: 'downloadBackupCodes'): void
    (e: 'finishSetup'): void
    (e: 'passwordDialogHide'): void
    (e: 'passwordConfirm'): void
    (e: 'update:verificationCode', value: string): void
    (e: 'update:password', value: string): void
    (e: 'update:showPasswordDialog', value: boolean): void
    (e: 'update:showBackupRegenerateDialog', value: boolean): void
}>()
</script>

<style scoped lang="scss">
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
    .section-title {
        color: #{$primary-light} !important;
    }

    .section-desc {
        color: #{$dark-secondary-light} !important;
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
}
</style>
