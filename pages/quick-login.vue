<template>
    <div class="auth-container">
        <AuthLeft title="快速登录" subtitle="验证码快速登录，安全便捷。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    快速登录
                </h2>
                <p class="auth-subtitle">
                    使用验证码一键完成登录。未注册的账号将自动创建。
                </p>
                <!-- Tab切换 -->
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                label="邮箱验证码"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab !== 'email'}"
                                @click="changeTab('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                v-tooltip.top="'使用短信验证码登录'"
                                label="短信验证码"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab !== 'phone'}"
                                @click="changeTab('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>

                <!-- 邮箱验证码登录 -->
                <div v-show="activeTab === 'email'">
                    <BaseInput
                        id="email"
                        v-model="email"
                        label="邮箱地址"
                        placeholder="example@mail.com"
                        :error="errors.email"
                    />

                    <BaseInput
                        id="emailCode"
                        v-model="emailCode"
                        label="验证码"
                        placeholder="请输入邮箱验证码"
                        :error="errors.emailCode"
                        maxlength="6"
                        @input="handleEmailCodeInput"
                    >
                        <template #append>
                            <SendCodeButton
                                :on-send="sendEmailVerificationCode"
                                :duration="60"
                                :disabled="!canSendEmailCode"
                                :loading="emailCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </template>
                    </BaseInput>

                    <!-- 邮箱登录按钮 -->
                    <Button
                        class="btn btn-primary"
                        label="邮箱快速登录"
                        :loading="isEmailLoggingIn"
                        @click="loginWithEmail"
                    />
                </div>

                <!-- 手机验证码登录 -->
                <div v-show="activeTab === 'phone'">
                    <BasePhoneInput
                        id="phone"
                        v-model="phone"
                        label="手机号"
                        :error="errors.phone"
                    />

                    <BaseInput
                        id="phoneCode"
                        v-model="phoneCode"
                        label="验证码"
                        placeholder="请输入短信验证码"
                        :error="errors.phoneCode"
                        maxlength="6"
                        @input="handlePhoneCodeInput"
                    >
                        <template #append>
                            <SendCodeButton
                                :on-send="sendPhoneVerificationCode"
                                :duration="60"
                                :disabled="!canSendPhoneCode"
                                :loading="phoneCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </template>
                    </BaseInput>

                    <!-- 手机登录按钮 -->
                    <Button
                        class="btn btn-primary"
                        label="手机快速登录"
                        :loading="isPhoneLoggingIn"
                        @click="loginWithPhone"
                    />
                </div>

                <Captcha ref="captcha" />
                <div v-if="errors.captcha" class="captcha-error error-message">
                    {{ errors.captcha }}
                </div>

                <!-- 其他登录方式 -->
                <div class="toggle-login">
                    <NuxtLink to="/login" class="toggle-link">
                        使用密码登录
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink to="/register" class="toggle-link">
                        传统注册
                    </NuxtLink>
                </div>

                <!-- 用户协议 -->
                <div class="agreement-notice">
                    登录即表示您已阅读并同意
                    <NuxtLink
                        to="/terms"
                        target="_blank"
                        class="agreement-link"
                    >
                        《服务条款》
                    </NuxtLink>
                    和
                    <NuxtLink
                        to="/privacy"
                        target="_blank"
                        class="agreement-link"
                    >
                        《隐私政策》
                    </NuxtLink>
                </div>
            </div>
        </div>

        <Toast />
    </div>
</template>

<script lang="ts" setup>
import AuthLeft from '@/components/auth-left.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import Captcha from '@/components/captcha.vue'
import { useQuickLoginFlow } from '@/composables/use-quick-login-flow'

// SEO 设置
definePageMeta({
    title: '快速登录 - 草梅 Auth',
    description: '使用验证码一键完成登录注册，安全便捷',
})

const {
    activeTab,
    email,
    emailCode,
    isEmailLoggingIn,
    phone,
    phoneCode,
    isPhoneLoggingIn,
    errors,
    captcha,
    emailCodeSending,
    phoneCodeSending,
    phoneEnabled,
    canSendEmailCode,
    canSendPhoneCode,
    changeTab,
    sendEmailVerificationCode,
    sendPhoneVerificationCode,
    loginWithEmail,
    loginWithPhone,
    handleEmailCodeInput,
    handlePhoneCodeInput,
} = useQuickLoginFlow()
</script>

<style scoped lang="scss">

// 使用通用认证页面样式和暗色模式支持
@include auth-page-base-styles;
@include auth-page-extended-dark-theme;

.login-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

// 添加媒体查询优化小屏幕显示
@media (width <= 375px) {
    .login-btn .p-button {
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
    }
}

@media (width <= 320px) {
    .login-btn .p-button {
        padding: 0.5rem !important;
        font-size: 0.75rem !important;
    }
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem;
    font-size: 0.95rem;
}
</style>
