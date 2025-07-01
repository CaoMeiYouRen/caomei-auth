<template>
    <div class="auth-container">
        <AuthLeft
            title="账号安全设置"
            subtitle="管理您的账号安全，设置多因子认证、查看登录日志、管理已登录设备等。"
        />
        <div class="auth-right">
            <div class="auth-card security-card">
                <h2 class="auth-title">
                    账号安全设置
                </h2>
                <p class="auth-subtitle">
                    管理您的账号安全，设置多因子认证、查看登录日志、管理已登录设备等。
                </p>
                <div class="security-section">
                    <h3 class="section-title">
                        多因子认证（MFA）
                    </h3>
                    <p class="section-desc">
                        启用多因子认证可大幅提升账号安全性。支持 TOTP（如 Google
                        Authenticator）、邮箱验证码、短信验证码等多种方式。
                    </p>
                    <Button
                        class="btn btn-primary"
                        label="设置多因子认证"
                        icon="mdi mdi-shield-key-outline"
                    />
                </div>
                <div class="divider" />
                <div class="security-section">
                    <h3 class="section-title">
                        登录日志
                    </h3>
                    <p class="section-desc">
                        查看近期登录记录，及时发现异常登录行为。
                    </p>
                    <ul class="security-log-list">
                        <li v-for="log in logs" :key="log.id">
                            <span>{{ log.time }}</span>
                            <span>{{ log.device }}</span>
                            <span>{{ log.location }}</span>
                            <span :class="['status', log.status]">{{
                                log.status === "success" ? "成功" : "失败"
                            }}</span>
                        </li>
                    </ul>
                </div>
                <div class="divider" />
                <div class="security-section">
                    <h3 class="section-title">
                        设备管理
                    </h3>
                    <p class="section-desc">
                        管理已登录设备，移除不再使用的设备，保障账号安全。
                    </p>
                    <ul class="security-device-list">
                        <li class="device-list-header">
                            <span>设备</span>
                            <span>最近活跃</span>
                            <span class="device-action-col" />
                        </li>
                        <li
                            v-for="device in devices"
                            :key="device.id"
                            class="device-list-row"
                        >
                            <span>{{ device.name }}</span>
                            <span>{{ device.lastActive }}</span>
                            <span class="device-action-col">
                                <Button
                                    class="btn btn-danger"
                                    label="移除"
                                    icon="mdi mdi-close"
                                    @click="removeDevice(device.id)"
                                />
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import AuthLeft from '@/components/auth-left.vue'

const logs = ref([
    {
        id: 1,
        time: '2025-06-30 21:00',
        device: 'Chrome · Windows',
        location: '北京',
        status: 'success',
    },
    {
        id: 2,
        time: '2025-06-29 19:12',
        device: 'Safari · iPhone',
        location: '上海',
        status: 'success',
    },
    {
        id: 3,
        time: '2025-06-28 08:45',
        device: 'Edge · Windows',
        location: '未知',
        status: 'fail',
    },
])

const devices = ref([
    { id: 1, name: 'Chrome · Windows', lastActive: '2025-06-30 21:00' },
    { id: 2, name: 'Safari · iPhone', lastActive: '2025-06-29 19:12' },
])

function removeDevice(id: number) {
    devices.value = devices.value.filter((d) => d.id !== id)
}
</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.auth-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column-reverse;
    background: $background;
    @media (min-width: 768px) {
        flex-direction: row;
    }
}
.auth-right {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 60vh;
    width: 100%;
    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;
    }
}
.auth-card.security-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 520px;
}
.auth-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    text-align: center;
}
.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
    text-align: center;
}
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
    ul {
        padding-left: 0;
        li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
            display: flex;
            align-items: center;
            gap: 1.2rem;
        }
    }
}
.btn {
    padding: 0.4rem 1.2rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    &.btn-primary {
        background: $primary;
        color: #fff;
        &:hover {
            background: $primary-dark;
        }
    }
    &.btn-danger {
        background: #e63946;
        color: #fff;
        &:hover {
            background: #a52834;
        }
    }
}
.status {
    font-size: 0.95rem;
    &.success {
        color: #43a047;
    }
    &.fail {
        color: #e63946;
    }
}
.divider {
    border-bottom: 1px solid $secondary-bg;
    margin: 2rem 0;
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
@media (max-width: 600px) {
    .auth-container {
        padding: 1.2rem 1.2rem;
    }
    .auth-title {
        font-size: 1.3rem;
    }
    .auth-card.security-card {
        padding: 1rem;
    }
}
</style>
