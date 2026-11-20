<template>
    <div class="auth-container">
        <div class="auth-right">
            <div class="auth-card recovery-card">
                <h2 class="auth-title">
                    {{ t('security.recovery.pageTitle') }}
                </h2>
                <p class="auth-subtitle">
                    {{ t('security.recovery.pageSubtitle') }}
                </p>

                <CaomeiMessage v-if="loadError" tone="danger">
                    <span>{{ loadError }}</span>
                </CaomeiMessage>

                <template v-else-if="requestInfo">
                    <div class="recovery-summary">
                        <div class="recovery-summary__item">
                            <span class="recovery-summary__label">
                                {{ requestInfo.channel === 'email'
                                    ? t('security.recovery.emailLabel')
                                    : t('security.recovery.phoneLabel') }}
                            </span>
                            <strong>{{ requestInfo.maskedTarget }}</strong>
                        </div>
                        <BaseStatusBadge
                            variant="yes-no"
                            :status="requestInfo.status === 'pending'"
                            :true-label="t('security.recovery.statusPending')"
                            :false-label="statusLabel"
                            true-severity="warning"
                            false-severity="secondary"
                        />
                    </div>

                    <template v-if="requestInfo.status === 'pending' && !success">
                        <CaomeiMessage tone="primary">
                            <span>{{ t('security.recovery.codeHint') }}</span>
                        </CaomeiMessage>
                        <BaseInputV2
                            id="recoveryCode"
                            v-model="code"
                            :label="t('security.recovery.codeLabel')"
                            :placeholder="t('security.recovery.codePlaceholder')"
                            maxlength="6"
                            inputmode="numeric"
                            :error="codeError"
                            @enter="confirmChange"
                        />
                        <CaomeiMessage v-if="submitError" tone="danger">
                            <span>{{ submitError }}</span>
                        </CaomeiMessage>
                        <div class="recovery-actions">
                            <CaomeiButton
                                class="w-full"
                                block
                                :loading="submitting"
                                @click="confirmChange"
                            >
                                {{ t('security.recovery.submit') }}
                            </CaomeiButton>
                        </div>
                    </template>

                    <template v-else-if="success">
                        <CaomeiMessage tone="success">
                            <span>{{ t('security.recovery.successTitle') }}：{{ t('security.recovery.successDescription') }}</span>
                        </CaomeiMessage>
                        <CaomeiMessage tone="warning">
                            <span>{{ t('security.recovery.resetRequired') }}</span>
                        </CaomeiMessage>
                        <CaomeiMessage :tone="resetCodeSent ? 'primary' : 'warning'">
                            <span>{{ resetCodeSent
                                ? t('security.recovery.resetCodeSent')
                                : t('security.recovery.resetCodeFailed') }}</span>
                        </CaomeiMessage>
                        <div class="recovery-actions">
                            <CaomeiButton
                                class="w-full"
                                block
                                @click="goReset"
                            >
                                {{ t('security.recovery.goReset') }}
                            </CaomeiButton>
                            <CaomeiButton
                                variant="secondary"
                                class="w-full"
                                block
                                @click="goLogin"
                            >
                                {{ t('security.recovery.backToLogin') }}
                            </CaomeiButton>
                        </div>
                    </template>

                    <template v-else>
                        <CaomeiMessage tone="warning">
                            <span>{{ requestInfo.status === 'confirmed'
                                ? t('security.recovery.confirmedHint')
                                : t('security.recovery.expiredHint') }}</span>
                        </CaomeiMessage>
                        <div class="recovery-actions">
                            <CaomeiButton
                                class="w-full"
                                block
                                @click="goLogin"
                            >
                                {{ t('security.recovery.backToLogin') }}
                            </CaomeiButton>
                        </div>
                    </template>
                </template>

                <div v-else class="recovery-loading">
                    <i v-if="loading" class="mdi mdi-loading mdi-spin" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getApiErrorMessage } from '@/utils/shared/api-error'
import { usePageMeta } from '@/composables/utils/use-page-meta'
import { useNoIndex } from '@/composables/utils/use-no-index'

interface ChannelChangeInfo {
    id: string
    channel: 'email' | 'phone'
    maskedTarget: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired'
    expiresAt: string
}

const { t } = useI18n()
const route = useRoute()
usePageMeta('security.recovery.pageTitle')
useNoIndex()

const requestInfo = ref<ChannelChangeInfo | null>(null)
const loading = ref(true)
const loadError = ref('')
const code = ref('')
const codeError = ref('')
const submitError = ref('')
const submitting = ref(false)
const success = ref(false)
const resetCodeSent = ref(false)

const statusLabel = computed(() => {
    switch (requestInfo.value?.status) {
        case 'confirmed':
            return t('security.recovery.statusConfirmed')
        case 'expired':
            return t('security.recovery.statusExpired')
        case 'cancelled':
            return t('security.recovery.statusCancelled')
        default:
            return t('security.recovery.statusPending')
    }
})

const requestId = computed(() => String(route.params.id ?? ''))

const loadRequest = async () => {
    loading.value = true
    loadError.value = ''
    try {
        const response = await $fetch<{ status: boolean, data: ChannelChangeInfo }>(`/api/channel-change/${requestId.value}`)
        requestInfo.value = response.data
    } catch (error: unknown) {
        loadError.value = getApiErrorMessage(error, t('security.recovery.loadFailed'))
    } finally {
        loading.value = false
    }
}

const confirmChange = async () => {
    codeError.value = ''
    submitError.value = ''
    if (!/^\d{6}$/u.test(code.value)) {
        codeError.value = t('security.recovery.codeRequired')
        return
    }
    submitting.value = true
    try {
        const response = await $fetch<{ status: boolean, data: { resetCodeSent: boolean } }>(
            `/api/channel-change/${requestId.value}`,
            { method: 'POST', body: { code: code.value } },
        )
        resetCodeSent.value = response.data.resetCodeSent
        success.value = true
    } catch (error: unknown) {
        submitError.value = getApiErrorMessage(error, t('security.recovery.confirmFailed'))
    } finally {
        submitting.value = false
    }
}

const goReset = () => {
    const mode = requestInfo.value?.channel === 'phone' ? 'phone' : 'email'
    void navigateTo(`/forgot-password?mode=${mode}`)
}

const goLogin = () => {
    void navigateTo('/login')
}

onMounted(() => {
    if (!requestId.value) {
        loadError.value = t('security.recovery.loadFailed')
        loading.value = false
        return
    }
    void loadRequest()
})
</script>

<style scoped lang="scss">
.recovery-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.recovery-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid $border-color;
    border-radius: 8px;
    background: $background-light;

    &__item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__label {
        color: $secondary-light;
        font-size: 0.85rem;
    }
}

.recovery-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.recovery-loading {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
}

@include dark-mode {
    .recovery-summary {
        border-color: #{$dark-border-color} !important;
        background: #{$dark-background-light} !important;

        &__label {
            color: #{$dark-secondary-light} !important;
        }
    }
}
</style>
