<template>
    <div class="auth-container">
        <AuthLeft :title="t('auth.forgot.heroTitle')" :subtitle="t('auth.forgot.heroSubtitle')" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    {{ t('auth.forgot.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('auth.forgot.subtitle') }}
                </p>
                <div class="forgot-btn mb-4">
                    <div class="card flex justify-center">
                        <CaomeiButtonGroup :group-label="t('auth.forgot.methodLabel')">
                            <BaseTooltip :content="t('auth.forgot.emailMethodTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'email'"
                                    @click="changeMode('email')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-email" />
                                    </template>
                                    {{ t('auth.forgot.methodEmail') }}
                                </CaomeiButton>
                            </BaseTooltip>
                            <BaseTooltip v-if="phoneEnabled" :content="t('auth.forgot.phoneMethodTip')">
                                <CaomeiButton
                                    :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                                    :aria-pressed="activeTab === 'phone'"
                                    @click="changeMode('phone')"
                                >
                                    <template #icon>
                                        <i class="mdi mdi-phone" />
                                    </template>
                                    {{ t('auth.forgot.methodPhone') }}
                                </CaomeiButton>
                            </BaseTooltip>
                        </CaomeiButtonGroup>
                    </div>
                </div>
                <!-- 邮箱找回密码表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseTooltip :content="t('auth.forgot.emailTip')">
                        <BaseInputV2
                            id="email"
                            v-model="email"
                            :label="t('auth.forgot.fieldEmail')"
                            :placeholder="t('auth.forgot.placeholderEmail')"
                            :error="errors.email"
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="t('auth.forgot.emailCodeTip')">
                        <BaseInputV2
                            id="emailCode"
                            v-model="emailCode"
                            :label="t('auth.forgot.fieldEmailCode')"
                            :placeholder="t('auth.forgot.placeholderEmailCode')"
                            :error="errors.emailCode"
                        >
                            <template #append>
                                <SendCodeButtonV2
                                    :on-send="sendEmailCode"
                                    :duration="60"
                                    :disabled="!canSendEmailCode"
                                    :loading="emailCodeSending"
                                />
                            </template>
                        </BaseInputV2>
                    </BaseTooltip>
                </div>
                <!-- 手机号找回密码表单 -->
                <div v-show="activeTab === 'phone'">
                    <BaseTooltip :content="t('auth.forgot.phoneTip')">
                        <BasePhoneInputV2
                            id="phone"
                            v-model="phone"
                            :label="t('auth.forgot.fieldPhone')"
                            :error="errors.phone"
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="t('auth.forgot.smsCodeTip')">
                        <BaseInputV2
                            id="phoneCode"
                            v-model="phoneCode"
                            :label="t('auth.forgot.fieldSmsCode')"
                            :placeholder="t('auth.forgot.placeholderSmsCode')"
                            :error="errors.phoneCode"
                        >
                            <template #append>
                                <SendCodeButtonV2
                                    :on-send="sendPhoneCode"
                                    :duration="60"
                                    :disabled="!canSendPhoneCode"
                                    :loading="phoneCodeSending"
                                />
                            </template>
                        </BaseInputV2>
                    </BaseTooltip>
                </div>
                <BaseTooltip :content="passwordHint">
                    <BasePasswordV2
                        id="newPassword"
                        v-model="newPassword"
                        :label="t('auth.forgot.fieldNewPassword')"
                        :placeholder="t('auth.forgot.placeholderNewPassword')"
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
                <BaseTooltip :content="t('auth.forgot.confirmTip')">
                    <BasePasswordV2
                        id="confirmPassword"
                        v-model="confirmPassword"
                        :label="t('auth.forgot.fieldConfirmPassword')"
                        :placeholder="t('auth.forgot.placeholderConfirmPassword')"
                        :feedback="false"
                        :error="errors.confirmPassword"
                    />
                </BaseTooltip>
                <Captcha ref="captcha" />
                <div class="form-group">
                    <BaseTooltip :content="t('auth.forgot.submitTip')">
                        <CaomeiButton
                            class="btn btn-primary mt-2"
                            block
                            @click="resetPassword"
                        >
                            {{ t('auth.forgot.submit') }}
                        </CaomeiButton>
                    </BaseTooltip>
                </div>
                <div class="toggle-login">
                    {{ t('auth.forgot.haveAccount') }} <NuxtLink
                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        {{ t('auth.forgot.loginNow') }}
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import AuthLeft from '@/components/auth-left.vue'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import PasswordStrength from '@/components/password-strength.vue'
import Captcha from '@/components/captcha.vue'
import { usePasswordHints } from '@/composables/utils/use-password-hints'
import { useForgotPasswordFlow } from '@/composables/use-forgot-password-flow'

const { t } = useI18n()
usePageMeta('auth.forgot.title', 'auth.forgot.subtitle')
const { requirementHint } = usePasswordHints()
const passwordHint = computed(() => requirementHint())

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
