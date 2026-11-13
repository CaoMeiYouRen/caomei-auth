<template>
    <div class="security-section">
        <h3 class="section-title">
            会话管理
        </h3>
        <p class="section-desc">
            管理您的活动会话，撤销不再需要的会话。
        </p>
        <ul class="security-device-list">
            <li class="device-list-header">
                <span>会话令牌</span>
                <span>浏览器</span>
                <span>操作系统</span>
                <span>IP 地址</span>
                <span>创建时间</span>
                <span>过期时间</span>
                <span class="device-action-col" />
            </li>
            <li
                v-for="session in sessionList"
                :key="session.id"
                class="device-list-row"
            >
                <BaseTooltip
                    v-if="userSession?.session?.id === session.id"
                    :content="'当前正在使用的会话，令牌为：' + session.id"
                >
                    <span>当前会话</span>
                </BaseTooltip>
                <BaseTooltip
                    v-else
                    :content="'会话令牌：' + session.id"
                >
                    <span data-visual-mask>{{ session.id }}</span>
                </BaseTooltip>
                <span>{{ session.browser }}</span>
                <span>{{ session.os }}</span>
                <span data-visual-mask>{{ session.ipAddress }}</span>
                <span data-visual-mask>{{ session.createdAt }}</span>
                <span data-visual-mask>{{ session.expiresAt }}</span>
                <span class="device-action-col">
                    <BaseTooltip :content="userSession?.session?.id === session.id ? '无法撤销当前会话' : '点击撤销此会话'">
                        <CaomeiButton
                            variant="secondary"
                            class="btn"
                            :disabled="userSession?.session?.id === session.id"
                            @click="$emit('revokeSession', session.token)"
                        >
                            <template #icon>
                                <i class="mdi mdi-close" />
                            </template>
                            撤销会话
                        </CaomeiButton>
                    </BaseTooltip>
                </span>
            </li>
        </ul>
        <div class="security-actions">
            <BaseTooltip content="点击撤销除当前会话外的所有其他会话">
                <CaomeiButton
                    class="btn"
                    @click="$emit('revokeOtherSessions')"
                >
                    <template #icon>
                        <i class="mdi mdi-logout-variant" />
                    </template>
                    撤销其他会话
                </CaomeiButton>
            </BaseTooltip>
            <BaseTooltip content="注意：点击撤销所有会话，包括当前会话！">
                <CaomeiButton
                    class="btn"
                    @click="$emit('revokeAllSessions')"
                >
                    <template #icon>
                        <i class="mdi mdi-logout-variant" />
                    </template>
                    撤销所有会话
                </CaomeiButton>
            </BaseTooltip>
        </div>

        <!-- 撤销单个会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeSessionConfirm"
            title="确认撤销会话"
            @update:visible="$emit('update:showRevokeSessionConfirm', $event)"
        >
            <p>确定要撤销该会话吗？</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeSessionConfirm', false)"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeSession')">
                    确认
                </CaomeiButton>
            </template>
        </BaseDialogV2>
        <!-- 撤销其他会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeOtherSessionsConfirm"
            title="确认撤销其他会话"
            @update:visible="$emit('update:showRevokeOtherSessionsConfirm', $event)"
        >
            <p>确定要撤销除当前会话外的所有其他会话吗？</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeOtherSessionsConfirm', false)"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeOtherSessions')">
                    确认
                </CaomeiButton>
            </template>
        </BaseDialogV2>
        <!-- 撤销所有会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeAllSessionsConfirm"
            title="确认撤销所有会话"
            @update:visible="$emit('update:showRevokeAllSessionsConfirm', $event)"
        >
            <p>确定要撤销所有会话，包括当前会话吗？</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeAllSessionsConfirm', false)"
                >
                    取消
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeAllSessions')">
                    确认
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    userSession: any
    sessionList: any[]
    showRevokeSessionConfirm: boolean
    showRevokeOtherSessionsConfirm: boolean
    showRevokeAllSessionsConfirm: boolean
}>()

defineEmits<{
    (e: 'revokeSession', token: string): void
    (e: 'revokeOtherSessions'): void
    (e: 'revokeAllSessions'): void
    (e: 'confirmRevokeSession'): void
    (e: 'confirmRevokeOtherSessions'): void
    (e: 'confirmRevokeAllSessions'): void
    (e: 'update:showRevokeSessionConfirm', value: boolean): void
    (e: 'update:showRevokeOtherSessionsConfirm', value: boolean): void
    (e: 'update:showRevokeAllSessionsConfirm', value: boolean): void
}>()
</script>

<style scoped lang="scss">
.section-title {
    font-size: 1.18rem;
    color: $primary-dark;
    font-weight: 600;
    margin-bottom: 0.7rem;
}

.section-desc {
    color: $secondary-light;
    font-size: 1rem;
    margin-bottom: 1rem;
}

.security-section {
    margin-bottom: 2rem;
}

.security-device-list {
    padding-left: 0;
    width: 100%;

    .device-list-header,
    .device-list-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 0.3rem 0;
        font-size: 1rem;
    }

    .device-list-header {
        font-weight: 600;
        color: $secondary;
        border-bottom: 1px solid $secondary-bg;
        margin-bottom: 0.3rem;

        span {
            flex: 1;
        }

        .device-action-col {
            flex: 0 0 100px;
        }
    }

    .device-list-row {
        span {
            flex: 1;
            word-break: break-all;
        }

        .device-action-col {
            flex: 0 0 100px;
            display: flex;
            justify-content: flex-end;
        }
    }
}

.security-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    justify-content: flex-end;

    .btn {
        max-width: 180px;
    }
}

// 暗色模式支持
@include dark-mode {
    .section-title {
        color: #{$primary-light} !important;
    }

    .section-desc {
        color: #{$dark-secondary-light} !important;
    }

    .security-device-list {
        .device-list-header {
            color: #{$dark-secondary} !important;
            border-color: #{$dark-border-color} !important;
        }

        .device-list-row {
            span {
                color: #{$dark-secondary-light} !important;
            }
        }
    }
}
</style>
