<template>
    <BaseDialog
        :visible="visible"
        title="创建用户"
        width="500px"
        :show-footer="false"
        @update:visible="$emit('update:visible', $event)"
    >
        <form class="create-user-form" @submit.prevent="createUser">
            <BaseInput
                id="createName"
                v-model="createForm.name"
                label="昵称"
                placeholder="请输入用户昵称"
                required
            />

            <BaseInput
                id="createEmail"
                v-model="createForm.email"
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                required
            />

            <BaseInput
                id="createUsername"
                v-model="createForm.username"
                label="用户名"
                placeholder="请输入用户名（可选）"
            />

            <BasePassword
                id="createPassword"
                v-model="createForm.password"
                label="密码"
                placeholder="请输入密码"
                required
            />

            <BaseFormGroup label="角色" for="createRole">
                <Select
                    id="createRole"
                    v-model="createForm.role"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="选择用户角色"
                    class="w-full"
                />
            </BaseFormGroup>

            <div class="dialog-footer">
                <Button
                    label="取消"
                    severity="secondary"
                    @click="$emit('update:visible', false)"
                />
                <Button
                    label="创建"
                    type="submit"
                    :loading="createLoading"
                />
            </div>
        </form>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { useUserTable } from '@/composables/admin/use-user-table'

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'created'): void
}>()

const toast = useToast()
const { roleOptions } = useUserTable()

const createLoading = ref(false)
const createForm = ref({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
})

const resetCreateForm = () => {
    createForm.value = {
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'user',
    }
}

// Reset form when dialog opens
watch(() => props.visible, (newValue) => {
    if (newValue) {
        resetCreateForm()
    }
})

const createUser = async () => {
    try {
        createLoading.value = true

        const response = await authClient.admin.createUser({
            name: createForm.value.name,
            email: createForm.value.email,
            password: createForm.value.password,
            role: createForm.value.role as 'admin' | 'user',
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '创建成功',
                detail: '用户创建成功',
                life: 3000,
            })
            emit('update:visible', false)
            emit('created')
        }
    } catch (error: any) {
        console.error('创建用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '创建失败',
            detail: error.message || '创建用户失败',
            life: 3000,
        })
    } finally {
        createLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.create-user-form {
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
