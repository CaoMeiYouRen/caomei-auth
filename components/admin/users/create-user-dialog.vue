<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('admin.users.create.title')"
        size="md"
        @update:visible="$emit('update:visible', $event)"
    >
        <form class="create-user-form" @submit.prevent="createUser">
            <BaseInputV2
                id="createName"
                v-model="createForm.name"
                :label="t('admin.users.create.nickname')"
                :placeholder="t('admin.users.create.nicknamePlaceholder')"
                :error="errors.name || ''"
                required
            />

            <BaseInputV2
                id="createEmail"
                v-model="createForm.email"
                :label="t('admin.users.create.email')"
                type="email"
                :placeholder="t('admin.users.create.emailPlaceholder')"
                :error="errors.email || ''"
                required
            />

            <BaseInputV2
                id="createUsername"
                v-model="createForm.username"
                :label="t('admin.users.create.username')"
                :placeholder="t('admin.users.create.usernamePlaceholder')"
                :error="errors.username || ''"
            />

            <BasePasswordV2
                id="createPassword"
                v-model="createForm.password"
                :label="t('admin.users.create.password')"
                :placeholder="t('admin.users.create.passwordPlaceholder')"
                :error="errors.password || ''"
                required
            />

            <CaomeiFormItem
                id="createRole"
                :label="t('admin.users.create.role')"
                :error="errors.role || ''"
            >
                <template #default="field">
                    <CaomeiSelect
                        :id="field.id"
                        v-model="createForm.role"
                        :options="roleOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="t('admin.users.create.rolePlaceholder')"
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
                    {{ t('admin.users.create.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    type="submit"
                    :loading="createLoading"
                >
                    {{ t('admin.users.create.submit') }}
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

const { t } = useI18n()
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
                errors.value[path] = translate(issue.message) || t('admin.users.create.validationFailed')
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
                title: t('admin.users.create.successTitle'),
                description: t('admin.users.create.successDescription'),
                duration: 3000,
            })
            emit('update:visible', false)
            emit('created')
        }
    } catch (error: unknown) {
        console.error('Failed to create user:', error)
        toast.danger({
            title: t('admin.users.create.failedTitle'),
            description: errorMessage(error, t('admin.users.create.failedDescription')),
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
