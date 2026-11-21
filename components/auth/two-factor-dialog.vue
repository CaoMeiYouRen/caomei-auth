<template>
    <CaomeiDialog
        v-model:open="open"
        :closable="false"
        :close-on-overlay="false"
        size="md"
        :title="t('auth.login.twoFactor.title')"
    >
        <div>
            <p v-if="channelLabel" class="mb-3 two-factor-channel-hint">
                {{ t('auth.login.twoFactor.challengeFrom', {channel: channelLabel}) }}
            </p>
            <CaomeiTabs v-model="activeTab" :unmount-on-hide="false">
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
                            v-model="code"
                            class="w-full"
                            :aria-label="t('auth.login.twoFactor.authenticatorLabel')"
                            :placeholder="t('auth.login.twoFactor.codePlaceholder')"
                            @enter="emit('verify')"
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
                                    v-model="code"
                                    class="w-full"
                                    :aria-label="t('auth.login.twoFactor.otpLabel')"
                                    :placeholder="t('auth.login.twoFactor.codePlaceholder')"
                                    @enter="emit('verify')"
                                />
                            </BaseTooltip>
                            <SendCodeButtonV2
                                :disabled="otpSending"
                                :loading="otpSending"
                                :on-send="onSendOtp"
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
                                v-model="code"
                                class="w-full"
                                :aria-label="t('auth.login.twoFactor.backupLabel')"
                                :placeholder="t('auth.login.twoFactor.backupPlaceholder')"
                                @enter="emit('verify')"
                            />
                        </BaseTooltip>
                    </div>
                </CaomeiTabContent>
            </CaomeiTabs>
            <div v-if="error" class="error-message mt-2">
                {{ error }}
            </div>
        </div>
        <template #footer>
            <div class="two-factor-footer">
                <CaomeiButton
                    variant="secondary"
                    :disabled="verifying"
                    @click="emit('cancel')"
                >
                    {{ t('auth.login.twoFactor.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="verifying"
                    @click="emit('verify')"
                >
                    {{ t('auth.login.twoFactor.verify') }}
                </CaomeiButton>
            </div>
        </template>
    </CaomeiDialog>
</template>

<script lang="ts" setup>
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import { useI18nText } from '@/composables/utils/use-i18n-text'

defineProps<{
    channelLabel: string
    error: string
    otpSending: boolean
    verifying: boolean
    onSendOtp: () => Promise<unknown>
}>()

const open = defineModel<boolean>('open', { required: true })
const code = defineModel<string>('code', { required: true })
const activeTab = defineModel<number>('activeTab', { required: true })

const emit = defineEmits<{
    verify: []
    cancel: []
}>()

const t = useI18nText()
</script>

<style scoped lang="scss">
.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.two-factor-footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}
</style>
