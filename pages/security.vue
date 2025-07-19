<template>
    <div class="auth-container">
        <!-- <AuthLeft
            title="账号安全设置"
            subtitle="管理您的账号安全，设置多因子认证、查看登录日志、管理已登录设备、会话管理等。"
        /> -->
        <div class="auth-right">
            <div class="auth-card security-card">
                <div class="security-header-actions">
                    <Button
                        label="返回个人中心"
                        class="btn btn-link"
                        icon="mdi mdi-account-circle-outline"
                        severity="secondary"
                        @click="goProfile"
                    />
                </div>
                <h2 class="auth-title">
                    账号安全设置
                </h2>
                <p class="auth-subtitle">
                    管理您的账号安全，设置多因子认证、查看登录日志、管理已登录设备、会话管理等。
                </p>
                <div class="security-section">
                    <h3 class="section-title">
                        双因素认证
                    </h3>
                    <p class="section-desc">
                        启用双因素认证后，登录时除了密码外，还需要输入身份验证器生成的验证码，可以有效防止账号被盗。
                    </p>

                    <!-- 未启用状态 -->
                    <div v-if="!userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
                        <Message severity="warn" icon="mdi mdi-shield-alert">
                            <span>建议启用双因素认证以提高账号安全性</span>
                        </Message>
                        <div class="security-actions">
                            <Button
                                class="btn btn-primary"
                                label="启用双因素认证"
                                icon="mdi mdi-shield-check-outline"
                                @click="enable2FA"
                            />
                        </div>
                    </div>

                    <!-- 已启用状态 -->
                    <div v-if="userSession?.user.twoFactorEnabled && !showTotpSetup && !showBackupCodes">
                        <Alert severity="success" class="mb-4">
                            <i class="mdi mdi-shield-check mr-2" />
                            <span>已启用双因素认证，您的账号受到更好的保护</span>
                        </Alert>
                        <div class="security-actions">
                            <Button
                                class="btn btn-danger"
                                label="禁用双因素认证"
                                icon="mdi mdi-shield-off-outline"
                                severity="danger"
                                @click="disable2FA"
                            />
                        </div>
                    </div>

                    <!-- 设置双因素验证器 -->
                    <div v-if="showTotpSetup" class="totp-setup">
                        <h4 class="mb-3 setup-title">
                            设置身份验证器
                        </h4>
                        <ol class="mb-4 setup-steps">
                            <li>在手机上安装身份验证器应用（如 Google Authenticator、Microsoft Authenticator）</li>
                            <li>使用应用扫描下方二维码</li>
                            <li>输入应用显示的 6 位验证码</li>
                        </ol>

                        <div v-if="qrCodeUrl" class="mb-4 qr-code">
                            <img :src="qrCodeUrl" alt="TOTP QR Code">
                        </div>

                        <div class="mb-4 verification-input">
                            <span class="p-float-label">
                                <InputText
                                    id="verification-code"
                                    v-model="verificationCode"
                                    class="w-full"
                                    maxlength="6"
                                />
                                <label for="verification-code">输入 6 位验证码</label>
                            </span>
                        </div>

                        <div class="security-actions">
                            <Button
                                label="验证并继续"
                                icon="mdi mdi-check"
                                @click="verifyAndEnable2FA"
                            />
                        </div>
                    </div>

                    <!-- 备份恢复码 -->
                    <div v-if="showBackupCodes" class="backup-codes">
                        <h4 class="backup-title mb-3">
                            备份恢复码
                        </h4>
                        <Alert severity="info" class="mb-4">
                            <i class="mdi mdi-information mr-2" />
                            <span>请妥善保管以下恢复码，当您无法访问验证器时，可使用这些恢复码登录。每个恢复码只能使用一次。</span>
                        </Alert>

                        <div class="backup-codes-list mb-4">
                            <div
                                v-for="code in backupCodes"
                                :key="code"
                                class="backup-code"
                            >
                                {{ code }}
                            </div>
                        </div>

                        <div class="security-actions">
                            <Button
                                label="复制恢复码"
                                icon="mdi mdi-content-copy"
                                class="mr-2"
                                @click="copyBackupCodes"
                            />
                            <Button
                                label="下载恢复码"
                                icon="mdi mdi-download"
                                class="mr-2"
                                @click="downloadBackupCodes"
                            />
                            <Button
                                label="完成设置"
                                icon="mdi mdi-check"
                                @click="finishSetup"
                            />
                        </div>
                    </div>
                </div>
                <!-- <div class="divider" />
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
                </div> -->
                <!-- <div class="divider" />
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
                </div> -->
                <div class="divider" />
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
                                    @click="confirmRevokeSession(session.token)"
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
                            @click="confirmRevokeOtherSessions"
                        />
                        <Button
                            v-tooltip.top="'注意：点击撤销所有会话，包括当前会话！'"
                            class="btn"
                            label="撤销所有会话"
                            icon="mdi mdi-logout-variant"
                            @click="confirmRevokeAllSessions"
                        />
                    </div>
                </div>
            </div>
        </div>
        <!-- 撤销单个会话确认对话框 -->
        <Dialog
            v-model:visible="showRevokeSessionConfirm"
            modal
            header="确认撤销会话"
            :closable="true"
            :style="{width: '450px'}"
        >
            <p>确定要撤销该会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="showRevokeSessionConfirm = false"
                />
                <Button
                    v-tooltip.top="'点击确认撤销会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="revokeSingleSession"
                />
            </template>
        </Dialog>
        <!-- 撤销其他会话确认对话框 -->
        <Dialog
            v-model:visible="showRevokeOtherSessionsConfirm"
            modal
            header="确认撤销其他会话"
            :closable="true"
            :style="{width: '450px'}"
        >
            <p>确定要撤销除当前会话外的所有其他会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销其他会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="showRevokeOtherSessionsConfirm = false"
                />
                <Button
                    v-tooltip.top="'点击确认撤销其他会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="revokeOtherSessions"
                />
            </template>
        </Dialog>
        <!-- 撤销所有会话确认对话框 -->
        <Dialog
            v-model:visible="showRevokeAllSessionsConfirm"
            modal
            header="确认撤销所有会话"
            :closable="true"
            :style="{width: '450px'}"
        >
            <p>确定要撤销所有会话，包括当前会话吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消撤销所有会话操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="showRevokeAllSessionsConfirm = false"
                />
                <Button
                    v-tooltip.top="'点击确认撤销所有会话操作'"
                    label="确认"
                    class="btn btn-primary"
                    @click="revokeAllSessions"
                />
            </template>
        </Dialog>

        <!-- 双因素认证密码确认对话框 -->
        <Dialog
            v-model:visible="showPasswordDialog"
            modal
            :header="passwordDialogMode === 'enable' ? '启用双因素认证' : '禁用双因素认证'"
            :closable="true"
            :style="{width: '450px'}"
            @hide="onPasswordDialogHide"
        >
            <div class="p-fluid">
                <p class="mb-3">
                    {{ passwordDialogMode === 'enable'
                        ? '为了确保是您本人操作，请输入密码以启用双因素认证'
                        : '为了确保是您本人操作，请输入密码以禁用双因素认证' }}
                </p>
                <div class="field">
                    <Password
                        v-model="password"
                        :feedback="false"
                        :toggle-mask="true"
                        placeholder="请输入密码"
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    label="取消"
                    severity="secondary"
                    @click="showPasswordDialog = false"
                />
                <Button label="确认" @click="onPasswordConfirm" />
            </template>
        </Dialog>

        <!-- Toast -->
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import type { Prettify } from 'better-auth'
import QRCode from 'qrcode'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'

