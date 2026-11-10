<template>
    <div class="security-section">
        <h3 class="section-title">
            双因素认证
        </h3>
        <p class="section-desc">
            启用双因素认证后，登录时除了密码外，还需要输入身份验证器生成的验证码，可以有效防止账号被盗。
        </p>

        <!-- 未启用状态 -->
        <div v-if="!userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
            <CaomeiMessage tone="warning">
                <span>建议启用双因素认证以提高账号安全性</span>
            </CaomeiMessage>
            <div class="security-actions">
                <CaomeiButton
                    class="btn btn-primary"
                    @click="$emit('enable')"
                >
                    <template #icon>
                        <i class="mdi mdi-shield-check-outline" />
                    </template>
                    启用双因素认证
                </CaomeiButton>
            </div>
        </div>

        <!-- 已启用状态 -->
        <div v-if="userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
            <CaomeiMessage tone="success">
                <span>已启用双因素认证，您的账号受到更好的保护</span>
            </CaomeiMessage>
            <div class="security-actions">
                <CaomeiButton
                    class="btn btn-danger"
                    tone="danger"
                    @click="$emit('disable')"
                >
                    <template #icon>
                        <i class="mdi mdi-shield-off-outline" />
                    </template>
                    禁用双因素认证
                </CaomeiButton>
            </div>
        </div>

        <!-- 设置双因素验证器 -->
        <div v-if="showTotpSetup" class="totp-setup">
            <h4 class="mb-3 setup-title">
                设置身份验证器
            </h4>
            <ol class="mb-4 setup-steps">
                <li>在手机上安装身份验证器应用（如 Google Authenticator、Microsoft Authenticator）</li>
                <li>使用应用扫描下方二维码</li>
                <li>输入应用显示的 6 位验证码</li>
            </ol>

            <div v-if="qrCodeUrl" class="mb-4 qr-code">
                <img :src="qrCodeUrl" alt="TOTP QR Code">
            </div>

            <div class="mb-4 verification-input">
                <BaseInputV2
                    id="verification-code"
                    :model-value="verificationCode"
                    label="输入 6 位验证码"
                    maxlength="6"
                    @update:model-value="(val) => $emit('update:verificationCode', val)"
                />
            </div>

            <div class="security-actions">
                <CaomeiButton @click="$emit('verify')">
                    <template #icon>
                        <i class="mdi mdi-check" />
                    </template>
                    验证并继续
                </CaomeiButton>
            </div>
        </div>

        <!-- 备份恢复码 -->
        <div v-if="showBackupCodes" class="backup-codes">
            <h4 class="backup-title mb-3">
                备份恢复码
            </h4>
            <CaomeiMessage tone="primary">
                <span>请妥善保管以下恢复码，当您无法访问验证器时，可使用这些恢复码登录。每个恢复码只能使用一次。</span>
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
                    复制恢复码
                </CaomeiButton>
                <CaomeiButton
                    variant="secondary"
                    class="mr-2"
                    @click="$emit('downloadBackupCodes')"
                >
                    <template #icon>
                        <i class="mdi mdi-download" />
                    </template>
                    下载恢复码
                </CaomeiButton>
                <CaomeiButton @click="$emit('finishSetup')">
                    <template #icon>
                        <i class="mdi mdi-check" />
                    </template>
                    完成设置
                </CaomeiButton>
            </div>
        </div>

        <!-- 双因素认证密码确认对话框 -->
        <BaseDialogV2
            :visible="showPasswordDialog"
            :title="passwordDialogMode === 'enable' ? '启用双因素认证' : '禁用双因素认证'"
            @update:visible="$emit('update:showPasswordDialog', $event)"
            @hide="$emit('passwordDialogHide')"
        >
            <p class="mb-3">
                {{ passwordDialogMode === 'enable'
                    ? '为了确保是您本人操作，请输入密码以启用双因素认证'
                    : '为了确保是您本人操作，请输入密码以禁用双因素认证' }}
            </p>
            <BasePasswordV2
                id="security-password"
                :model-value="password"
                placeholder="请输入密码"
                :feedback="false"
                @update:model-value="$emit('update:password', $event)"
            />
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showPasswordDialog', false)"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton @click="$emit('passwordConfirm')">
                    确认
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script setup lang="ts">
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
}>()

defineEmits<{
    (e: 'enable'): void
    (e: 'disable'): void
    (e: 'verify'): void
    (e: 'copyBackupCodes'): void
    (e: 'downloadBackupCodes'): void
    (e: 'finishSetup'): void
    (e: 'passwordDialogHide'): void
    (e: 'passwordConfirm'): void
    (e: 'update:verificationCode', value: string): void
    (e: 'update:password', value: string): void
    (e: 'update:showPasswordDialog', value: boolean): void
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
