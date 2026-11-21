<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('security.channelChange.dialogTitle')"
        @update:visible="$emit('update:visible', $event)"
    >
        <CaomeiFormItem :label="t('security.channelChange.newEmail')">
            <CaomeiInput
                id="channel-change-new-email"
                v-model="newEmail"
                type="email"
                autocomplete="email"
            />
        </CaomeiFormItem>
        <CaomeiFormItem :label="t('security.channelChange.password')">
            <CaomeiInput
                id="channel-change-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
            />
        </CaomeiFormItem>
        <CaomeiFormItem :label="t('security.channelChange.factorLabel')">
            <CaomeiSelect
                v-model="factor"
                :options="factorOptions"
            />
        </CaomeiFormItem>
        <CaomeiFormItem :label="t('security.channelChange.codeLabel')">
            <div class="channel-change-dialog__code">
                <CaomeiInput
                    id="channel-change-factor-code"
                    v-model="code"
                    autocomplete="one-time-code"
                />
                <CaomeiButton
                    v-if="factor === 'phone-otp'"
                    variant="secondary"
                    :disabled="!phoneVerified || sendingOtp"
                    @click="sendPhoneCode"
                >
                    {{ t('security.channelChange.sendPhoneCode') }}
                </CaomeiButton>
            </div>
            <p
                v-if="factor === 'phone-otp' && !phoneVerified"
                class="channel-change-dialog__hint"
            >
                {{ t('security.channelChange.phoneNotVerified') }}
            </p>
        </CaomeiFormItem>

        <template #footer>
            <CaomeiButton
                variant="secondary"
                @click="$emit('update:visible', false)"
            >
                {{ t('security.recoveryCodes.cancel') }}
            </CaomeiButton>
            <CaomeiButton
                class="btn btn-primary"
                :disabled="!canSubmit"
                @click="submit"
            >
                {{ t('security.channelChange.submit') }}
            </CaomeiButton>
        </template>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'caomei-ui'
import BaseDialogV2 from '@/components/base/base-dialog-v2.vue'
import { useChannelChange, type ChannelChangeApi, type ChannelChangeRequestResult } from '@/composables/use-channel-change'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = withDefaults(defineProps<{
    visible: boolean
    phoneVerified?: boolean
    api?: ChannelChangeApi
}>(), {
    phoneVerified: false,
    api: undefined,
})

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'submitted', value: ChannelChangeRequestResult): void
}>()

const t = useI18nText()
const toast = useToast()
const flow = useChannelChange({ api: props.api })

const newEmail = ref('')
const password = ref('')
const factor = ref<'recovery-code' | 'phone-otp' | 'totp' | 'backup-code'>('recovery-code')
const code = ref('')
const sendingOtp = ref(false)

const factorOptions = computed(() => [
    { label: t('security.channelChange.factorRecoveryCode'), value: 'recovery-code' },
    ...(props.phoneVerified ? [{ label: t('security.channelChange.factorPhoneOtp'), value: 'phone-otp' }] : []),
    { label: t('security.channelChange.factorTotp'), value: 'totp' },
    { label: t('security.channelChange.factorBackupCode'), value: 'backup-code' },
])

const canSubmit = computed(() => (
    !flow.submitting.value
    && Boolean(newEmail.value.trim())
    && Boolean(password.value)
    && Boolean(code.value.trim())
))

async function sendPhoneCode(): Promise<void> {
    sendingOtp.value = true
    try {
        await flow.sendProofOtp()
        toast.success({ title: t('security.channelChange.phoneCodeSent') })
    } catch (error) {
        toast.danger({ title: t('security.channelChange.sendFailed'), description: getApiErrorMessage(error, t('security.channelChange.sendFailed')) })
    } finally {
        sendingOtp.value = false
    }
}

async function submit(): Promise<void> {
    if (!canSubmit.value) {
        return
    }
    try {
        const result = await flow.requestChange({
            newEmail: newEmail.value.trim(),
            password: password.value,
            factor: factor.value,
            code: code.value.trim(),
        })
        toast.success({ title: t('security.channelChange.requested') })
        newEmail.value = ''
        password.value = ''
        code.value = ''
        emit('submitted', result)
        emit('update:visible', false)
    } catch (error) {
        toast.danger({ title: t('security.channelChange.requestFailed'), description: getApiErrorMessage(error, t('security.channelChange.requestFailed')) })
    }
}
</script>

<style scoped lang="scss">
.channel-change-dialog {
    &__code {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__hint {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #d97706;
    }
}
</style>