const toast = useToast()
const { data: userSession } = await authClient.useSession(useFetch)

// 双因素认证状态
const showTotpSetup = ref(false)
const showBackupCodes = ref(false)
const totpUri = ref('')
const qrCodeUrl = ref('')
const verificationCode = ref('')
const backupCodes = ref<string[]>([])
const password = ref('')
const showPasswordDialog = ref(false)
const passwordDialogMode = ref<'enable' | 'disable'>('enable')

// 处理密码对话框关闭
const onPasswordDialogHide = () => {
    password.value = ''
}

// 处理密码确认
const onPasswordConfirm = async () => {
    if (!password.value) {
        toast.add({
            severity: 'warn',
            summary: '警告',
            detail: '请输入密码',
            life: 3000,
        })
        return
    }

    if (passwordDialogMode.value === 'enable') {
        await confirmPassword()
    } else {
        await confirmDisable2FA()
    }
}

// 生成二维码
const generateQRCode = async (text: string) => {
    try {
        qrCodeUrl.value = await QRCode.toDataURL(text)
    } catch (error) {
        console.error('生成二维码失败:', error)
    }
}

// 启用双因素认证
const enable2FA = () => {
    passwordDialogMode.value = 'enable'
    showPasswordDialog.value = true
}

// 确认密码并开始设置
const confirmPassword = async () => {
    try {
        showPasswordDialog.value = false

        // 获取 TOTP URI
        const { data, error } = await authClient.twoFactor.enable({
            password: password.value,
        })

        if (error) {
            throw error
        }

        totpUri.value = data.totpURI
        await generateQRCode(data.totpURI)
        backupCodes.value = data.backupCodes

        showTotpSetup.value = true

        toast.add({
            severity: 'info',
            summary: '提示',
            detail: '请使用身份验证器应用扫描二维码',
            life: 5000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: `设置失败：${error.message || '未知错误'}`,
            life: 3000,
        })
    }
}

