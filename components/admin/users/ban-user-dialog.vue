<template>
    <Dialog
        :visible="visible"
        modal
        header="禁用用户"
        :style="{width: '400px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="ban-form">
            <p>确定要禁用用户 <strong>{{ user.name || user.email }}</strong> 吗？</p>

            <div class="field">
                <label for="banReason">禁用原因</label>
                <Textarea
                    id="banReason"
                    v-model="banForm.reason"
                    placeholder="请输入禁用原因"
                    rows="3"
                />
            </div>

            <div class="field">
                <label for="banDuration">禁用时长</label>
                <Select
                    id="banDuration"
                    v-model="banForm.duration"
                    :options="banDurationOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="选择禁用时长"
                />
            </div>

            <div class="dialog-footer">
                <Button
                    label="取消"
                    severity="secondary"
                    @click="$emit('update:visible', false)"
                />
                <Button
                    label="确认禁用"
                    severity="danger"
                    :loading="banLoading"
                    @click="confirmBanUser"
                />
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

const props = defineProps<{
    visible: boolean
    user: any
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'banned'): void
}>()

const toast = useToast()

const banLoading = ref(false)
const banForm = ref({
    reason: '',
    duration: null,
})

const banDurationOptions = [
    { label: '永久', value: null },
    { label: '1小时', value: 3600 },
    { label: '1天', value: 86400 },
    { label: '7天', value: 604800 },
    { label: '30天', value: 2592000 },
]

watch(() => props.visible, (newValue) => {
    if (newValue) {
        banForm.value = {
            reason: '',
            duration: null,
        }
    }
})

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
            toast.add({
                severity: 'success',
                summary: '禁用成功',
                detail: '用户已被禁用',
                life: 3000,
            })
            emit('update:visible', false)
            emit('banned')
        }
    } catch (error: any) {
        console.error('禁用用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '禁用失败',
            detail: error.message || '禁用用户失败',
            life: 3000,
        })
    } finally {
        banLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.ban-form {
    .field {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: $secondary;
        }
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }
}
</style>
