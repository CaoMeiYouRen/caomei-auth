<template>
    <div class="auth-container">
        <AuthLeft title="找回密码" subtitle="通过邮箱或手机号重置密码。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    找回密码
                </h2>
                <p class="auth-subtitle">
                    请输入相关信息以重置密码
                </p>
                <div class="forgot-btn mb-4">
                    <div class="card flex justify-center">
                        <CaomeiButtonGroup group-label="找回密码方式">
                            <BaseTooltip :content="'使用邮箱找回密码'">
                                <CaomeiButton
                                    :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'email'"
                                    @click="changeMode('email')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-email" />
                                    </template>
                                    邮箱
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip v-if="phoneEnabled" :content="'使用手机号找回密码'">
                                <CaomeiButton
                                    :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'phone'"
                                    @click="changeMode('phone')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-phone" />
                                    </template>
                                    手机号
                                </CaomeiButton>
                            </BaseTooltip>
                        </CaomeiButtonGroup>
                    </div>
                </div>
                <!-- 邮箱找回密码表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseTooltip :content="'请输入注册时使用的邮箱地址'">
                        <BaseInputV2
                            id="email"
                            v-model="email"
                            label="邮箱"
                            placeholder="请输入邮箱"
                            :error="errors.email"
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="'请输入发送到您邮箱的验证码'">
                        <BaseInputV2
                            id="emailCode"
                            v-model="emailCode"
                            label="邮箱验证码"
                            placeholder="请输入邮箱验证码"
                            :error="errors.emailCode"
                        >
                            <template #append>
                                <SendCodeButtonV2
                                    :on-send="sendEmailCode"
                                    :duration="60"
                                    :disabled="!canSendEmailCode"
                                    :loading="emailCodeSending"
                                    text="获取验证码"
                                    resend-text="重新发送"
                                />
                            </template>
                        </BaseInputV2>
                    </BaseTooltip>
                </div>
                <!-- 手机号找回密码表单 -->
                <div v-show="activeTab === 'phone'">
                    <BaseTooltip :content="'请输入注册时使用的手机号'">
                        <BasePhoneInputV2
                            id="phone"
                            v-model="phone"
                            label="手机号"
                            :error="errors.phone"
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="'请输入发送到您手机的短信验证码'">
                        <BaseInputV2
                            id="phoneCode"
                            v-model="phoneCode"
                            label="短信验证码"
                            placeholder="请输入短信验证码"
                            :error="errors.phoneCode"
                        >
                            <template #append>
                                <SendCodeButtonV2
                                    :on-send="sendPhoneCode"
                                    :duration="60"
                                    :disabled="!canSendPhoneCode"
                                    :loading="phoneCodeSending"
                                    text="获取验证码"
                                    resend-text="重新发送"
                                />
                            </template>
                        </BaseInputV2>
                    </BaseTooltip>
                </div>
                <BaseTooltip :content="getPasswordRequirementsShort()">
                    <BasePasswordV2
                        id="newPassword"
                        v-model="newPassword"
                        label="新密码"
                        placeholder="请输入新密码"
                        :feedback="false"
                        :error="errors.newPassword"
                    >
                        <template #append>
                            <PasswordStrength
                                :show-strength="!!newPassword"
                                :password="newPassword"
                                :show-score="false"
                                :min-length-for-display="1"
                            />
                        </template>
                    </BasePasswordV2>
                </BaseTooltip>
                <BaseTooltip :content="'请再次输入相同的新密码以确认'">
                    <BasePasswordV2
                        id="confirmPassword"
                        v-model="confirmPassword"
                        label="确认新密码"
                        placeholder="请再次输入新密码"
                        :feedback="false"
                        :error="errors.confirmPassword"
                    />
                </BaseTooltip>
                <Captcha ref="captcha" />
                <div class="form-group">
                    <BaseTooltip :content="'点击提交信息重置密码'">
                        <CaomeiButton
                            class="btn btn-primary mt-2"
                            block
                            @click="resetPassword"
                        >
                            重置密码
                        </CaomeiButton>
                    </BaseTooltip>
                </div>
                <div class="toggle-login">
                    已有账号？ <NuxtLink
                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        立即登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import AuthLeft from '@/components/auth-left.vue'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import PasswordStrength from '@/components/password-strength.vue'
import Captcha from '@/components/captcha.vue'
import { getPasswordRequirementsShort } from '@/utils/shared/password'
import { useForgotPasswordFlow } from '@/composables/use-forgot-password-flow'

const {
    email,
    phone,
    emailCode,
    phoneCode,
    newPassword,
    confirmPassword,
    errors,
    activeTab,
    captcha,
    emailCodeSending,
    phoneCodeSending,
    phoneEnabled,
    canSendEmailCode,
    canSendPhoneCode,
    sendEmailCode,
    sendPhoneCode,
    changeMode,
    resetPassword,
} = useForgotPasswordFlow()
</script>

<style scoped lang="scss">

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 20vh;
    padding: 1rem;
    color: $background-light;
    text-align: center;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;

        .auth-logo img {
            width: 25%;
            max-width: none;
        }
    }
}

.auth-right {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 1rem;

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.05);
}

.auth-title {
    margin-bottom: 1rem;
    color: $secondary;
    font-weight: 600;
    font-size: 2rem;
}

.auth-subtitle {
    margin-bottom: 2rem;
    color: $secondary-light;
}

.form-group {
    margin-bottom: 1.5rem;
}

.forgot-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
    border-radius: 8px;
}

.btn-primary {
    width: 100%;
    min-height: 44px;
    color: $background-light !important;
    background-color: $primary !important;
    border: none !important;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.toggle-login {
    margin-top: 1.5rem;
    color: $secondary-light;
    text-align: center;
}

.toggle-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

.choose-way {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}

// 深色主题下的忘记密码页面优化
@include auth-page-dark-theme;
</style>
