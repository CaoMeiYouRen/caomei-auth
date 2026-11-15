<template>
    <div class="auth-container">
        <AuthLeft :title="t('auth.changePassword.heroTitle')" :subtitle="t('auth.changePassword.heroSubtitle')" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    {{ t('auth.changePassword.title') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('auth.changePassword.subtitle') }}
                </p>
                <i18n-t
                    keypath="auth.changePassword.note"
                    tag="p"
                    class="info-note"
                >
                    <template #link>
                        <BaseTooltip :content="t('auth.changePassword.forgotTip')">
                            <NuxtLink
                                :to="`/forgot-password`"
                                class="toggle-link"
                            >
                                {{ t('auth.changePassword.forgotLink') }}
                            </NuxtLink>
                        </BaseTooltip>
                    </template>
                </i18n-t>
                <BaseTooltip :content="t('auth.changePassword.currentTip')">
                    <BasePasswordV2
                        id="currentPassword"
                        v-model="currentPassword"
                        :label="t('auth.changePassword.fieldCurrentPassword')"
                        :placeholder="t('auth.changePassword.placeholderCurrentPassword')"
                        :feedback="false"
                        :error="errors.currentPassword"
                    />
                </BaseTooltip>
                <BaseTooltip :content="passwordHint">
                    <BasePasswordV2
                        id="newPassword"
                        v-model="newPassword"
                        :label="t('auth.changePassword.fieldNewPassword')"
                        :placeholder="t('auth.changePassword.placeholderNewPassword')"
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
                <BaseTooltip :content="t('auth.changePassword.confirmTip')">
                    <BasePasswordV2
                        id="confirmPassword"
                        v-model="confirmPassword"
                        :label="t('auth.changePassword.fieldConfirmPassword')"
                        :placeholder="t('auth.changePassword.placeholderConfirmPassword')"
                        :feedback="false"
                        :error="errors.confirmPassword"
                    />
                </BaseTooltip>
                <div class="form-group">
                    <BaseTooltip :content="t('auth.changePassword.revokeTip')">
                        <CaomeiCheckbox
                            id="revokeSessions"
                            v-model="revokeOtherSessions"
                            :text="t('auth.changePassword.revokeSessions')"
                        />
                    </BaseTooltip>
                </div>
                <div class="form-group">
                    <BaseTooltip :content="t('auth.changePassword.submitTip')">
                        <CaomeiButton
                            class="btn btn-primary mt-2"
                            block
                            @click="changePassword"
                        >
                            {{ t('auth.changePassword.submit') }}
                        </CaomeiButton>
                    </BaseTooltip>
                </div>
                <div class="toggle-login">
                    <BaseTooltip :content="t('auth.changePassword.backTip')">
                        <NuxtLink
                            :to="`/profile`"
                            class="toggle-link"
                        >
                            {{ t('auth.changePassword.backProfile') }}
                        </NuxtLink>
                    </BaseTooltip>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import AuthLeft from '@/components/auth-left.vue'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import PasswordStrength from '@/components/password-strength.vue'
import { usePasswordHints } from '@/composables/utils/use-password-hints'
import { useChangePasswordFlow } from '@/composables/use-change-password-flow'

const { t } = useI18n()
usePageMeta('auth.changePassword.title', 'auth.changePassword.subtitle')
const { requirementHint } = usePasswordHints()
const passwordHint = computed(() => requirementHint())

const {
    currentPassword,
    newPassword,
    confirmPassword,
    errors,
    revokeOtherSessions,
    changePassword,
} = useChangePasswordFlow()
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
    margin-bottom: 1rem;
    color: $secondary-light;
}

.info-note {
    margin-bottom: 1.5rem;
    color: $secondary-light;
    background-color: rgb(230 57 70 / 0.04);
    border-left: 4px solid $primary;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.95rem;
}

.form-group {
    margin-bottom: 1.5rem;
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
</style>
