<template>
    <div class="auth-container">
        <AuthLeft :title="t('auth.register.heroTitle')" :subtitle="t('auth.register.heroSubtitle')" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    {{ t('auth.register.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('auth.register.subtitle') }}
                </p>
                <div class="card form-group">
                    <CaomeiButtonGroup :group-label="t('auth.register.methodLabel')">
                        <CaomeiButton
                            :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                            :aria-pressed="activeTab === 'email'"
                            @click="changeMode('email')"
                        >
                            <template #icon>
                                <i class="mdi mdi-email" />
                            </template>
                            {{ t('auth.register.methodEmail') }}
                        </CaomeiButton>
                        <BaseTooltip v-if="phoneEnabled" :content="t('auth.register.methodPhoneTip')">
                            <CaomeiButton
                                :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                                :aria-pressed="activeTab === 'phone'"
                                @click="changeMode('phone')"
                            >
                                <template #icon>
                                    <i class="mdi mdi-phone" />
                                </template>
                                {{ t('auth.register.methodPhone') }}
                            </CaomeiButton>
                        </BaseTooltip>
                    </CaomeiButtonGroup>
                </div>

                <!-- 邮箱注册表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseTooltip :content="t('auth.register.nicknameTip')">
                        <BaseInputV2
                            id="emailNickname"
                            v-model="nickname"
                            :label="t('auth.register.labelNickname')"
                            :placeholder="t('auth.register.placeholderNickname')"
                            :error="errors.nickname"
                            required
                        />
                    </BaseTooltip>
                    <div v-if="usernameEnabled">
                        <BaseTooltip :content="t('auth.register.usernameTip')">
                            <BaseInputV2
                                id="emailUsername"
                                v-model="username"
                                :label="t('auth.register.labelUsername')"
                                :placeholder="t('auth.register.placeholderUsername')"
                                :error="errors.username"
                                required
                            />
                        </BaseTooltip>
                    </div>
                    <BaseTooltip :content="t('auth.register.emailTip')">
                        <BaseInputV2
                            id="email"
                            v-model="email"
                            :label="t('auth.register.labelEmail')"
                            :placeholder="t('auth.register.placeholderEmail')"
                            :error="errors.email"
                            required
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="passwordHint">
                        <BasePasswordV2
                            id="password"
                            v-model="password"
                            :label="t('auth.register.labelPassword')"
                            :placeholder="t('auth.register.placeholderPassword')"
                            :error="errors.password"
                            required
                            :feedback="false"
                        >
                            <template #append>
                                <PasswordStrength
                                    :show-strength="!!password"
                                    :password="password"
                                    :show-score="false"
                                    :min-length-for-display="1"
                                />
                            </template>
                        </BasePasswordV2>
                    </BaseTooltip>
                    <BaseTooltip :content="t('auth.register.passwordConfirmTip')">
                        <BasePasswordV2
                            id="confirmPassword"
                            v-model="confirmPassword"
                            :label="t('auth.register.labelConfirmPassword')"
                            :placeholder="t('auth.register.placeholderConfirmPassword')"
                            :error="errors.confirmPassword"
                            required
                            :feedback="false"
                        />
                    </BaseTooltip>
                </div>

                <!-- 手机号注册表单 -->
                <div v-show="activeTab === 'phone'">
                    <BaseTooltip :content="t('auth.register.nicknameTipShort')">
                        <BaseInputV2
                            id="phoneNickname"
                            v-model="nickname"
                            :label="t('auth.register.labelNickname')"
                            :placeholder="t('auth.register.placeholderNickname')"
                            :error="errors.nickname"
                            required
                        />
                    </BaseTooltip>
                    <div v-if="usernameEnabled">
                        <BaseTooltip :content="t('auth.register.usernameTip')">
                            <BaseInputV2
                                id="phoneUsername"
                                v-model="username"
                                :label="t('auth.register.labelUsername')"
                                :placeholder="t('auth.register.placeholderUsername')"
                                :error="errors.username"
                                required
                            />
                        </BaseTooltip>
                    </div>
                    <BaseTooltip :content="t('auth.register.phoneTip')">
                        <BasePhoneInputV2
                            id="phone"
                            v-model="phone"
                            :label="t('auth.register.labelPhone')"
                            :error="errors.phone"
                            required
                        />
                    </BaseTooltip>
                    <BaseTooltip :content="t('auth.register.codeTip')">
                        <BaseInputV2
                            id="phoneCode"
                            v-model="phoneCode"
                            :label="t('auth.register.labelSmsCode')"
                            :placeholder="t('auth.register.placeholderSmsCode')"
                            :error="errors.phoneCode"
                            required
                        >
                            <template #append>
                                <BaseTooltip :content="t('auth.register.codeSendTip')">
                                    <SendCodeButtonV2
                                        :on-send="sendPhoneCode"
                                        :duration="60"
                                        :disabled="phoneCodeSending || !validatePhone(phone)"
                                        :loading="phoneCodeSending"
                                    />
                                </BaseTooltip>
                            </template>
                        </BaseInputV2>
                    </BaseTooltip>
                </div>

                <!-- 用户协议和隐私政策 -->
                <div class="agreement-section form-group">
                    <BaseTooltip :content="t('auth.register.agreementTip')">
                        <CaomeiCheckbox
                            id="agreement"
                            v-model="agreedToTerms"
                        >
                            <span class="checkbox-label">
                                {{ t('auth.register.agreementCheckbox') }}
                                <NuxtLink
                                    to="/terms"
                                    target="_blank"
                                    class="agreement-link"
                                    @click.stop
                                >
                                    {{ t('auth.register.terms') }}
                                </NuxtLink>
                                {{ t('auth.register.agreementAnd') }}
                                <NuxtLink
                                    to="/privacy"
                                    target="_blank"
                                    class="agreement-link"
                                    @click.stop
                                >
                                    {{ t('auth.register.privacy') }}
                                </NuxtLink>
                            </span>
                        </CaomeiCheckbox>
                    </BaseTooltip>
                    <CaomeiMessage
                        v-if="errors.agreement"
                        tone="danger"
                        variant="simple"
                        size="sm"
                        role="alert"
                    >
                        {{ errors.agreement }}
                    </CaomeiMessage>
                </div>

                <Captcha ref="captcha" />
                <CaomeiMessage
                    v-if="errors.captcha"
                    tone="danger"
                    variant="simple"
                    size="sm"
                    role="alert"
                >
                    {{ errors.captcha }}
                </CaomeiMessage>

                <CaomeiButton
                    class="btn btn-primary mt-2"
                    block
                    :loading="loading"
                    @click="register"
                >
                    {{ t('auth.register.submit') }}
                </CaomeiButton>
                <div class="toggle-login">
                    {{ t('auth.register.haveAccount') }} <NuxtLink
                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        {{ t('auth.register.loginNow') }}
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { validatePhone } from '@/utils/shared/validate'
import { usePasswordHints } from '@/composables/utils/use-password-hints'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import AuthLeft from '@/components/auth-left.vue'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import PasswordStrength from '@/components/password-strength.vue'
import Captcha from '@/components/captcha.vue'
import { useRegisterFlow } from '@/composables/use-register-flow'

const { t } = useI18n()
usePageMeta('auth.register.title', 'auth.register.subtitle')
const { requirementHint } = usePasswordHints()
const passwordHint = computed(() => requirementHint())

const {
    nickname,
    username,
    email,
    phone,
    phoneCode,
    password,
    confirmPassword,
    agreedToTerms,
    errors,
    loading,
    captcha,
    activeTab,
    phoneCodeSending,
    phoneEnabled,
    usernameEnabled,
    changeMode,
    sendPhoneCode,
    register,
} = useRegisterFlow()
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

    /* 右下角固定悬浮按钮横跨整个视口高度，只留底部空白挡不住首屏；内容右侧收 4rem 安全廊道 */
    @media (width <= 768px) {
        padding-right: 4rem;
    }
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

.card {
    display: flex;
    justify-content: center;
    width: 100%;
}

.toggle-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
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

.toggle-login {
    margin-top: 1em;
}

.agreement-section {
    margin-bottom: 1.2rem;
}

.checkbox-label {
    font-size: 0.9rem;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
}

@include dark-mode {
    .checkbox-label {
        color: $dark-secondary;
    }
}

.agreement-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

// 深色主题下的注册页面优化
@include auth-page-extended-dark-theme;
</style>
