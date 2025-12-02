<template>
    <Dialog
        :visible="visible"
        modal
        header="用户详情"
        :style="{width: '600px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="user-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
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
                        <Tag
                            :value="getRoleLabel(user.role)"
                            :severity="getRoleSeverity(user.role)"
                        />
                    </div>
                    <div class="detail-item">
                        <label>验证状态</label>
                        <div class="verification-status">
                            <Tag
                                :value="user.emailVerified ? '邮箱已验证' : '邮箱未验证'"
                                :severity="user.emailVerified ? 'success' : 'warning'"
                                size="small"
                            />
                            <Tag
                                :value="user.phoneNumberVerified ? '手机已验证' : '手机未验证'"
                                :severity="user.phoneNumberVerified ? 'success' : 'warning'"
                                size="small"
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
                        <Tag
                            :value="user.banned ? '已禁用' : '正常'"
                            :severity="user.banned ? 'danger' : 'success'"
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
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { authClient } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/phone'
import { formatDateTime } from '@/utils/date'
import { syncAdminRole, addAdminRole, removeAdminRole } from '@/utils/admin-role-client'
import { useUserTable } from '@/composables/admin/use-user-table'

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
const { getRoleLabel, getRoleSeverity } = useUserTable()

const loading = ref(false)

const isCurrentUser = (userId: string) => props.currentUserId === userId

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
