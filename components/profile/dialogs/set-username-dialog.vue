<template>
    <BaseDialog
        v-model:visible="visible"
        title="设置用户名"
        width="450px"
        :show-footer="false"
    >
        <BaseInput
            id="newUsername"
            v-model="newUsername"
            v-tooltip.top="'输入新的用户名，用于用户名密码登录'"
            placeholder="请输入新用户名"
            :error="errors.username"
        />
        <div class="form-group">
            <Button
                v-tooltip.top="'点击确认设置新的用户名'"
                label="确认设置"
                class="btn btn-primary w-full"
                :loading="isSettingUsername"
                @click="setUsername"
            />
        </div>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@/composables/core/use-form'
import { setUsernameFormSchema } from '@/utils/shared/schemas'

const props = defineProps<{
    user: {
        username: string
        nickname: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:user', user: any): void
}>()

const visible = defineModel<boolean>('visible', { required: true })

const toast = useToast()

const { values, errors, submitting: isSettingUsername, handleSubmit, reset, setField } = useForm({
    initialValues: { username: '' },
    zodSchema: setUsernameFormSchema,
})

const newUsername = computed({ get: () => values.value.username, set: (v) => setField('username', v) })

watch(visible, (val) => {
    if (val) {
        setField('username', props.user.username || props.user.nickname)
    } else {
        reset()
    }
})

async function setUsername() {
    await handleSubmit(async (vals) => {
        try {
            const result = await authClient.updateUser({
                username: vals.username,
            })
            if (result.error) {
                throw new Error(result.error.message || '设置用户名失败')
            }

            emit('update:user', {
                ...props.user,
                username: vals.username,
            })

            visible.value = false
            toast.add({
                severity: 'success',
                summary: '用户名设置成功',
                life: 2000,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '设置用户名时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '设置用户名失败',
                detail: errorMessage,
                life: 5000,
            })
        }
    })
}
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
}

.form-input {
    width: 100%;
}
</style>
