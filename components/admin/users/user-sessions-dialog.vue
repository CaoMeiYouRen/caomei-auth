<template>
    <Dialog
        :visible="visible"
        modal
        header="用户会话"
        :style="{width: '700px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="user-sessions">
            <div class="sessions-header">
                <h4>{{ user.name || user.email }} 的活跃会话</h4>
                <Button
                    label="撤销所有会话"
                    severity="danger"
                    outlined
                    size="small"
                    :loading="revokeAllLoading"
                    @click="revokeAllUserSessions"
                />
            </div>

            <DataTable :value="userSessions" :loading="sessionsLoading">
                <Column field="id" header="会话ID">
                    <template #body="{data}">
                        <code class="session-id">{{ data.token.substring(0, 16) }}...</code>
                    </template>
                </Column>

                <Column field="userAgent" header="设备信息">
                    <template #body="{data}">
                        <div class="device-info">
                            <div>{{ parseUserAgent(data.userAgent).browser }}</div>
                            <small>{{ parseUserAgent(data.userAgent).os }}</small>
                        </div>
                    </template>
                </Column>

                <Column field="createdAt" header="创建时间">
                    <template #body="{data}">
                        {{ formatDateTime(data.createdAt) }}
                    </template>
                </Column>

                <Column field="expiresAt" header="到期时间">
                    <template #body="{data}">
                        {{ formatDateTime(data.expiresAt) }}
                    </template>
                </Column>

                <Column header="操作">
                    <template #body="{data}">
                        <Button
                            label="撤销"
                            severity="danger"
                            outlined
                            size="small"
                            :loading="revokingSession === data.token"
                            @click="revokeUserSession(data.token)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { authClient } from '@/lib/auth-client'
import { parseUserAgent } from '@/utils/useragent'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
    visible: boolean
    user: any
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const toast = useToast()
const confirm = useConfirm()

const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const revokingSession = ref('')
const userSessions = ref<any[]>([])

const loadUserSessions = async () => {
    if (!props.user) return

    try {
        sessionsLoading.value = true
        const response = await authClient.admin.listUserSessions({
            userId: props.user.id,
        })
        userSessions.value = response.data?.sessions || []
    } catch (error: any) {
        console.error('加载用户会话失败:', error)
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message || '加载用户会话失败',
            life: 3000,
        })
    } finally {
        sessionsLoading.value = false
    }
}

watch(() => props.visible, (newValue) => {
    if (newValue && props.user) {
        loadUserSessions()
    }
})

const revokeUserSession = async (sessionToken: string) => {
    try {
        revokingSession.value = sessionToken

        const response = await authClient.admin.revokeUserSession({
            sessionToken,
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '撤销成功',
                detail: '会话已撤销',
                life: 3000,
            })
            loadUserSessions()
        }
    } catch (error: any) {
        console.error('撤销会话失败:', error)
        toast.add({
            severity: 'error',
            summary: '撤销失败',
            detail: error.message || '撤销会话失败',
            life: 3000,
        })
    } finally {
        revokingSession.value = ''
    }
}

const revokeAllUserSessions = async () => {
    if (!props.user) return

    confirm.require({
        message: `确定要撤销 ${props.user.name || props.user.email} 的所有会话吗？`,
        header: '确认撤销',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                revokeAllLoading.value = true

                const response = await authClient.admin.revokeUserSessions({
                    userId: props.user.id,
                })

                if (response.data) {
                    toast.add({
                        severity: 'success',
                        summary: '撤销成功',
                        detail: '所有会话已撤销',
                        life: 3000,
                    })
                    emit('update:visible', false)
                }
            } catch (error: any) {
                console.error('撤销所有会话失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '撤销失败',
                    detail: error.message || '撤销所有会话失败',
                    life: 3000,
                })
            } finally {
                revokeAllLoading.value = false
            }
        },
    })
}
</script>

<style lang="scss" scoped>
.user-sessions {
    .sessions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;

        h4 {
            margin: 0;
            color: $primary;
        }
    }

    .session-id {
        background: #f1f5f9;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.8rem;
    }

    .device-info {
        div {
            font-weight: 500;
        }

        small {
            color: $secondary-light;
        }
    }
}
</style>
