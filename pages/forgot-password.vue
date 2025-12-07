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
                        <ButtonGroup>
                            <Button
                                label="邮箱"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab!== 'email'}"
                                @click="changeMode('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                label="手机号"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab!== 'phone'}"
                                @click="changeMode('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <!-- 邮箱找回密码表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseInput
                        id="email"
                        v-model="email"
                        v-tooltip.top="'请输入注册时使用的邮箱地址'"
                        label="邮箱"
                        placeholder="请输入邮箱"
                        :error="errors.email"
                    />
                    <BaseInput
                        id="emailCode"
                        v-model="emailCode"
                        v-tooltip.top="'请输入发送到您邮箱的验证码'"
                        label="邮箱验证码"
                        placeholder="请输入邮箱验证码"
                        :error="errors.emailCode"
                    >
                        <template #append>
                            <SendCodeButton
                                v-tooltip.top="'点击获取验证码，验证码将发送到您输入的邮箱'"
                                :on-send="sendEmailCode"
                                :duration="60"
                                :disabled="!canSendEmailCode"
                                :loading="emailCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </template>
                    </BaseInput>
                </div>
                <!-- 手机号找回密码表单 -->
                <div v-show="activeTab === 'phone'">
                    <BasePhoneInput
                        id="phone"
                        v-model="phone"
                        v-tooltip.top="'请输入注册时使用的手机号'"
                        label="手机号"
                        :error="errors.phone"
                    />
                    <BaseInput
                        id="phoneCode"
                        v-model="phoneCode"
                        v-tooltip.top="'请输入发送到您手机的短信验证码'"
                        label="短信验证码"
                        placeholder="请输入短信验证码"
                        :error="errors.phoneCode"
                    >
                        <template #append>
                            <SendCodeButton
                                v-tooltip.top="'点击获取短信验证码，验证码将发送到您输入的手机号'"
                                :on-send="sendPhoneCode"
                                :duration="60"
                                :disabled="!canSendPhoneCode"
                                :loading="phoneCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </template>
                    </BaseInput>
                </div>
                <BasePassword
                    id="newPassword"
                    v-model="newPassword"
                    v-tooltip.top="getPasswordRequirementsShort()"
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
                </BasePassword>
                <BasePassword
                    id="confirmPassword"
                    v-model="confirmPassword"
                    v-tooltip.top="'请再次输入相同的新密码以确认'"
                    label="确认新密码"
                    placeholder="请再次输入新密码"
                    :feedback="false"
                    :error="errors.confirmPassword"
                />
                <Captcha ref="captcha" />
                <div class="form-group">
                    <Button
                        v-tooltip.top="'点击提交信息重置密码'"
                        class="btn btn-primary mt-2"
                        label="重置密码"

                        @click="resetPassword"
                    />
                </div>
                <div class="toggle-login">
                    已有账号？ <NuxtLink

                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        立即登录
                    </nuxtlink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import AuthLeft from '@/components/auth-left.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import PasswordStrength from '@/components/password-strength.vue'
import Captcha from '@/components/captcha.vue'
import { getPasswordRequirementsShort } from '@/utils/password'
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

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: $background-light;
    border: 1px solid $secondary-bg;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgb(230 57 70 / 0.2);
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

.p-password {
    width: 100%;
    padding: 0;
}

// 深色主题下的忘记密码页面优化
@include auth-page-dark-theme;
</style>
