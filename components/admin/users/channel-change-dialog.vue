<template>
    <BaseDialogV2
        :visible="visible"
        :title="channel === 'email' ? t('admin.users.channelChange.emailTitle') : t('admin.users.channelChange.phoneTitle')"
        size="sm"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="channel-change-form">
            <p class="channel-change-form__tip">
                {{ t('admin.users.channelChange.directEditNote') }}
            </p>

            <BaseInputV2
                v-if="channel === 'email'"
                id="channelChangeEmail"
                v-model="target"
                type="email"
                :label="t('admin.users.channelChange.targetEmail')"
                :placeholder="t('admin.users.detail.emailPlaceholder')"
            />
            <BasePhoneInputV2
                v-else
                id="channelChangePhone"
                v-model="target"
                :label="t('admin.users.channelChange.targetPhone')"
                :placeholder="t('admin.users.detail.phonePlaceholder')"
            />

            <CaomeiFormItem
                id="channelChangeReason"
                :label="t('admin.users.channelChange.reason')"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="reason"
                        :placeholder="t('admin.users.channelChange.reasonPlaceholder')"
                        :rows="3"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <div class="channel-change-form__footer">
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:visible', false)"
                >
                    {{ t('admin.users.channelChange.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="submitting"
                    @click="submit"
                >
                    {{ t('admin.users.channelChange.submit') }}
                </CaomeiButton>
            </div>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import type { AdminUserProfile } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
    channel: 'email' | 'phone'
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'requested'): void
}>()

const { t } = useI18n()
const toast = useToast()
const target = ref('')
const reason = ref('')
const submitting = ref(false)

watch(() => props.visible, (visible) => {
    if (visible) {
        target.value = ''
        reason.value = ''
    }
})

const submit = async () => {
    if (!props.user) {
        return
    }
    if (!target.value.trim() || !reason.value.trim()) {
        toast.warning({
            title: t('admin.users.channelChange.failedTitle'),
            description: t('errors.recovery.reasonRequired'),
            duration: 3000,
        })
        return
    }
    submitting.value = true
    try {
        const response = await $fetch<{
            status: boolean
            data: { maskedTarget: string }
        }>(`/api/admin/users/${props.user.id}/channel-change`, {
            method: 'POST',
            body: {
                channel: props.channel,
                value: target.value.trim(),
                reason: reason.value.trim(),
            },
        })
        toast.success({
            title: t('admin.users.channelChange.successTitle'),
            description: t('admin.users.channelChange.successDescription', { target: response.data.maskedTarget }),
            duration: 5000,
        })
        emit('update:visible', false)
        emit('requested')
    } catch (error: unknown) {
        toast.danger({
            title: t('admin.users.channelChange.failedTitle'),
            description: getApiErrorMessage(error, t('admin.users.channelChange.failedDescription')),
            duration: 5000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.channel-change-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__tip {
        margin: 0;
        color: var(--admin-text-secondary, var(--admin-text));
        font-size: 0.9rem;
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--admin-border);
    }
}
</style>
