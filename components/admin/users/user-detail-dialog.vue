<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? '编辑用户' : '用户详情'"
        size="lg"
        @update:visible="onClose"
    >
        <div v-if="user" class="user-detail">
            <div v-if="!isEditing">
                <div class="user-detail__section">
                    <div class="user-detail__section-header">
                        <h3 class="user-detail__section-title">
                            基本信息
                        </h3>
                        <CaomeiButton
                            variant="ghost"
                            size="sm"
                            @click="isEditing = true"
                        >
                            <template #icon>
                                <i class="mdi mdi-pencil" />
                            </template>
                            编辑
                        </CaomeiButton>
                    </div>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>ID</label>
                            <span>{{ user.id }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>昵称</label>
                            <span>{{ user.name || '未设置' }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>邮箱</label>
                            <span>{{ user.email }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>手机号</label>
                            <span>{{ user.phoneNumber ? formatPhoneNumberInternational(user.phoneNumber) : '未设置' }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>用户名</label>
                            <span>{{ user.username || '未设置' }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>角色</label>
                            <BaseStatusBadge
                                variant="role"
                                :status="user.role"
                            />
                        </div>
                        <div class="user-detail__item">
                            <label>验证状态</label>
                            <div class="user-detail__verification">
                                <BaseStatusBadge
                                    variant="yes-no"
                                    :status="user.emailVerified"
                                    true-label="邮箱已验证"
                                    false-label="邮箱未验证"
                                    true-severity="success"
                                    false-severity="warning"
                                />
                                <BaseStatusBadge
                                    variant="yes-no"
                                    :status="user.phoneNumberVerified"
                                    true-label="手机已验证"
                                    false-label="手机未验证"
                                    true-severity="success"
                                    false-severity="warning"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="user-detail__section">
                    <h3 class="user-detail__section-title">
                        账户状态
                    </h3>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>状态</label>
                            <BaseStatusBadge
                                variant="banned"
                                :status="user.banned"
                            />
                        </div>
                        <div v-if="user.banned" class="user-detail__item">
                            <label>禁用原因</label>
                            <span>{{ user.banReason || '未提供原因' }}</span>
                        </div>
                        <div v-if="user.banned && user.banExpires" class="user-detail__item">
                            <label>禁用到期时间</label>
                            <span>{{ formatDateTime(user.banExpires) }}</span>
                        </div>
                    </div>
                </div>

                <div class="user-detail__section">
                    <h3 class="user-detail__section-title">
                        时间信息
                    </h3>
                    <div class="user-detail__grid">
                        <div class="user-detail__item">
                            <label>注册时间</label>
                            <span>{{ formatDateTime(user.createdAt) }}</span>
                        </div>
                        <div class="user-detail__item">
                            <label>更新时间</label>
                            <span>{{ formatDateTime(user.updatedAt) }}</span>
                        </div>
                    </div>
                </div>

                <div class="user-detail__actions">
                    <CaomeiButton @click="$emit('view-sessions', user)">
                        <template #icon>
                            <i class="mdi mdi-account-multiple" />
                        </template>
                        查看会话
                    </CaomeiButton>
                    <CaomeiButton
                        variant="secondary"
                        :loading="loading"
                        @click="handleSyncUserAdminRole"
                    >
                        <template #icon>
                            <i class="mdi mdi-sync" />
                        </template>
                        同步管理员角色
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
                        设为管理员
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
                        移除管理员
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
                        不能移除自己的管理员权限
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
                        禁用用户
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
                        解禁用户
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
                        不能操作自己的账户
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
                        管理员不可禁用
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
                    label="昵称"
                    placeholder="请输入昵称"
                    :error="errors.nickname"
                    required
                />
                <BaseInputV2
                    id="editEmail"
                    v-model="editEmail"
                    label="邮箱"
                    type="email"
                    placeholder="请输入邮箱"
                    :error="errors.email"
                    required
                />
                <BaseInputV2
                    id="editPhone"
                    v-model="editPhone"
                    label="手机号"
                    placeholder="请输入手机号"
                    :error="errors.phone"
                />
                <CaomeiFormItem
                    id="editRole"
                    label="角色"
                    :error="errors.role"
                >
                    <template #default="field">
                        <CaomeiSelect
                            :id="field.id"
                            v-model="editRole"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="选择角色"
                            :invalid="field.invalid"
                            :aria-labelledby="field['aria-labelledby']"
                            :aria-describedby="field['aria-describedby']"
                        />
                    </template>
                </CaomeiFormItem>
                <BasePasswordV2
                    id="editPassword"
                    v-model="editPassword"
                    label="新密码"
                    placeholder="留空则不修改密码"
                    :error="errors.password"
                />

                <div class="edit-user-form__footer">
                    <CaomeiButton
                        variant="secondary"
                        @click="isEditing = false"
                    >
                        取消
                    </CaomeiButton>
                    <CaomeiButton
                        type="submit"
                        :loading="updateLoading"
                    >
                        保存
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

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

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

            toast.success({ title: '成功', description: '用户信息更新成功', duration: 3000 })
            isEditing.value = false
            emit('updated')
        } catch (error: unknown) {
            toast.danger({ title: '错误', description: errorMessage(error, '更新失败'), duration: 3000 })
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
                title: '同步成功',
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            return
        }

        toast.warning({
            title: '同步完成',
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('同步管理员角色失败:', error)
        toast.danger({
            title: '同步失败',
            description: errorMessage(error, '同步管理员角色失败'),
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
        title: '确认设置管理员',
        description: `确定要将用户 ${targetUser.name || targetUser.email} 设置为管理员吗？`,
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
                title: '设置成功',
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
            return
        }

        toast.warning({
            title: '设置失败',
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('设置管理员角色失败:', error)
        toast.danger({
            title: '设置失败',
            description: errorMessage(error, '设置管理员角色失败'),
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
            title: '操作不允许',
            description: '不能移除自己的管理员权限',
            duration: 3000,
        })
        return
    }

    const confirmed = await confirm.open({
        title: '确认移除管理员角色',
        description: `确定要移除用户 ${targetUser.name || targetUser.email} 的管理员角色吗？`,
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
                title: '移除成功',
                description: result.message,
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
            return
        }

        toast.warning({
            title: '移除失败',
            description: result.message,
            duration: 3000,
        })
    } catch (error: unknown) {
        console.error('移除管理员角色失败:', error)
        toast.danger({
            title: '移除失败',
            description: errorMessage(error, '移除管理员角色失败'),
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
                title: '解禁成功',
                description: '用户已解除禁用',
                duration: 3000,
            })
            emit('updated')
            emit('update:visible', false)
        }
    } catch (error: unknown) {
        console.error('解禁用户失败:', error)
        toast.danger({
            title: '解禁失败',
            description: errorMessage(error, '解禁用户失败'),
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
