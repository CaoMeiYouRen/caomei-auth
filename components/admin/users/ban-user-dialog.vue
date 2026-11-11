<template>
    <BaseDialogV2
        :visible="visible"
        title="禁用用户"
        size="sm"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="ban-user-form">
            <p class="ban-user-form__tip">
                确定要禁用用户 <strong>{{ user.name || user.email }}</strong> 吗？
            </p>

            <CaomeiFormItem
                id="banReason"
                label="禁用原因"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="banForm.reason"
                        placeholder="请输入禁用原因"
                        :rows="3"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <CaomeiFormItem
                id="banDuration"
                label="禁用时长"
            >
                <template #default="field">
                    <CaomeiSelect
                        :id="field.id"
                        v-model="banForm.duration"
                        :options="banDurationOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="选择禁用时长"
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
                    取消
                </CaomeiButton>
                <CaomeiButton
                    tone="danger"
                    :loading="banLoading"
                    @click="confirmBanUser"
                >
                    确认禁用
                </CaomeiButton>
            </div>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const toast = useToast()

const banLoading = ref(false)
const banForm = ref({
    reason: '',
    duration: 0,
})

/** `CaomeiSelect` 的选项值只接受字符串 / 数字，永久禁用用 `0` 表示（回传时换算为 `undefined`） */
const banDurationOptions = [
    { label: '永久', value: 0 },
    { label: '1小时', value: 3600 },
    { label: '1天', value: 86400 },
    { label: '7天', value: 604800 },
    { label: '30天', value: 2592000 },
]

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
                title: '禁用成功',
                description: '用户已被禁用',
                duration: 3000,
            })
            emit('update:visible', false)
            emit('banned')
        }
    } catch (error: unknown) {
        console.error('禁用用户失败:', error)
        toast.danger({
            title: '禁用失败',
            description: errorMessage(error, '禁用用户失败'),
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
