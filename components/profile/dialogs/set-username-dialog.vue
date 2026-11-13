<template>
    <BaseDialogV2
        v-model:visible="visible"
        title="设置用户名"
    >
        <BaseTooltip content="输入新的用户名，用于用户名密码登录">
            <BaseInputV2
                id="newUsername"
                v-model="newUsername"
                placeholder="请输入新用户名"
                :error="errors.username"
            />
        </BaseTooltip>
        <div class="form-group">
            <BaseTooltip content="点击确认设置新的用户名">
                <CaomeiButton
                    class="btn btn-primary w-full"
                    block
                    :loading="isSettingUsername"
                    @click="setUsername"
                >
                    确认设置
                </CaomeiButton>
            </BaseTooltip>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'caomei-ui'
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
            toast.success({ title: '用户名设置成功', duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '设置用户名时发生未知错误'
            toast.danger({ title: '设置用户名失败', description: errorMessage, duration: 5000 })
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