// 验证并完成设置
const verifyAndEnable2FA = async () => {
    try {
        if (!verificationCode.value) {
            toast.add({
                severity: 'warn',
                summary: '警告',
                detail: '请输入验证码',
                life: 3000,
            })
            return
        }

        const { error } = await authClient.twoFactor.verifyTotp({
            code: verificationCode.value,
            // trustDevice: true, // 将此设备标记为可信
        })

        if (error) {
            throw error
        }

        // 生成备份码
        // const { data: backupData, error: backupError } = await authClient.twoFactor.generateBackupCodes({
        //     password: password.value,
        // })

        // if (backupError) {
        //     throw backupError
        // }

        // backupCodes.value = backupData.backupCodes
        showTotpSetup.value = false
        showBackupCodes.value = true

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '双因素认证已成功启用！请保存好备份码',
            life: 5000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: `验证失败：${error.message || '未知错误'}`,
            life: 3000,
        })
    }
}

// 禁用双因素认证
const disable2FA = () => {
    passwordDialogMode.value = 'disable'
    showPasswordDialog.value = true
}

// 确认密码并禁用双因素认证
const confirmDisable2FA = async () => {
    try {
        const { error } = await authClient.twoFactor.disable({
            password: password.value,
        })

        if (error) {
            throw error
        }

        showPasswordDialog.value = false
        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '双因素认证已成功禁用',
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: `禁用失败：${error.message || '未知错误'}`,
            life: 3000,
        })
    }
}

// 复制备份码
const copyBackupCodes = () => {
    const codesText = backupCodes.value.join('\n')
    navigator.clipboard.writeText(codesText)
    toast.add({
        severity: 'success',
        summary: '成功',
        detail: '备份码已复制到剪贴板',
        life: 3000,
    })
}

// 下载备份码
const downloadBackupCodes = () => {
    const codesText = backupCodes.value.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${Date.now()}-2fa-backup-codes.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.add({
        severity: 'success',
        summary: '成功',
        detail: '备份码已下载',
        life: 3000,
    })
}

// 完成设置
const finishSetup = () => {
    showBackupCodes.value = false
    password.value = ''
    verificationCode.value = ''
    totpUri.value = ''
    qrCodeUrl.value = ''
    backupCodes.value = []
}

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

const sessions = ref<Prettify<{
    token: string
    expiresAt: Date
    id: string
    createdAt: Date
    updatedAt: Date
    userId: string
    ipAddress?: string | null | undefined
    userAgent?: string | null | undefined
}>[]>([])

const sessionList = computed(() => sessions.value.map((session) => ({
    ...session,
    createdAt: dayjs(session.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs(session.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    expiresAt: dayjs(session.expiresAt).format('YYYY-MM-DD HH:mm:ss'),
    browser: getBrowser(session.userAgent || ''),
    os: getOs(session.userAgent || ''),
})))

// 列出会话
const listSessions = async () => {
    try {
        const response = await authClient.listSessions()
        sessions.value = response.data || []
    } catch (error) {
        console.error('获取会话列表失败:', error)
    }
}

// 撤销会话
const revokeSession = async (token: string) => {
    try {
        await authClient.revokeSession({ token })
        await listSessions() // 刷新会话列表
    } catch (error) {
        console.error('撤销会话失败:', error)
    }
}

// 撤销其他会话
const revokeOtherSessions = async () => {
    try {
        await authClient.revokeOtherSessions()
        await listSessions() // 刷新会话列表
        showRevokeOtherSessionsConfirm.value = false
    } catch (error) {
        console.error('撤销其他会话失败:', error)
    }
}

// 撤销所有会话
const revokeAllSessions = async () => {
    try {
        await authClient.revokeSessions()
        await listSessions() // 刷新会话列表
        showRevokeAllSessionsConfirm.value = false
        navigateTo('/login')
    } catch (error) {
        console.error('撤销所有会话失败:', error)
    }
}

function removeDevice(id: number) {
    devices.value = devices.value.filter((d) => d.id !== id)
}

function goProfile() {
    window.location.href = '/profile'
}

// 新增变量和函数
const showRevokeSessionConfirm = ref(false)
const selectedSessionToken = ref('')

const confirmRevokeSession = (token: string) => {
    selectedSessionToken.value = token
    showRevokeSessionConfirm.value = true
}

const revokeSingleSession = async () => {
    await revokeSession(selectedSessionToken.value)
    showRevokeSessionConfirm.value = false
}

const showRevokeOtherSessionsConfirm = ref(false)
const confirmRevokeOtherSessions = () => {
    showRevokeOtherSessionsConfirm.value = true
}

const showRevokeAllSessionsConfirm = ref(false)
const confirmRevokeAllSessions = () => {
    showRevokeAllSessionsConfirm.value = true
}

onMounted(() => {
    listSessions()
})
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
        width: 100%;
        min-height: 100vh;
    }
}

.auth-card.security-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 1200px;
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

.security-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    .btn-link {
        max-width: 180px;
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

.security-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
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
</style>
