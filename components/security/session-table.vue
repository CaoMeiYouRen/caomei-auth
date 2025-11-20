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
                <span
                    v-if="userSession?.session?.id === session.id"
                    v-tooltip.top="'当前正在使用的会话，令牌为：' + session.id"
                >当前会话</span>
                <span v-else v-tooltip.top="'会话令牌：' + session.id">{{ session.id }}</span>
                <span>{{ session.browser }}</span>
                <span>{{ session.os }}</span>
                <span>{{ session.ipAddress }}</span>
                <span>{{ session.createdAt }}</span>
                <span>{{ session.expiresAt }}</span>
                <span class="device-action-col">
                    <Button
                        v-tooltip.top="userSession?.session?.id === session.id ? '无法撤销当前会话' : '点击撤销此会话'"
                        class="btn"
                        label="撤销会话"
                        icon="mdi mdi-close"
                        :disabled="userSession?.session?.id === session.id"
                        @click="$emit('revokeSession', session.token)"
                    />
                </span>
            </li>
        </ul>
        <div class="security-actions">
            <Button
                v-tooltip.top="'点击撤销除当前会话外的所有其他会话'"
                class="btn"
                label="撤销其他会话"
                icon="mdi mdi-logout-variant"
                @click="$emit('revokeOtherSessions')"
            />
            <Button
                v-tooltip.top="'注意：点击撤销所有会话，包括当前会话！'"
                class="btn"
                label="撤销所有会话"
                icon="mdi mdi-logout-variant"
                @click="$emit('revokeAllSessions')"
            />
        </div>

        <!-- 撤销单个会话确认对话框 -->
        <Dialog
            :visible="showRevokeSessionConfirm"
            modal
            header="确认撤销会话"
            :closable="true"
            :style="{width: '450px'}"
            @update:visible="$emit('update:showRevokeSessionConfirm', $event)"
        >
            <p>确定要撤销该会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="$emit('update:showRevokeSessionConfirm', false)"
                />
                <Button
                    v-tooltip.top="'点击确认撤销会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="$emit('confirmRevokeSession')"
                />
            </template>
        </Dialog>
        <!-- 撤销其他会话确认对话框 -->
        <Dialog
            :visible="showRevokeOtherSessionsConfirm"
            modal
            header="确认撤销其他会话"
            :closable="true"
            :style="{width: '450px'}"
            @update:visible="$emit('update:showRevokeOtherSessionsConfirm', $event)"
        >
            <p>确定要撤销除当前会话外的所有其他会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销其他会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="$emit('update:showRevokeOtherSessionsConfirm', false)"
                />
                <Button
                    v-tooltip.top="'点击确认撤销其他会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="$emit('confirmRevokeOtherSessions')"
                />
            </template>
        </Dialog>
        <!-- 撤销所有会话确认对话框 -->
        <Dialog
            :visible="showRevokeAllSessionsConfirm"
            modal
            header="确认撤销所有会话"
            :closable="true"
            :style="{width: '450px'}"
            @update:visible="$emit('update:showRevokeAllSessionsConfirm', $event)"
        >
            <p>确定要撤销所有会话，包括当前会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销所有会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="$emit('update:showRevokeAllSessionsConfirm', false)"
                />
                <Button
                    v-tooltip.top="'点击确认撤销所有会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="$emit('confirmRevokeAllSessions')"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

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
