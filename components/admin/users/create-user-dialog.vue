<template>
    <BaseDialogV2
        :visible="visible"
        title="创建用户"
        size="md"
        @update:visible="$emit('update:visible', $event)"
    >
        <form class="create-user-form" @submit.prevent="createUser">
            <BaseInputV2
                id="createName"
                v-model="createForm.name"
                label="昵称"
                placeholder="请输入用户昵称"
                :error="errors.name || ''"
                required
            />

            <BaseInputV2
                id="createEmail"
                v-model="createForm.email"
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                :error="errors.email || ''"
                required
            />

            <BaseInputV2
                id="createUsername"
                v-model="createForm.username"
                label="用户名"
                placeholder="请输入用户名（可选）"
                :error="errors.username || ''"
            />

            <BasePasswordV2
                id="createPassword"
                v-model="createForm.password"
                label="密码"
                placeholder="请输入密码"
                :error="errors.password || ''"
                required
            />

            <CaomeiFormItem
                id="createRole"
                label="角色"
                :error="errors.role || ''"
            >
                <template #default="field">
                    <CaomeiSelect
                        :id="field.id"
                        v-model="createForm.role"
                        :options="roleOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="选择用户角色"
                        :invalid="field.invalid"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <div class="create-user-form__footer">
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:visible', false)"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton
                    type="submit"
                    :loading="createLoading"
                >
                    创建
                </CaomeiButton>
            </div>
        </form>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { createUserFormSchema } from '@/utils/shared/schemas'
import { useUserTable } from '@/composables/admin/use-user-table'
import { useValidationMessage } from '@/composables/utils/use-validation-message'

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'created'): void
}>()

const toast = useToast()
const translate = useValidationMessage()
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

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const createUser = async () => {
    errors.value = {}

    // 使用 Zod schema 校验
    const result = createUserFormSchema.safeParse(createForm.value)
    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const path = issue.path[0] as string
            if (path) {
                errors.value[path] = translate(issue.message) || '校验失败'
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
            toast.success({
                title: '创建成功',
                description: '用户创建成功',
                duration: 3000,
            })
            emit('update:visible', false)
            emit('created')
        }
    } catch (error: unknown) {
        console.error('创建用户失败:', error)
        toast.danger({
            title: '创建失败',
            description: errorMessage(error, '创建用户失败'),
            duration: 3000,
        })
    } finally {
        createLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.create-user-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

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
