<template>
    <div class="form-group">
        <label class="form-label">{{ t('profile.contact.emailLabel') }}</label>
        <div class="profile-row">
            <div class="profile-info-content">
                <BaseTooltip
                    v-if="!privacyMode"
                    :content="t('profile.contact.fullEmailTip', {email: user.email})"
                >
                    <span class="privacy-value">{{ user.email || t('profile.contact.notBound') }}</span>
                </BaseTooltip>
                <BaseTooltip
                    v-else
                    :content="t('profile.contact.emailHiddenTip')"
                >
                    <span class="privacy-hidden">{{ user.email ? maskEmail(user.email) : t('profile.contact.notBound') }}</span>
                </BaseTooltip>
            </div>
            <div class="profile-info-actions">
                <template v-if="user.emailVerified">
                    <BaseTooltip :content="t('profile.contact.changeVerifiedEmailTip')">
                        <CaomeiButton
                            variant="ghost"
                            size="sm"
                            @click="emit('openEmailModal')"
                        >
                            {{ t('profile.contact.edit') }}
                        </CaomeiButton>
                    </BaseTooltip>
                    <BaseTooltip :content="t('profile.contact.emailVerifiedTip')">
                        <span class="verified">{{ t('profile.contact.verified') }}</span>
                    </BaseTooltip>
                </template>
                <template v-else>
                    <BaseTooltip :content="t('profile.contact.verifyEmailTip')">
                        <CaomeiButton
                            variant="ghost"
                            size="sm"
                            @click="emit('openEmailModal')"
                        >
                            {{ t('profile.contact.verify') }}
                        </CaomeiButton>
                    </BaseTooltip>
                    <BaseTooltip :content="t('profile.contact.emailUnverifiedTip')">
                        <span class="unverified">{{ t('profile.contact.unverified') }}</span>
                    </BaseTooltip>
                </template>
            </div>
        </div>
        <CaomeiMessage v-if="!user.emailVerified" tone="warning">
            {{ t('profile.contact.emailWarning') }}<br>
            {{ t('profile.contact.emailWarningStrong') }}
        </CaomeiMessage>
    </div>
    <div v-if="phoneEnabled" class="form-group">
        <label class="form-label">{{ t('profile.contact.phoneLabel') }}</label>
        <div class="profile-row">
            <div class="profile-info-content">
                <span
                    v-if="!privacyMode"
                    class="privacy-value"
                >{{ user.phone ? formatPhoneNumberInternational(user.phone) : t('profile.contact.notBound') }}</span>
                <BaseTooltip
                    v-else
                    :content="t('profile.contact.phoneHiddenTip')"
                >
                    <span class="privacy-hidden">{{ user.phone ? maskPhone(user.phone) : t('profile.contact.notBound') }}</span>
                </BaseTooltip>
            </div>
            <div class="profile-info-actions">
                <BaseTooltip
                    v-if="user.phone"
                    :content="t('profile.contact.changePhoneTip')"
                >
                    <CaomeiButton
                        variant="ghost"
                        size="sm"
                        @click="emit('openPhoneModal')"
                    >
                        {{ t('profile.contact.edit') }}
                    </CaomeiButton>
                </BaseTooltip>
                <BaseTooltip
                    v-else
                    :content="phoneEnabled ? t('profile.contact.bindPhoneTip') : t('profile.contact.smsDisabledTip')"
                >
                    <CaomeiButton
                        variant="ghost"
                        size="sm"
                        :disabled="!phoneEnabled"
                        @click="emit('openPhoneModal')"
                    >
                        {{ t('profile.contact.bind') }}
                    </CaomeiButton>
                </BaseTooltip>
                <BaseTooltip
                    v-if="user.phoneVerified"
                    :content="t('profile.contact.phoneVerifiedTip')"
                >
                    <span class="verified">{{ t('profile.contact.verified') }}</span>
                </BaseTooltip>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { maskEmail, maskPhone } from '@/utils/shared/privacy'
import { formatPhoneNumberInternational } from '@/utils/shared/phone'

const { t } = useI18n()

const props = defineProps<{
    privacyMode: boolean
    phoneEnabled: boolean
}>()

const user = defineModel<{
    email: string
    emailVerified: boolean
    phone: string
    phoneVerified: boolean
}>('user', { required: true })

const emit = defineEmits<{
    (e: 'openEmailModal'): void
    (e: 'openPhoneModal'): void
}>()
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
}

.profile-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.5rem;
    padding: 0.5rem 0;
    gap: 1rem;
}

.profile-info-content {
    flex: 1;
    min-width: 0;
}

.profile-info-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.verified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.unverified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.privacy-value {
    color: $secondary;
    font-weight: 500;
    word-break: break-all;
    flex: 1;

    @include dark-mode {
        color: #{$dark-secondary} !important;
    }
}

.privacy-hidden {
    color: $secondary;
    font-weight: 500;
}
</style>
