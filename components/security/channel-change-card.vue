<template>
    <div class="channel-change security-section">
        <h3 class="section-title">
            {{ t('security.channelChange.title') }}
        </h3>
        <p class="section-desc">
            {{ t('security.channelChange.desc') }}
        </p>

        <CaomeiMessage
            v-if="flow.isPending.value"
            tone="warning"
        >
            <strong>{{ flow.status.value.scheduledAt ? t('security.channelChange.pendingTitle') : t('security.channelChange.confirmTitle') }}</strong>
            <p v-if="flow.status.value.scheduledAt">
                {{ t('security.channelChange.pendingDesc', {time: remainingText}) }}
            </p>
            <p v-else>
                {{ t('security.channelChange.confirmDesc', {target: flow.status.value.maskedTarget ?? ''}) }}
            </p>
        </CaomeiMessage>
        <CaomeiMessage
            v-else-if="flow.isConfirmed.value"
            tone="success"
        >
            <strong>{{ t('security.channelChange.confirmedTitle') }}</strong>
            <p>{{ t('security.channelChange.confirmedDesc', {target: flow.status.value.maskedTarget ?? ''}) }}</p>
        </CaomeiMessage>
        <CaomeiMessage
            v-else-if="flow.status.value.state === 'expired'"
            tone="neutral"
        >
            {{ t('security.channelChange.expired') }}
        </CaomeiMessage>

        <!-- 归属验证：已创建申请但尚未写入 scheduledAt -->
        <div
            v-if="flow.isPending.value && !flow.status.value.scheduledAt"
            class="channel-change__verify"
        >
            <CaomeiInput
                id="channel-change-ownership-code"
                v-model="ownershipCode"
                :placeholder="t('security.channelChange.codeLabel')"
                autocomplete="one-time-code"
            />
            <CaomeiButton
                class="btn btn-primary"
                :disabled="!ownershipCode.trim() || flow.submitting.value"
                @click="confirmOwnership"
            >
                {{ t('security.channelChange.confirm') }}
            </CaomeiButton>
        </div>

        <div class="security-actions">
            <CaomeiButton
                v-if="flow.isPending.value && flow.status.value.scheduledAt"
                class="btn btn-danger"
                tone="danger"
                :disabled="flow.submitting.value"
                @click="cancelChange"
            >
                <template #icon>
                    <i class="mdi mdi-close-circle-outline" />
                </template>
                {{ t('security.channelChange.cancelChange') }}
            </CaomeiButton>
            <CaomeiButton
                v-if="!flow.isPending.value"
                class="btn btn-primary"
                :disabled="flow.loading.value"
                @click="showDialog = true"
            >
                <template #icon>
                    <i class="mdi mdi-email-sync-outline" />
                </template>
                {{ t('security.channelChange.dialogTitle') }}
            </CaomeiButton>
        </div>

        <EmailChangeDialog
            v-model:visible="showDialog"
            :phone-verified="phoneVerified"
            :api="api"
            @submitted="onSubmitted"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'caomei-ui'
import EmailChangeDialog from './email-change-dialog.vue'
import { splitRemainingMs, useChannelChange, type ChannelChangeApi } from '@/composables/use-channel-change'
import { useI18nText } from '@/composables/utils/use-i18n-text'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = withDefaults(defineProps<{
    phoneVerified?: boolean
    api?: ChannelChangeApi
}>(), {
    phoneVerified: false,
    api: undefined,
})

const t = useI18nText()
const toast = useToast()
const api = props.api
const flow = useChannelChange({ api })
const showDialog = ref(false)
const ownershipCode = ref('')

const remainingText = computed(() => {
    const { hours, minutes } = splitRemainingMs(flow.remainingMs.value)
    return t('security.channelChange.hoursMinutes', { hours, minutes })
})

onMounted(async () => {
    try {
        await flow.refresh()
    } catch (error) {
        toast.danger({ title: t('security.channelChange.statusFailed'), description: getApiErrorMessage(error, t('security.channelChange.statusFailed')) })
    }
})

function onSubmitted(): void {
    void flow.refresh()
}

async function confirmOwnership(): Promise<void> {
    try {
        await flow.confirmOwnership(ownershipCode.value.trim())
        ownershipCode.value = ''
        toast.success({ title: t('security.channelChange.requested') })
    } catch (error) {
        toast.danger({ title: t('security.channelChange.confirmFailed'), description: getApiErrorMessage(error, t('security.channelChange.confirmFailed')) })
    }
}

async function cancelChange(): Promise<void> {
    try {
        await flow.cancel()
        toast.success({ title: t('security.channelChange.cancelled') })
    } catch (error) {
        toast.danger({ title: t('security.channelChange.cancelFailed'), description: getApiErrorMessage(error, t('security.channelChange.cancelFailed')) })
    }
}
</script>

<style scoped lang="scss">
.channel-change {
    &__verify {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 0.75rem;
    }
}
</style>
