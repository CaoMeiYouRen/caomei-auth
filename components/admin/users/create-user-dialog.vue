<template>
    <Dialog
        :visible="visible"
        modal
        header="创建用户"
        :style="{width: '500px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <form class="create-user-form" @submit.prevent="createUser">
            <div class="field">
                <label for="createName">昵称</label>
                <InputText
                    id="createName"
                    v-model="createForm.name"
                    placeholder="请输入用户昵称"
                    required
                />
            </div>

            <div class="field">
                <label for="createEmail">邮箱</label>
                <InputText
                    id="createEmail"
                    v-model="createForm.email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    required
                />
            </div>

            <div class="field">
                <label for="createUsername">用户名</label>
                <InputText
                    id="createUsername"
                    v-model="createForm.username"
                    placeholder="请输入用户名（可选）"
                />
            </div>

            <div class="field">
                <label for="createPassword">密码</label>
                <Password
                    id="createPassword"
                    v-model="createForm.password"
                    placeholder="请输入密码"
                    :feedback="false"
                    toggle-mask
                    required
                />
            </div>

            <div class="field">
                <label for="createRole">角色</label>
                <Select
                    id="createRole"
                    v-model="createForm.role"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="选择用户角色"
                />
            </div>

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
    </Dialog>
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
