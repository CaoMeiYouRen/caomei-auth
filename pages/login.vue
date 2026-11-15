<template>
    <div class="auth-container">
        <AuthLeft :title="t('auth.login.heroTitle')" :subtitle="t('auth.login.heroSubtitle')" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    {{ t('auth.login.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('auth.login.subtitle') }}
                </p>
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <CaomeiButtonGroup :group-label="t('auth.login.methodLabel')">
                            <BaseTooltip v-if="usernameEnabled" :content="t('auth.login.methodUsernameTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'username' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'username'"
                                    @click="changeMode('username')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-account" />
                                    </template>
                                    {{ t('auth.login.methodUsername') }}
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip :content="t('auth.login.methodEmailTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'email'"
                                    @click="changeMode('email')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-email" />
                                    </template>
                                    {{ t('auth.login.methodEmail') }}
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip v-if="phoneEnabled" :content="t('auth.login.methodPhoneTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'phone'"
                                    @click="changeMode('phone')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-phone" />
                                    </template>
                                    {{ t('auth.login.methodPhone') }}
                                </CaomeiButton>
                            </BaseTooltip>
                        </CaomeiButtonGroup>
                    </div>
                </div>
                <div v-show="activeTab === 'email'">
                    <BaseInputV2
                        id="email"
                        v-model="email"
                        :label="t('auth.login.fieldEmail')"
                        :placeholder="t('auth.login.placeholderEmail')"
                        :error="errors.email"
                    />
                    <div class="form-group">
                        <template v-if="!emailUseCode">
                            <BasePasswordV2
                                id="emailPassword"
                                v-model="emailPassword"
                                :label="t('auth.login.fieldPassword')"
                                :placeholder="t('auth.login.placeholderPassword')"
                                :error="errors.emailPassword"
                                :feedback="false"
                            />
                        </template>
                        <template v-else>
                            <BaseInputV2
                                id="emailCode"
                                v-model="emailCode"
                                :label="t('auth.login.fieldEmailCode')"
                                :placeholder="t('auth.login.placeholderEmailCode')"
                                :error="errors.emailCode"
                            >
                                <template #append>
                                    <SendCodeButtonV2
                                        :on-send="sendEmailCode"
                                        :duration="60"
                                        :disabled="emailCodeSending || !validateEmail(email)"
                                        :loading="emailCodeSending"
                                    />
                                </template>
                            </BaseInputV2>
                        </template>
                        <CaomeiButton
                            class="switch-btn"
                            variant="ghost"
                            block
                            @click="emailUseCode = !emailUseCode"
                        >
                            {{ emailUseCode ? t('auth.login.switchToPassword') : t('auth.login.switchToCode') }}
                        </CaomeiButton>
                    </div>
                </div>
                <!-- 用户名登录表单 -->
                <div v-show="activeTab === 'username'">
                    <BaseInputV2
                        id="username"
                        v-model="username"
                        :label="t('auth.login.fieldUsername')"
                        :placeholder="t('auth.login.placeholderUsername')"
                        :error="errors.username"
                    />
                    <BasePasswordV2
                        id="usernamePassword"
                        v-model="usernamePassword"
                        :label="t('auth.login.fieldPassword')"
                        :placeholder="t('auth.login.placeholderPassword')"
                        :error="errors.usernamePassword"
                        :feedback="false"
                    />
                </div>
                <!-- 手机号登录表单 -->
                <div v-show="activeTab === 'phone'">
                    <BasePhoneInputV2
                        id="phone"
                        v-model="phone"
                        :label="t('auth.login.fieldPhone')"
                        :error="errors.phone"
                    />
                    <div class="form-group">
                        <template v-if="!phoneUseCode">
                            <BasePasswordV2
                                id="phonePassword"
                                v-model="phonePassword"
                                :label="t('auth.login.fieldPassword')"
                                :placeholder="t('auth.login.placeholderPassword')"
                                :error="errors.phonePassword"
                                :feedback="false"
                            />
                        </template>
                        <template v-else>
                            <BaseInputV2
                                id="phoneCode"
                                v-model="phoneCode"
                                :label="t('auth.login.fieldSmsCode')"
                                :placeholder="t('auth.login.placeholderSmsCode')"
                                :error="errors.phoneCode"
                            >
                                <template #append>
                                    <SendCodeButtonV2
                                        :on-send="sendPhoneCode"
                                        :duration="60"
                                        :disabled="phoneCodeSending || !validatePhone(phone)"
                                        :loading="phoneCodeSending"
                                    />
                                </template>
                            </BaseInputV2>
                        </template>
                        <CaomeiButton
                            class="switch-btn"
                            variant="ghost"
                            block
                            @click="phoneUseCode = !phoneUseCode"
                        >
                            {{ phoneUseCode ? t('auth.login.switchToPassword') : t('auth.login.switchToCode') }}
                        </CaomeiButton>
                    </div>
                </div>
                <div class="remember-me">
                    <BaseTooltip :content="t('auth.login.rememberTip')">
                        <CaomeiCheckbox
                            id="remember"
                            v-model="rememberMe"
                            :text="t('auth.login.remember')"
                        />
                    </BaseTooltip>
                </div>
                <Captcha v-show="(activeTab === 'email' && emailUseCode) || (activeTab === 'phone' && phoneUseCode)" ref="captcha" />
                <div v-if="errors.captcha" class="captcha-error error-message">
                    {{ errors.captcha }}
                </div>
                <CaomeiButton
                    class="btn btn-primary"
                    block
                    @click="login"
                >
                    {{ t('auth.login.submit') }}
                </CaomeiButton>

                <!-- 用户协议提示 -->
                <div class="agreement-notice">
                    {{ t('auth.login.agreementPrefix') }}
                    <NuxtLink
                        to="/terms"
                        target="_blank"
                        class="agreement-link"
                    >
                        {{ t('auth.login.terms') }}
                    </NuxtLink>
                    {{ t('auth.login.agreementAnd') }}
                    <NuxtLink
                        to="/privacy"
                        target="_blank"
                        class="agreement-link"
                    >
                        {{ t('auth.login.privacy') }}
                    </NuxtLink>
                </div>

                <template v-if="socialProviders.length">
                    <BaseTooltip :content="t('auth.login.socialTip')">
                        <div class="separator">
                            {{ t('auth.login.socialDivider') }}
                        </div>
                    </BaseTooltip>
                    <div class="social-login">
                        <BaseTooltip
                            v-for="provider in socialProviders"
                            :key="provider.provider"
                            :content="provider.tooltip"
                        >
                            <CaomeiButton
                                class="social-btn"
                                :style="{'--social-color': provider.color, '--social-color-dark': provider.colorDark}"
                                variant="secondary"
                                @click="loginWithSocial(provider)"
                            >
                                <template #icon>
                                    <i :class="provider.icon || `mdi mdi-${provider.provider}`" />
                                </template>
                                {{ provider.label || t('auth.login.socialButton', {name: provider.name}) }}
                            </CaomeiButton>
                        </BaseTooltip>
                    </div>
                </template>
                <div class="toggle-login">
                    {{ t('auth.login.noAccount') }} <NuxtLink :to="`/register?mode=${activeTab}`" class="toggle-link">
                        {{ t('auth.login.registerNow') }}
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink :to="`/forgot-password?mode=${activeTab}`" class="toggle-link">
                        {{ t('auth.login.forgotPassword') }}
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- 双因素认证对话框 -->
        <CaomeiDialog
            v-model:open="show2FADialog"
            :closable="false"
            :close-on-overlay="false"
            size="md"
            :title="t('auth.login.twoFactor.title')"
        >
            <div>
                <CaomeiTabs v-model="activeAuthTab" :unmount-on-hide="false">
                    <CaomeiTabList>
                        <CaomeiTabTrigger :value="0">
                            {{ t('auth.login.twoFactor.tabAuthenticator') }}
                        </CaomeiTabTrigger>
                        <CaomeiTabTrigger :value="1">
                            {{ t('auth.login.twoFactor.tabOtp') }}
                        </CaomeiTabTrigger>
                        <CaomeiTabTrigger :value="2">
                            {{ t('auth.login.twoFactor.tabBackup') }}
                        </CaomeiTabTrigger>
                    </CaomeiTabList>
                    <CaomeiTabContent :value="0">
                        <p class="mb-3">
                            {{ t('auth.login.twoFactor.authenticatorHint') }}
                        </p>
                        <div class="field">
                            <CaomeiInput
                                v-model="twoFactorCode"
                                class="w-full"
                                :aria-label="t('auth.login.twoFactor.authenticatorLabel')"
                                :placeholder="t('auth.login.twoFactor.codePlaceholder')"
                                @enter="verify2FA"
                            />
                        </div>
                    </CaomeiTabContent>
                    <CaomeiTabContent :value="1">
                        <p class="mb-3">
                            {{ t('auth.login.twoFactor.otpHint1') }}<br>
                            {{ t('auth.login.twoFactor.otpHint2') }}
                        </p>
                        <div class="field">
                            <div class="code-row">
                                <BaseTooltip :content="t('auth.login.twoFactor.otpTip')">
                                    <CaomeiInput
                                        v-model="twoFactorCode"
                                        class="w-full"
                                        :aria-label="t('auth.login.twoFactor.otpLabel')"
                                        :placeholder="t('auth.login.twoFactor.codePlaceholder')"
                                        @enter="verify2FA"
                                    />
                                </BaseTooltip>
                                <SendCodeButtonV2
                                    :disabled="otpSending"
                                    :loading="otpSending"
                                    :on-send="sendOtp"
                                    :duration="60"
                                />
                            </div>
                        </div>
                    </CaomeiTabContent>
                    <CaomeiTabContent :value="2">
                        <p class="mb-3">
                            {{ t('auth.login.twoFactor.backupHint') }}
                        </p>
                        <div class="field">
                            <BaseTooltip :content="t('auth.login.twoFactor.backupTip')">
                                <CaomeiInput
                                    v-model="twoFactorCode"
                                    class="w-full"
                                    :aria-label="t('auth.login.twoFactor.backupLabel')"
                                    :placeholder="t('auth.login.twoFactor.backupPlaceholder')"
                                    @enter="verify2FA"
                                />
                            </BaseTooltip>
                        </div>
                    </CaomeiTabContent>
                </CaomeiTabs>
                <div v-if="twoFactorError" class="error-message mt-2">
                    {{ twoFactorError }}
                </div>
            </div>
            <template #footer>
                <CaomeiButton
                    :loading="verifying2FA"
                    @click="verify2FA"
                >
                    {{ t('auth.login.twoFactor.verify') }}
                </CaomeiButton>
            </template>
        </CaomeiDialog>
    </div>
</template>

<script lang="ts" setup>
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import AuthLeft from '@/components/auth-left.vue'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import Captcha from '@/components/captcha.vue'
import { useLoginFlow } from '@/composables/use-login-flow'

const { t } = useI18n()
usePageMeta('auth.login.title', 'auth.login.subtitle')

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

// 社交按钮品牌色：按 CSS 变量切换，避免 SSR 依赖系统主题
.social-btn {
    color: var(--social-color);
}

:global(.dark) .social-btn {
    color: var(--social-color-dark, var(--social-color));
}

// 添加媒体查询优化小屏幕显示
@media (width <= 375px) {
    .login-btn :deep(.caomei-button) {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
    }
}

@media (width <= 320px) {
    .login-btn :deep(.caomei-button) {
        padding: 0.5rem;
        font-size: 0.75rem;
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

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
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
