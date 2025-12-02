<template>
    <Dialog
        v-model:visible="visible"
        modal
        header="设置用户名"
        :closable="true"
        :style="{width: '450px'}"
    >
        <div class="form-group">
            <InputText
                v-model="newUsername"
                v-tooltip.top="'输入新的用户名，用于用户名密码登录'"
                class="form-input"
                placeholder="请输入新用户名"
            />
            <Message
                v-if="usernameError"
                severity="error"
                size="small"
                variant="simple"
            >
                {{ usernameError }}
            </Message>
        </div>
        <div class="form-group">
            <Button
                v-tooltip.top="'点击确认设置新的用户名'"
                label="确认设置"
                class="btn btn-primary w-full"
                :loading="isSettingUsername"
                @click="setUsername"
            />
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { validateUsername } from '@/utils/validate'

const props = defineProps<{
    user: {
        username: string
        nickname: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:user', user: any): void
}>()

const visible = defineModel<boolean>('visible')

const toast = useToast()
const newUsername = ref('')
const usernameError = ref('')
const isSettingUsername = ref(false)

watch(visible, (val) => {
    if (val) {
        newUsername.value = props.user.username || props.user.nickname
        usernameError.value = ''
    }
})

async function setUsername() {
    usernameError.value = ''
    if (!validateUsername(newUsername.value)) {
        usernameError.value = '用户名只能包含字母、数字、下划线和连字符，长度在 2 到 36 个字符之间。'
        return
    }
    isSettingUsername.value = true
    try {
        const result = await authClient.updateUser({
            username: newUsername.value,
        })
        if (result.error) {
            throw new Error(result.error.message || '设置用户名失败')
        }
        
        emit('update:user', {
            ...props.user,
            username: newUsername.value,
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
    } finally {
        isSettingUsername.value = false
        newUsername.value = ''
    }
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
