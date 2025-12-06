<template>
    <div class="auth-container">
        <AuthLeft title="登录到草梅 Auth" subtitle="多方式登录，安全便捷。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    欢迎回来
                </h2>
                <p class="auth-subtitle">
                    请使用您的账号信息登录
                </p>
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                v-if="usernameEnabled"
                                v-tooltip.top="'使用用户名登录'"
                                label="用户名"
                                icon="mdi mdi-account"
                                :class="{'p-button-outlined': activeTab !== 'username'}"
                                @click="changeMode('username')"
                            />
                            <Button
                                v-tooltip.top="'使用邮箱登录'"
                                label="邮箱"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab !== 'email'}"
                                @click="changeMode('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                v-tooltip.top="'使用手机号登录'"
                                label="手机号"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab !== 'phone'}"
                                @click="changeMode('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <!-- 邮箱登录表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseInput
                        id="email"
                        v-model="email"
                        label="邮箱"
                        placeholder="example@mail.com"
                        :error="errors.email"
                    />
                    <div class="form-group">
                        <template v-if="!emailUseCode">
                            <BasePassword
                                id="emailPassword"
                                v-model="emailPassword"
                                label="密码"
                                placeholder="请输入密码"
                                :error="errors.emailPassword"
                                :feedback="false"
                                toggle-mask
                            />
                        </template>
                        <template v-else>
                            <BaseInput
                                id="emailCode"
                                v-model="emailCode"
                                label="验证码"
                                placeholder="请输入邮箱验证码"
                                :error="errors.emailCode"
                            >
                                <template #append>
                                    <SendCodeButton
                                        :on-send="sendEmailCode"
                                        :duration="60"
                                        :disabled="emailCodeSending || !validateEmail(email)"
                                        :loading="emailCodeSending"
                                        text="获取验证码"
                                        resend-text="重新发送"
                                    />
                                </template>
                            </BaseInput>
                        </template>
                        <Button
                            class="switch-btn"
                            text
                            :label="emailUseCode ? '使用密码登录' : '使用验证码登录'"
                            @click="emailUseCode = !emailUseCode"
                        />
                    </div>
                </div>
                <!-- 用户名登录表单 -->
                <div v-show="activeTab === 'username'">
                    <BaseInput
                        id="username"
                        v-model="username"
                        label="用户名"
                        placeholder="请输入用户名"
                        :error="errors.username"
                    />
                    <BasePassword
                        id="usernamePassword"
                        v-model="usernamePassword"
                        label="密码"
                        placeholder="请输入密码"
                        :error="errors.usernamePassword"
                        :feedback="false"
                        toggle-mask
                    />
                </div>
                <!-- 手机号登录表单 -->
                <div v-show="activeTab === 'phone'">
                    <BasePhoneInput
                        id="phone"
                        v-model="phone"
                        label="手机号"
                        :error="errors.phone"
                    />
                    <div class="form-group">
                        <template v-if="!phoneUseCode">
                            <BasePassword
                                id="phonePassword"
                                v-model="phonePassword"
                                label="密码"
                                placeholder="请输入密码"
                                :error="errors.phonePassword"
                                :feedback="false"
                                toggle-mask
                            />
                        </template>
                        <template v-else>
                            <BaseInput
                                id="phoneCode"
                                v-model="phoneCode"
                                label="验证码"
                                placeholder="请输入短信验证码"
                                :error="errors.phoneCode"
                            >
                                <template #append>
                                    <SendCodeButton
                                        :on-send="sendPhoneCode"
                                        :duration="60"
                                        :disabled="phoneCodeSending || !validatePhone(phone)"
                                        :loading="phoneCodeSending"
                                        text="获取验证码"
                                        resend-text="重新发送"
                                    />
                                </template>
                            </BaseInput>
                        </template>
                        <Button
                            class="switch-btn"
                            text
                            :label="phoneUseCode ? '使用密码登录' : '使用验证码登录'"
                            @click="phoneUseCode = !phoneUseCode"
                        />
                    </div>
                </div>
                <div v-tooltip.top="'勾选后下次登录将自动填充您的账号信息'" class="remember-me">
                    <Checkbox
                        v-model="rememberMe"
                        input-id="remember"
                        binary
                    />
                    <label for="remember">记住我</label>
                </div>
                <Captcha v-show="(activeTab === 'email' && emailUseCode) || (activeTab === 'phone' && phoneUseCode)" ref="captcha" />
                <div v-if="errors.captcha" class="captcha-error error-message">
                    {{ errors.captcha }}
                </div>
                <Button
                    class="btn btn-primary"
                    label="登录"
                    @click="login"
                />

                <!-- 用户协议提示 -->
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

                <template v-if="socialProviders.length">
                    <div v-tooltip.top="'如果第三方账号未在本站注册，将会注册新的账号'" class="separator">
                        或者使用以下方式登录
                    </div>
                    <div class="social-login">
                        <Button
                            v-for="provider in socialProviders"
                            :key="provider.provider"
                            v-tooltip.top="provider.tooltip"
                            class="social-btn"
                            :style="{color: provider.color}"
                            :icon="provider.icon || `mdi mdi-${provider.provider}`"
                            :label="provider.label || `使用 ${provider.name} 账号登录`"
                            outlined
                            @click="loginWithSocial(provider)"
                        />
                    </div>
                </template>
                <div class="toggle-login">
                    还没有账号？ <NuxtLink :to="`/register?mode=${activeTab}`" class="toggle-link">
                        立即注册
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink :to="`/forgot-password?mode=${activeTab}`" class="toggle-link">
                        忘记密码？
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- 双因素认证对话框 -->
        <Dialog
            v-model:visible="show2FADialog"
            modal
            :closable="false"
            :style="{width: '450px'}"
            header="双因素认证"
        >
            <div class="p-fluid">
                <TabView v-model="activeAuthTab">
                    <TabPanel value="totp" header="身份验证器">
                        <p class="mb-3">
                            请输入身份验证器生成的 6 位验证码
                        </p>
                        <div class="field">
                            <InputText
                                v-model="twoFactorCode"
                                class="w-full"
                                placeholder="请输入验证码"
                                @keyup.enter="verify2FA"
                            />
                        </div>
                    </TabPanel>
                    <TabPanel value="otp" header="一次性验证码">
                        <p class="mb-3">
                            如果您无法访问身份验证器，可以使用一次性验证码验证身份。<br>
                            一次性验证码会发送到已验证的邮箱或手机号(邮箱优先)。
                        </p>
                        <div class="field">
                            <div class="code-row">
                                <InputText
                                    v-model="twoFactorCode"
                                    v-tooltip.top="'请输入一次性验证码'"
                                    class="w-full"
                                    placeholder="请输入验证码"
                                    @keyup.enter="verify2FA"
                                />
                                <SendCodeButton
                                    :disabled="otpSending"
                                    :loading="otpSending"
                                    :on-send="sendOtp"
                                    :duration="60"
                                    text="获取验证码"
                                    resend-text="重新发送"
                                />
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel value="backup" header="备份码">
                        <p class="mb-3">
                            如果您失去对手机或电子邮件的访问权限，可以使用备份码验证身份。
                        </p>
                        <div class="field">
                            <InputText
                                v-model="twoFactorCode"
                                v-tooltip.top="'请输入您的备份码'"
                                class="w-full"
                                placeholder="请输入备份码"
                                @keyup.enter="verify2FA"
                            />
                        </div>
                    </TabPanel>
                </TabView>
                <div v-if="twoFactorError" class="error-message mt-2">
                    {{ twoFactorError }}
                </div>
            </div>
            <template #footer>
                <Button
                    label="验证"
                    :loading="verifying2FA"
                    @click="verify2FA"
                />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script lang="ts" setup>
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'
import Captcha from '@/components/captcha.vue'
import { useLoginFlow } from '@/composables/use-login-flow'

