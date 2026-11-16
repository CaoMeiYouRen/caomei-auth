<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? t('admin.users.detail.titleEdit') : t('admin.users.detail.titleView')"
        size="lg"
        @update:visible="onClose"
    >
        <div v-if="user" class="user-detail">
            <div v-if="!isEditing">
                <div class="user-detail__section">
                    <div class="user-detail__section-header">
                        <h3 class="user-detail__section-title">
                            {{ t('admin.users.detail.basicInfo') }}
                        </h3>
                        <CaomeiButton
                            variant="ghost"
                            size="sm"
                            @click="isEditing = true"
                        >
                            <template #icon>
                                <i class="mdi mdi-pencil" />
                            </template>
                            {{ t('admin.users.detail.edit') }}
                        </CaomeiButton>
                    </div>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>ID</label>
                            <span>{{ user.id }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.nickname') }}</label>
                            <span>{{ user.name || t('admin.users.detail.notSet') }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.email') }}</label>
                            <span>{{ user.email }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.phone') }}</label>
                            <span>{{ user.phoneNumber ? formatPhoneNumberInternational(user.phoneNumber) : t('admin.users.detail.notSet') }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.username') }}</label>
                            <span>{{ user.username || t('admin.users.detail.notSet') }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.role') }}</label>
                            <BaseStatusBadge
                                variant="role"
                                :status="user.role"
                            />
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.verifyStatus') }}</label>
                            <div class="user-detail__verification">
                                <BaseStatusBadge
                                    variant="yes-no"
                                    :status="user.emailVerified"
                                    :true-label="t('admin.users.detail.emailVerified')"
                                    :false-label="t('admin.users.detail.emailUnverified')"
                                    true-severity="success"
                                    false-severity="warning"
                                />
                                <BaseStatusBadge
                                    variant="yes-no"
                                    :status="user.phoneNumberVerified"
                                    :true-label="t('admin.users.detail.phoneVerified')"
                                    :false-label="t('admin.users.detail.phoneUnverified')"
                                    true-severity="success"
                                    false-severity="warning"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="user-detail__section">
                    <h3 class="user-detail__section-title">
                        {{ t('admin.users.detail.accountStatus') }}
                    </h3>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.status') }}</label>
                            <BaseStatusBadge
                                variant="banned"
                                :status="user.banned"
                            />
                        </div>
                        <div v-if="user.banned" class="user-detail__item">
                            <label>{{ t('admin.users.detail.banReason') }}</label>
                            <span>{{ user.banReason || t('admin.users.detail.noReason') }}</span>
                        </div>
                        <div v-if="user.banned && user.banExpires" class="user-detail__item">
                            <label>{{ t('admin.users.detail.banUntil') }}</label>
                            <span>{{ formatDateTime(user.banExpires) }}</span>
                        </div>
                    </div>
                </div>

                <div class="user-detail__section">
                    <h3 class="user-detail__section-title">
                        {{ t('admin.users.detail.timeInfo') }}
                    </h3>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.registeredAt') }}</label>
                            <span>{{ formatDateTime(user.createdAt) }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>{{ t('admin.users.detail.updatedAt') }}</label>
                            <span>{{ formatDateTime(user.updatedAt) }}</span>
                        </div>
                    </div>
                </div>

                <div class="user-detail__actions">
                    <CaomeiButton @click="$emit('view-sessions', user)">
                        <template #icon>
                            <i class="mdi mdi-account-multiple" />
                        </template>
                        {{ t('admin.users.detail.viewSessions') }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="secondary"
                        :loading="loading"
                        @click="handleSyncUserAdminRole"
                    >
                        <template #icon>
                            <i class="mdi mdi-sync" />
                        </template>
                        {{ t('admin.users.detail.syncAdminRole') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="!user.role?.includes('admin')"
                        variant="secondary"
                        tone="primary"
                        :loading="loading"
                        @click="handleSetUserAsAdmin"
                    >
                        <template #icon>
                            <i class="mdi mdi-shield-account" />
                        </template>
                        {{ t('admin.users.detail.makeAdmin') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-else-if="user.role?.includes('admin') && !isCurrentUser(user.id)"
                        variant="secondary"
                        tone="danger"
                        :loading="loading"
                        @click="handleRemoveUserAdminRole"
                    >
                        <template #icon>
                            <i class="mdi mdi-shield-remove" />
                        </template>
                        {{ t('admin.users.detail.removeAdmin') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-else-if="user.role?.includes('admin') && isCurrentUser(user.id)"
                        variant="secondary"
                        tone="danger"
                        disabled
                    >
                        <template #icon>
                            <i class="mdi mdi-shield-remove" />
                        </template>
                        {{ t('admin.users.detail.cannotRemoveSelf') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="!user.banned && user.role !== 'admin' && !isCurrentUser(user.id)"
                        variant="secondary"
                        tone="warning"
                        @click="$emit('ban', user)"
                    >
                        <template #icon>
                            <i class="mdi mdi-block-helper" />
                        </template>
                        {{ t('admin.users.detail.banUser') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-else-if="user.banned && user.role !== 'admin' && !isCurrentUser(user.id)"
                        variant="secondary"
                        tone="success"
                        @click="handleUnbanUser"
                    >
                        <template #icon>
                            <i class="mdi mdi-check-circle" />
                        </template>
                        {{ t('admin.users.detail.unbanUser') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-else-if="isCurrentUser(user.id)"
                        variant="secondary"
                        tone="warning"
                        disabled
                    >
                        <template #icon>
                            <i class="mdi mdi-account-alert" />
                        </template>
                        {{ t('admin.users.detail.cannotOperateSelf') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="user.role === 'admin' && !user.banned"
                        variant="secondary"
                        tone="warning"
                        disabled
                    >
                        <template #icon>
                            <i class="mdi mdi-block-helper" />
                        </template>
                        {{ t('admin.users.detail.adminCannotBan') }}
                    </CaomeiButton>
                </div>
            </div>

            <form
                v-else
                class="edit-user-form"
                @submit.prevent="updateUser"
            >
                <BaseInputV2
                    id="editNickname"
                    v-model="editNickname"
                    :label="t('admin.users.detail.nickname')"
                    :placeholder="t('admin.users.detail.nicknamePlaceholder')"
                    :error="errors.nickname"
                    required
                />
                <BaseInputV2
                    id="editEmail"
                    v-model="editEmail"
                    :label="t('admin.users.detail.email')"
                    type="email"
                    :placeholder="t('admin.users.detail.emailPlaceholder')"
                    :error="errors.email"
                    required
                />
                <BaseInputV2
                    id="editPhone"
                    v-model="editPhone"
                    :label="t('admin.users.detail.phone')"
                    :placeholder="t('admin.users.detail.phonePlaceholder')"
                    :error="errors.phone"
                />
                <CaomeiFormItem
                    id="editRole"
                    :label="t('admin.users.detail.role')"
                    :error="errors.role"
                >
                    <template #default="field">
                        <CaomeiSelect
                            :id="field.id"
                            v-model="editRole"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            :placeholder="t('admin.users.detail.rolePlaceholder')"
                            :invalid="field.invalid"
                            :aria-labelledby="field['aria-labelledby']"
                            :aria-describedby="field['aria-describedby']"
                        />
                    </template>
                </CaomeiFormItem>
                <BasePasswordV2
                    id="editPassword"
                    v-model="editPassword"
                    :label="t('admin.users.detail.newPassword')"
                    :placeholder="t('admin.users.detail.newPasswordPlaceholder')"
                    :error="errors.password"
                />

                <div class="edit-user-form__footer">
                    <CaomeiButton
                        variant="secondary"
                        @click="isEditing = false"
                    >
                        {{ t('admin.users.detail.cancel') }}
                    </CaomeiButton>
                    <CaomeiButton
                        type="submit"
                        :loading="updateLoading"
                    >
                        {{ t('admin.users.detail.save') }}
                    </CaomeiButton>
                </div>
            </form>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useConfirm, useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/shared/phone'
import { formatDateTime } from '@/utils/shared/date'
import { syncAdminRole, addAdminRole, removeAdminRole } from '@/utils/web/admin-role-client'
import { useUserTable } from '@/composables/admin/use-user-table'
import { useForm } from '@/composables/core/use-form'
import { updateUserFormSchema } from '@/utils/shared/schemas'
import type { AdminUserProfile } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
    currentUserId?: string
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'updated'): void
    (e: 'view-sessions', user: AdminUserProfile): void
    (e: 'ban', user: AdminUserProfile): void
}>()

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { roleOptions } = useUserTable()

const loading = ref(false)
const isEditing = ref(false)

const { values: editForm, errors, submitting: updateLoading, handleSubmit, reset, setField } = useForm({
    initialValues: {
        nickname: '',
        email: '',
        phone: '',
        role: 'user',
        password: '',
    },
    zodSchema: updateUserFormSchema,
})

const editNickname = computed({ get: () => editForm.value.nickname, set: (v) => setField('nickname', v) })
const editEmail = computed({ get: () => editForm.value.email, set: (v) => setField('email', v) })
const editPhone = computed({ get: () => editForm.value.phone || '', set: (v) => setField('phone', v) })
const editRole = computed({ get: () => editForm.value.role, set: (v) => setField('role', v) })
const editPassword = computed({ get: () => editForm.value.password || '', set: (v) => setField('password', v) })

const isCurrentUser = (userId: string) => props.currentUserId === userId

const onClose = (val: boolean) => {
    emit('update:visible', val)
    if (!val) {
        isEditing.value = false
        reset()
    }
}

watch(isEditing, (val) => {
    if (val && props.user) {
        reset({
            nickname: props.user.name || '',
            email: props.user.email || '',
            phone: props.user.phoneNumber || '',
            role: props.user.role || 'user',
            password: '',
        })
    }
})

const updateUser = async () => {
    const targetUser = props.user
    if (!targetUser) return

    await handleSubmit(async (vals) => {
        try {
            const { error } = await authClient.admin.updateUser({
                userId: targetUser.id,
                data: {
                    name: vals.nickname,
                    email: vals.email,
                    role: vals.role,
                    password: vals.password || undefined,
                    // phone update might need specific handling if authClient supports it directly in updateUser
                    // Assuming authClient.admin.updateUser supports these fields
                },
            })

            if (error) {
                throw new Error(error.message)
            }

            toast.success({ title: t('admin.users.detail.successTitle'), description: t('admin.users.detail.updateSuccess'), duration: 3000 })
            isEditing.value = false
            emit('updated')
        } catch (error: unknown) {
            toast.danger({ title: t('admin.users.detail.errorTitle'), description: getApiErrorMessage(error, t('admin.users.detail.updateFailed')), duration: 3000 })
        }
    })
}

const handleSyncUserAdminRole = async () => {
    const targetUser = props.user
    if (!targetUser) return

    try {
        loading.value = true
        const result = await syncAdminRole(targetUser.id)

        if (result.success) {
            toast.success({
                title: t('admin.users.detail.syncSuccessTitle'),
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            return
        }

        toast.warning({
            title: t('admin.users.detail.syncDoneTitle'),
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('Failed to sync admin role:', error)
        toast.danger({
            title: t('admin.users.detail.syncFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.detail.syncFailed')),
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}

const handleSetUserAsAdmin = async () => {
    const targetUser = props.user
    if (!targetUser) return

    const confirmed = await confirm.open({
        title: t('admin.users.detail.confirmMakeAdminTitle'),
        description: t('admin.users.detail.confirmMakeAdminDescription', { name: targetUser.name || targetUser.email }),
        tone: 'neutral',
    })
    if (!confirmed) {
        return
    }

    try {
        loading.value = true
        const result = await addAdminRole(targetUser.id)

        if (result.success) {
            toast.success({
                title: t('admin.users.detail.makeAdminSuccessTitle'),
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
            return
        }

        toast.warning({
            title: t('admin.users.detail.makeAdminFailedTitle'),
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('Failed to grant admin role:', error)
        toast.danger({
            title: t('admin.users.detail.makeAdminFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.detail.makeAdminFailed')),
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}

const handleRemoveUserAdminRole = async () => {
    const targetUser = props.user
    if (!targetUser) return

    if (isCurrentUser(targetUser.id)) {
        toast.warning({
            title: t('admin.users.detail.operationNotAllowedTitle'),
            description: t('admin.users.detail.cannotRemoveSelfDescription'),
            duration: 3000,
        })
        return
    }

    const confirmed = await confirm.open({
        title: t('admin.users.detail.confirmRemoveTitle'),
        description: t('admin.users.detail.confirmRemoveDescription', { name: targetUser.name || targetUser.email }),
        tone: 'danger',
    })
    if (!confirmed) {
        return
    }

    try {
        loading.value = true
        const result = await removeAdminRole(targetUser.id)

        if (result.success) {
            toast.success({
                title: t('admin.users.detail.removeSuccessTitle'),
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
            return
        }

        toast.warning({
            title: t('admin.users.detail.removeFailedTitle'),
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('Failed to remove admin role:', error)
        toast.danger({
            title: t('admin.users.detail.removeFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.detail.removeFailed')),
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}

const handleUnbanUser = async () => {
    const targetUser = props.user
    if (!targetUser) return

    try {
        const response = await authClient.admin.unbanUser({
            userId: targetUser.id,
        })

        if (response.data) {
            toast.success({
                title: t('admin.users.detail.unbanSuccessTitle'),
                description: t('admin.users.detail.unbanSuccessDescription'),
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
        }
    } catch (error: unknown) {
        console.error('Failed to unban user:', error)
        toast.danger({
            title: t('admin.users.detail.unbanFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.detail.unbanFailed')),
            duration: 3000,
        })
    }
}
</script>

<style lang="scss" scoped>
.user-detail {
    &__section {
        margin-bottom: 2rem;
    }

    &__section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    &__section-title {
        color: $primary;
        margin: 0;
        font-size: 1.2rem;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    &__item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
            font-weight: 600;
            color: var(--admin-muted);
            font-size: 0.9rem;
        }

        span {
            color: var(--admin-text);
        }
    }

    &__verification {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 1rem;
        border-top: 1px solid var(--admin-border);
    }
}

.edit-user-form {
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
