<template>
    <div class="auth-container">
        <AuthLeft :title="t('auth.quickLogin.heroTitle')" :subtitle="t('auth.quickLogin.heroSubtitle')" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    {{ t('auth.quickLogin.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('auth.quickLogin.subtitle') }}
                </p>
                <!-- Tab切换 -->
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <CaomeiButtonGroup :group-label="t('auth.quickLogin.methodLabel')">
                            <BaseTooltip :content="t('auth.quickLogin.emailTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'email'"
                                    @click="changeTab('email')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-email" />
                                    </template>
                                    {{ t('auth.quickLogin.methodEmail') }}
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip v-if="phoneEnabled" :content="t('auth.quickLogin.phoneTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'phone'"
                                    @click="changeTab('phone')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-phone" />
                                    </template>
                                    {{ t('auth.quickLogin.methodPhone') }}
                                </CaomeiButton>
                            </BaseTooltip>
                        </CaomeiButtonGroup>
                    </div>
                </div>

                <!-- 邮箱验证码登录 -->
                <div v-show="activeTab === 'email'">
                    <BaseInputV2
                        id="email"
                        v-model="email"
                        :label="t('auth.quickLogin.fieldEmail')"
                        :placeholder="t('auth.quickLogin.placeholderEmail')"
                        :error="errors.email"
                    />

                    <BaseInputV2
                        id="emailCode"
                        v-model="emailCode"
                        :label="t('auth.quickLogin.fieldCode')"
                        :placeholder="t('auth.quickLogin.placeholderEmailCode')"
                        :error="errors.emailCode"
                        maxlength="6"
                        @input="handleEmailCodeInput"
                    >
                        <template #append>
                            <SendCodeButtonV2
                                :on-send="sendEmailVerificationCode"
                                :duration="60"
                                :disabled="!canSendEmailCode"
                                :loading="emailCodeSending"
                            />
                        </template>
                    </BaseInputV2>

                    <!-- 邮箱登录按钮 -->
                    <CaomeiButton
                        class="btn btn-primary"
                        block
                        :loading="isEmailLoggingIn"
                        @click="loginWithEmail"
                    >
                        {{ t('auth.quickLogin.loginEmail') }}
                    </CaomeiButton>
                </div>

                <!-- 手机验证码登录 -->
                <div v-show="activeTab === 'phone'">
                    <BasePhoneInputV2
                        id="phone"
                        v-model="phone"
                        :label="t('auth.quickLogin.fieldPhone')"
                        :error="errors.phone"
                    />

                    <BaseInputV2
                        id="phoneCode"
                        v-model="phoneCode"
                        :label="t('auth.quickLogin.fieldCode')"
                        :placeholder="t('auth.quickLogin.placeholderSmsCode')"
                        :error="errors.phoneCode"
                        maxlength="6"
                        @input="handlePhoneCodeInput"
                    >
                        <template #append>
                            <SendCodeButtonV2
                                :on-send="sendPhoneVerificationCode"
                                :duration="60"
                                :disabled="!canSendPhoneCode"
                                :loading="phoneCodeSending"
                            />
                        </template>
                    </BaseInputV2>

                    <!-- 手机登录按钮 -->
                    <CaomeiButton
                        class="btn btn-primary"
                        block
                        :loading="isPhoneLoggingIn"
                        @click="loginWithPhone"
                    >
                        {{ t('auth.quickLogin.loginPhone') }}
                    </CaomeiButton>
                </div>

                <Captcha ref="captcha" />
                <div v-if="errors.captcha" class="captcha-error error-message">
                    {{ errors.captcha }}
                </div>

                <!-- 其他登录方式 -->
                <div class="toggle-login">
                    <NuxtLink to="/login" class="toggle-link">
                        {{ t('auth.quickLogin.passwordLogin') }}
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink to="/register" class="toggle-link">
                        {{ t('auth.quickLogin.register') }}
                    </NuxtLink>
                </div>

                <!-- 用户协议 -->
                <div class="agreement-notice">
                    {{ t('auth.quickLogin.agreementPrefix') }}
                    <NuxtLink
                        to="/terms"
                        target="_blank"
                        class="agreement-link"
                    >
                        {{ t('auth.quickLogin.terms') }}
                    </NuxtLink>
                    {{ t('auth.quickLogin.agreementAnd') }}
                    <NuxtLink
                        to="/privacy"
                        target="_blank"
                        class="agreement-link"
                    >
                        {{ t('auth.quickLogin.privacy') }}
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import AuthLeft from '@/components/auth-left.vue'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import Captcha from '@/components/captcha.vue'
import { useQuickLoginFlow } from '@/composables/use-quick-login-flow'

const { t } = useI18n()
usePageMeta('auth.quickLogin.title', 'auth.quickLogin.subtitle')

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
</style>
