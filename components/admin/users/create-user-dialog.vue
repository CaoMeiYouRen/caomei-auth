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
                :error="errors.name || ''"
                required
            />

            <BaseInput
                id="createEmail"
                v-model="createForm.email"
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                :error="errors.email || ''"
                required
            />

            <BaseInput
                id="createUsername"
                v-model="createForm.username"
                label="用户名"
                placeholder="请输入用户名（可选）"
                :error="errors.username || ''"
            />

            <BasePassword
                id="createPassword"
                v-model="createForm.password"
                label="密码"
                placeholder="请输入密码"
                :error="errors.password || ''"
                required
            />

            <BaseFormGroup
                label="角色"
                for="createRole"
                :error="errors.role || ''"
            >
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
import { createUserFormSchema } from '@/utils/shared/schemas'
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
const errors = ref<Record<string, string>>({})
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
    errors.value = {}
}

// Reset form when dialog opens
watch(() => props.visible, (newValue) => {
    if (newValue) {
        resetCreateForm()
    }
})

// Helper function to get first Zod error
function getFirstZodError(result: { success: boolean, error?: { issues: Array<{ message: string, path: (string | number)[] }> } }): string | null {
    if (result.success) return null
    return result.error?.issues[0]?.message || '校验失败'
}

const createUser = async () => {
    errors.value = {}

    // 使用 Zod schema 校验
    const result = createUserFormSchema.safeParse(createForm.value)
    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const path = issue.path[0] as string
            if (path) {
                errors.value[path] = issue.message
            }
        })
        return
    }

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
