<template>
    <BaseDialog
        :visible="visible"
        :title="isEditing ? '编辑用户' : '用户详情'"
        width="600px"
        :show-footer="false"
        @update:visible="onClose"
    >
        <div v-if="user" class="user-detail">
            <div v-if="!isEditing">
                <div class="detail-section">
                    <div class="flex items-center justify-between mb-3">
                        <h3>基本信息</h3>
                        <Button
                            icon="mdi mdi-pencil"
                            label="编辑"
                            size="small"
                            text
                            @click="isEditing = true"
                        />
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID</label>
                            <span>{{ user.id }}</span>
                        </div>
                        <div class="detail-item">
                            <label>昵称</label>
                            <span>{{ user.name || '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>邮箱</label>
                            <span>{{ user.email }}</span>
                        </div>
                        <div class="detail-item">
                            <label>手机号</label>
                            <span>{{ user.phoneNumber ? formatPhoneNumberInternational(user.phoneNumber) : '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>用户名</label>
                            <span>{{ user.username || '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>角色</label>
                            <BaseStatusBadge
                                variant="role"
                                :status="user.role"
                            />
                        </div>
                        <div class="detail-item">
                            <label>验证状态</label>
                            <div class="verification-status">
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

                <div class="detail-section">
                    <h3>账户状态</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>状态</label>
                            <BaseStatusBadge
                                variant="banned"
                                :status="user.banned"
                            />
                        </div>
                        <div v-if="user.banned" class="detail-item">
                            <label>禁用原因</label>
                            <span>{{ user.banReason || '未提供原因' }}</span>
                        </div>
                        <div v-if="user.banned && user.banExpires" class="detail-item">
                            <label>禁用到期时间</label>
                            <span>{{ formatDateTime(user.banExpires) }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>时间信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>注册时间</label>
                            <span>{{ formatDateTime(user.createdAt) }}</span>
                        </div>
                        <div class="detail-item">
                            <label>更新时间</label>
                            <span>{{ formatDateTime(user.updatedAt) }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-actions">
                    <Button
                        label="查看会话"
                        icon="mdi mdi-account-multiple"
                        severity="info"
                        @click="$emit('view-sessions', user)"
                    />
                    <Button
                        label="同步管理员角色"
                        icon="mdi mdi-sync"
                        severity="secondary"
                        :loading="loading"
                        @click="handleSyncUserAdminRole"
                    />
                    <Button
                        v-if="!user.role?.includes('admin')"
                        label="设为管理员"
                        icon="mdi mdi-shield-account"
                        severity="help"
                        :loading="loading"
                        @click="handleSetUserAsAdmin"
                    />
                    <Button
                        v-else-if="user.role?.includes('admin') && !isCurrentUser(user.id)"
                        label="移除管理员"
                        icon="mdi mdi-shield-remove"
                        severity="danger"
                        :loading="loading"
                        @click="handleRemoveUserAdminRole"
                    />
                    <Button
                        v-else-if="user.role?.includes('admin') && isCurrentUser(user.id)"
                        label="不能移除自己的管理员权限"
                        icon="mdi mdi-shield-remove"
                        severity="danger"
                        disabled
                    />
                    <Button
                        v-if="!user.banned && user.role !== 'admin' && !isCurrentUser(user.id)"
                        label="禁用用户"
                        icon="mdi mdi-block-helper"
                        severity="warning"
                        @click="$emit('ban', user)"
                    />
                    <Button
                        v-else-if="user.banned && user.role !== 'admin' && !isCurrentUser(user.id)"
                        label="解禁用户"
                        icon="mdi mdi-check-circle"
                        severity="success"
                        @click="handleUnbanUser"
                    />
                    <Button
                        v-else-if="isCurrentUser(user.id)"
                        label="不能操作自己的账户"
                        icon="mdi mdi-account-alert"
                        severity="warning"
                        disabled
                    />
                    <Button
                        v-if="user.role === 'admin' && !user.banned"
                        label="管理员不可禁用"
                        icon="mdi mdi-block-helper"
                        severity="warning"
                        disabled
                    />
                </div>
            </div>

            <form
                v-else
                class="edit-user-form"
                @submit.prevent="updateUser"
            >
                <BaseInput
                    id="editNickname"
                    v-model="editNickname"
                    label="昵称"
                    placeholder="请输入昵称"
                    :error="errors.nickname"
                    required
                />
                <BaseInput
                    id="editEmail"
                    v-model="editEmail"
                    label="邮箱"
                    type="email"
                    placeholder="请输入邮箱"
                    :error="errors.email"
                    required
                />
                <BaseInput
                    id="editPhone"
                    v-model="editPhone"
                    label="手机号"
                    placeholder="请输入手机号"
                    :error="errors.phone"
                />
                <BaseFormGroup
                    label="角色"
                    for="editRole"
                    :error="errors.role"
                >
                    <Select
                        id="editRole"
                        v-model="editRole"
                        :options="roleOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="选择角色"
                        class="w-full"
                        :class="{'p-invalid': errors.role}"
                    />
                </BaseFormGroup>
                <BasePassword
                    id="editPassword"
                    v-model="editPassword"
                    label="新密码"
                    placeholder="留空则不修改密码"
                    :error="errors.password"
                    :feedback="false"
                    toggle-mask
                />

                <div class="border-gray-200 border-t dialog-footer flex gap-2 justify-end mt-4 pt-4">
                    <Button
                        label="取消"
                        severity="secondary"
                        @click="isEditing = false"
                    />
                    <Button
                        label="保存"
                        type="submit"
                        :loading="updateLoading"
                    />
                </div>
            </form>
        </div>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { authClient } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/shared/phone'
import { formatDateTime } from '@/utils/shared/date'
import { syncAdminRole, addAdminRole, removeAdminRole } from '@/utils/web/admin-role-client'
import { useUserTable } from '@/composables/admin/use-user-table'
import { useForm } from '@/composables/core/use-form'
import { updateUserFormSchema } from '@/utils/shared/schemas'

const props = defineProps<{
    visible: boolean
    user: any
    currentUserId?: string
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'updated'): void
    (e: 'view-sessions', user: any): void
    (e: 'ban', user: any): void
}>()

const toast = useToast()
const confirm = useConfirm()
const { getRoleLabel, getRoleSeverity, roleOptions } = useUserTable()

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
    await handleSubmit(async (vals) => {
        try {
            const { error } = await authClient.admin.updateUser({
                userId: props.user.id,
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

            toast.add({ severity: 'success', summary: '成功', detail: '用户信息更新成功', life: 3000 })
            isEditing.value = false
            emit('updated')
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '错误', detail: error.message || '更新失败', life: 3000 })
        }
    })
}

const handleSyncUserAdminRole = async () => {
    try {
        loading.value = true
        const result = await syncAdminRole(props.user.id)

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '同步成功',
                detail: result.message,
                life: 3000,
            })
            emit('updated')
        } else {
            toast.add({
                severity: 'warning',
                summary: '同步完成',
                detail: result.message,
                life: 3000,
            })
        }
    } catch (error: any) {
        console.error('同步管理员角色失败:', error)
        toast.add({
            severity: 'error',
            summary: '同步失败',
            detail: error.message || '同步管理员角色失败',
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const handleSetUserAsAdmin = async () => {
    confirm.require({
        message: `确定要将用户 ${props.user.name || props.user.email} 设置为管理员吗？`,
        header: '确认设置管理员',
        icon: 'mdi mdi-shield-account',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-success',
        accept: async () => {
            try {
                loading.value = true
                const result = await addAdminRole(props.user.id)

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: '设置成功',
                        detail: result.message,
                        life: 3000,
                    })
                    emit('updated')
                    emit('update:visible', false)
                } else {
                    toast.add({
                        severity: 'warning',
                        summary: '设置失败',
                        detail: result.message,
                        life: 3000,
                    })
                }
            } catch (error: any) {
                console.error('设置管理员角色失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '设置失败',
                    detail: error.message || '设置管理员角色失败',
                    life: 3000,
                })
            } finally {
                loading.value = false
            }
        },
    })
}

const handleRemoveUserAdminRole = async () => {
    if (isCurrentUser(props.user.id)) {
        toast.add({
            severity: 'warn',
            summary: '操作不允许',
            detail: '不能移除自己的管理员权限',
            life: 3000,
        })
        return
    }

    confirm.require({
        message: `确定要移除用户 ${props.user.name || props.user.email} 的管理员角色吗？`,
        header: '确认移除管理员角色',
        icon: 'mdi mdi-shield-remove',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                loading.value = true
                const result = await removeAdminRole(props.user.id)

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: '移除成功',
                        detail: result.message,
                        life: 3000,
                    })
                    emit('updated')
                    emit('update:visible', false)
                } else {
                    toast.add({
                        severity: 'warning',
                        summary: '移除失败',
                        detail: result.message,
                        life: 3000,
                    })
                }
            } catch (error: any) {
                console.error('移除管理员角色失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '移除失败',
                    detail: error.message || '移除管理员角色失败',
                    life: 3000,
                })
            } finally {
                loading.value = false
            }
        },
    })
}

const handleUnbanUser = async () => {
    try {
        const response = await authClient.admin.unbanUser({
            userId: props.user.id,
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '解禁成功',
                detail: '用户已解除禁用',
                life: 3000,
            })
            emit('updated')
            emit('update:visible', false)
        }
    } catch (error: any) {
        console.error('解禁用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '解禁失败',
            detail: error.message || '解禁用户失败',
            life: 3000,
        })
    }
}
</script>

<style lang="scss" scoped>
.user-detail {
    .detail-section {
        margin-bottom: 2rem;

        h3 {
            color: $primary;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                label {
                    font-weight: 600;
                    color: $secondary-light;
                    font-size: 0.9rem;
                }

                span {
                    color: $secondary;
                }

                .verification-status {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
            }
        }
    }

    .detail-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }
}
</style>