const {
    activeTab,
    email,
    emailPassword,
    username,
    usernamePassword,
    phone,
    phonePassword,
    rememberMe,
    errors,
    emailUseCode,
    emailCode,
    emailCodeSending,
    phoneUseCode,
    phoneCode,
    phoneCodeSending,
    captcha,
    show2FADialog,
    twoFactorCode,
    twoFactorError,
    verifying2FA,
    activeAuthTab,
    otpSending,
    socialProviders,
    phoneEnabled,
    usernameEnabled,
    changeMode,
    sendOtp,
    verify2FA,
    login,
    loginWithSocial,
    sendEmailCode,
    sendPhoneCode,
    validateEmail,
    validatePhone,
} = useLoginFlow()
</script>

<style scoped lang="scss">

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

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
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
    box-shadow: 0 0 0 3px rgb(230 57 70 / 0.2); // 可考虑用rgba($primary, 0.2)如有mixin
}

.separator {
    display: flex;
    align-items: center;
    margin: 2rem 0;
    color: $secondary-light;

    &::before,
    &::after {
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
        content: "";
    }

    &::before {
        margin-right: 1rem;
    }

    &::after {
        margin-left: 1rem;
    }
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

.remember-me {
    display: flex;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
    color: $secondary-light;

    label {
        margin-left: 0.5rem;
        cursor: pointer;
    }
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

.p-password {
    width: 100%;
    padding: 0;
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

.switch-btn {
    width: 100%;
}

.agreement-notice {
    margin-top: 0.75rem;
    color: $secondary-light;
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: center;
}

.agreement-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

// 深色主题下的登录页面优化
@include auth-page-extended-dark-theme;

</style>
