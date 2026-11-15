<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('admin.users.ban.title')"
        size="sm"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="ban-user-form">
            <p class="ban-user-form__tip">
                <i18n-t keypath="admin.users.ban.confirm" tag="span">
                    <template #name>
                        <strong>{{ user.name || user.email }}</strong>
                    </template>
                </i18n-t>
            </p>

            <CaomeiFormItem
                id="banReason"
                :label="t('admin.users.ban.reason')"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="banForm.reason"
                        :placeholder="t('admin.users.ban.reasonPlaceholder')"
                        :rows="3"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <CaomeiFormItem
                id="banDuration"
                :label="t('admin.users.ban.duration')"
            >
                <template #default="field">
                    <CaomeiSelect
                        :id="field.id"
                        v-model="banForm.duration"
                        :options="banDurationOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="t('admin.users.ban.durationPlaceholder')"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <div class="ban-user-form__footer">
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:visible', false)"
                >
                    {{ t('admin.users.ban.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    tone="danger"
                    :loading="banLoading"
                    @click="confirmBanUser"
                >
                    {{ t('admin.users.ban.submit') }}
                </CaomeiButton>
            </div>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import type { AdminUserProfile } from '@/types/admin'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'banned'): void
}>()

const { t } = useI18n()
const toast = useToast()

const banLoading = ref(false)
const banForm = ref({
    reason: '',
    duration: 0,
})

/** `CaomeiSelect` 的选项值只接受字符串 / 数字，永久禁用用 `0` 表示（回传时换算为 `undefined`） */
const banDurationOptions = computed(() => [
    { label: t('admin.users.ban.durationOptions.permanent'), value: 0 },
    { label: t('admin.users.ban.durationOptions.hour1'), value: 3600 },
    { label: t('admin.users.ban.durationOptions.day1'), value: 86400 },
    { label: t('admin.users.ban.durationOptions.day7'), value: 604800 },
    { label: t('admin.users.ban.durationOptions.day30'), value: 2592000 },
])

watch(() => props.visible, (newValue) => {
    if (newValue) {
        banForm.value = {
            reason: '',
            duration: 0,
        }
    }
})

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const confirmBanUser = async () => {
    if (!props.user) {
        return
    }

    try {
        banLoading.value = true

        const response = await authClient.admin.banUser({
            userId: props.user.id,
            banReason: banForm.value.reason || undefined,
            banExpiresIn: banForm.value.duration || undefined,
        })

        if (response.data) {
            toast.success({
                title: t('admin.users.ban.successTitle'),
                description: t('admin.users.ban.successDescription'),
                duration: 3000,
            })
            emit('update:visible', false)
            emit('banned')
        }
    } catch (error: unknown) {
        console.error('Failed to ban user:', error)
        toast.danger({
            title: t('admin.users.ban.failedTitle'),
            description: errorMessage(error, t('admin.users.ban.failedDescription')),
            duration: 3000,
        })
    } finally {
        banLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.ban-user-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__tip {
        margin: 0;
        color: var(--admin-text);
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
