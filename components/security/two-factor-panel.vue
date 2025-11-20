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
            <Message severity="warn" icon="mdi mdi-shield-alert">
                <span>建议启用双因素认证以提高账号安全性</span>
            </Message>
            <div class="security-actions">
                <Button
                    class="btn btn-primary"
                    label="启用双因素认证"
                    icon="mdi mdi-shield-check-outline"
                    @click="$emit('enable')"
                />
            </div>
        </div>

        <!-- 已启用状态 -->
        <div v-if="userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
            <Message severity="success" icon="mdi mdi-shield-check">
                <span>已启用双因素认证，您的账号受到更好的保护</span>
            </Message>
            <div class="security-actions">
                <Button
                    class="btn btn-danger"
                    label="禁用双因素认证"
                    icon="mdi mdi-shield-off-outline"
                    severity="danger"
                    @click="$emit('disable')"
                />
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
                <span class="p-float-label">
                    <InputText
                        id="verification-code"
                        :model-value="verificationCode"
                        class="w-full"
                        maxlength="6"
                        @update:model-value="(val) => $emit('update:verificationCode', val as string)"
                    />
                    <label for="verification-code">输入 6 位验证码</label>
                </span>
            </div>

            <div class="security-actions">
                <Button
                    label="验证并继续"
                    icon="mdi mdi-check"
                    @click="$emit('verify')"
                />
            </div>
        </div>

        <!-- 备份恢复码 -->
        <div v-if="showBackupCodes" class="backup-codes">
            <h4 class="backup-title mb-3">
                备份恢复码
            </h4>
            <Message severity="info" icon="mdi mdi-information">
                <span>请妥善保管以下恢复码，当您无法访问验证器时，可使用这些恢复码登录。每个恢复码只能使用一次。</span>
            </Message>

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
                <Button
                    label="复制恢复码"
                    icon="mdi mdi-content-copy"
                    class="mr-2"
                    @click="$emit('copyBackupCodes')"
                />
                <Button
                    label="下载恢复码"
                    icon="mdi mdi-download"
                    class="mr-2"
                    @click="$emit('downloadBackupCodes')"
                />
                <Button
                    label="完成设置"
                    icon="mdi mdi-check"
                    @click="$emit('finishSetup')"
                />
            </div>
        </div>

        <!-- 双因素认证密码确认对话框 -->
        <Dialog
            :visible="showPasswordDialog"
            modal
            :header="passwordDialogMode === 'enable' ? '启用双因素认证' : '禁用双因素认证'"
            :closable="true"
            :style="{width: '450px'}"
            @update:visible="$emit('update:showPasswordDialog', $event)"
            @hide="$emit('passwordDialogHide')"
        >
            <div class="p-fluid">
                <p class="mb-3">
                    {{ passwordDialogMode === 'enable'
                        ? '为了确保是您本人操作，请输入密码以启用双因素认证'
                        : '为了确保是您本人操作，请输入密码以禁用双因素认证' }}
                </p>
                <div class="field">
                    <Password
                        :model-value="password"
                        :feedback="false"
                        :toggle-mask="true"
                        placeholder="请输入密码"
                        @update:model-value="$emit('update:password', $event)"
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    label="取消"
                    severity="secondary"
                    @click="$emit('update:showPasswordDialog', false)"
                />
                <Button label="确认" @click="$emit('passwordConfirm')" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'

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
