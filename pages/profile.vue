<template>
    <div class="auth-container">
        <AuthLeft title="个人中心" subtitle="管理您的账号信息。" />
        <div class="auth-right">
            <div class="auth-card profile-card">
                <div class="profile-header">
                    <h2 class="auth-title">
                        个人中心
                    </h2>
                    <div class="profile-header-actions">
                        <Button
                            label="账号安全设置"
                            class="btn btn-link"
                            icon="mdi mdi-shield-account-outline"
                            @click="goSecurity"
                        />
                    </div>
                </div>
                <p class="auth-subtitle">
                    管理您的账号信息
                </p>
                <div class="profile-section">
                    <div class="avatar-block">
                        <img
                            :src="user.avatar || '/logo.png'"
                            class="avatar"
                            alt="avatar"
                        >
                        <Button
                            label="更换头像"
                            text
                            size="small"
                            icon="mdi mdi-camera"
                            disabled
                        />
                    </div>
                    <div class="info-block">
                        <div class="form-group">
                            <label class="form-label" for="username">用户名</label>
                            <InputText
                                id="username"
                                v-model="user.username"
                                class="form-input"
                                disabled
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="nickname">昵称</label>
                            <InputText
                                id="nickname"
                                v-model="user.nickname"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <div class="profile-row">
                                <span>{{ user.email || "未绑定" }}</span>
                                <Button
                                    v-if="user.email"
                                    label="修改"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="showEmailModal = true"
                                />
                                <Button
                                    v-else
                                    label="绑定"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="showEmailModal = true"
                                />
                                <span v-if="user.emailVerified" class="verified">已验证</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <div class="profile-row">
                                <span>{{ user.phone ? formatPhoneNumberInternational(user.phone) : "未绑定" }}</span>
                                <Button
                                    v-if="user.phone"
                                    label="修改"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="showPhoneModal = true"
                                />
                                <Button
                                    v-else
                                    label="绑定"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="showPhoneModal = true"
                                />
                                <span v-if="user.phoneVerified" class="verified">已验证</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">第三方账号</label>
                            <div class="social-list">
                                <Button
                                    class="social-btn social-github"
                                    icon="mdi mdi-github"
                                    label="GitHub"
                                    :class="{linked: user.githubLinked}"
                                    @click="toggleSocial('github')"
                                />
                                <Button
                                    class="social-btn social-google"
                                    icon="mdi mdi-google"
                                    label="Google"
                                    :class="{linked: user.googleLinked}"
                                    @click="toggleSocial('google')"
                                />
                            </div>
                        </div>
                        <div class="form-group profile-actions">
                            <Button
                                label="保存修改"
                                class="btn btn-primary"
                                :loading="saving"
                                @click="saveProfile"
                            />
                            <Button
                                label="修改密码"
                                class="btn btn-link ml-3"
                                @click="goChangePassword"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 邮箱弹窗 -->
        <Dialog
            v-model:visible="showEmailModal"
            modal
            header="修改邮箱"
            :closable="true"
            :style="{width: '400px'}"
        >
            <div class="form-group">
                <InputText
                    v-model="email"
                    class="form-input"
                    placeholder="请输入新邮箱"
                />
            </div>
            <div class="form-group">
                <Button
                    label="发送验证链接"
                    class="btn btn-primary w-full"
                    :loading="sendingVerificationLink"
                    @click="bindEmail"
                />
            </div>
        </Dialog>
        <Dialog
            v-model:visible="showPhoneModal"
            modal
            header="修改手机号"
            :closable="true"
            :style="{width: '400px'}"
        >
            <div class="form-group">
                <InputText
                    v-model="phone"
                    class="form-input"
                    placeholder="请输入新手机号"
                />
                <Message
                    v-if="errors.phone"
                    severity="error"
                    size="small"
                    variant="simple"
                >
                    {{ errors.phone }}
                </Message>
            </div>
            <div class="flex-row form-group">
                <InputText
                    v-model="phoneCode"
                    class="form-input"
                    placeholder="验证码"
                />
                <SendCodeButton
                    :on-send="sendPhoneCode"
                    :duration="60"
                    :disabled="phoneCodeSending || !validatePhone(phone)"
                    :loading="phoneCodeSending"
                    text="发送验证码"
                    resend-text="重新发送"
                />
            </div>
            <div class="form-group">
                <Button
                    label="确认修改"
                    class="btn btn-primary w-full"
                    :loading="bindingPhone"
                    @click="bindPhone"
                />
            </div>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import SendCodeButton from '@/components/send-code-button.vue'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendEmailCode, useSendPhoneCode } from '@/utils/code'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/phone'

const toast = useToast()
const user = reactive({
    username: '',
    nickname: '',
    avatar: '',
    email: '',
    emailVerified: false,
    phone: '',
    phoneVerified: false,
    githubLinked: false,
    googleLinked: false,
})

const saving = ref(false)
const showEmailModal = ref(false)
const showPhoneModal = ref(false)

const email = ref('')
const phone = ref('')
const emailCode = ref('')
const phoneCode = ref('')
const errors = ref<Record<string, string>>({})
const emailCodeSending = ref(false)
const phoneCodeSending = ref(false)
const bindingEmail = ref(false)
const bindingPhone = ref(false)
const sendingVerificationLink = ref(false)

const sendPhoneCode = useSendPhoneCode(
    phone,
    'phone-verification',
    validatePhone,
    errors,
    phoneCodeSending,
)

const session = authClient.useSession()

watch(
    () => session.value.isPending || session.value.isRefetching,
    (status) => {
        if (status) { // 如果 session 正在加载中，则不执行后续逻辑
            return
        }
        const newUser = session.value?.data?.user
        if (newUser) {
            user.username = newUser.username || ''
            user.nickname = newUser.name || ''
            user.avatar = newUser.image || ''
            user.email = newUser.email || ''
            user.emailVerified = newUser.emailVerified || false
            user.phone = newUser.phoneNumber || ''
            user.phoneVerified = newUser.phoneNumberVerified || false
            // user.githubLinked = newUser.githubLinked || false
            // user.googleLinked = newUser.googleLinked || false
        }
    },
    { immediate: true },
)

async function bindEmail() {
    if (!validateEmail(email.value)) {
        toast.add({ severity: 'warn', summary: '请输入有效的邮箱地址', life: 2000 })
        return
    }
    sendingVerificationLink.value = true
    try {
        await authClient.changeEmail({
            newEmail: email.value,
            callbackURL: '/profile', // 验证后重定向
        })
        if (user.emailVerified) {
            toast.add({ severity: 'info', summary: '验证链接已发送到当前邮箱，请查收', life: 2000 })
            return
        }
        user.email = email.value
        user.emailVerified = false
        showEmailModal.value = false
        toast.add({ severity: 'success', summary: '邮箱已更新', life: 2000 })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发送验证链接时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '发送验证链接失败',
            detail: errorMessage,
            life: 2000,
        })
    } finally {
        sendingVerificationLink.value = false
    }
}

async function bindPhone() {
    if (!validatePhone(phone.value) || !phoneCode.value) {
        toast.add({ severity: 'warn', summary: '请填写完整', life: 2000 })
        return
    }
    bindingPhone.value = true
    try {
        const result = await authClient.phoneNumber.verify({
            phoneNumber: phone.value,
            code: phoneCode.value,
            updatePhoneNumber: true, // 更新手机号，否则就注册新号了
        })
        if (result.error) {
            throw new Error(result.error.message || '手机号验证失败')
        }
        user.phone = phone.value
        user.phoneVerified = true
        showPhoneModal.value = false
        toast.add({
            severity: 'success',
            summary: '手机号修改成功',
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '手机号修改时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '手机号修改失败',
            detail: errorMessage,
            life: 2000,
        })
    } finally {
        bindingPhone.value = false
        phone.value = ''
        phoneCode.value = ''
    }
}
// TODO 处理第三方账号关联
async function toggleSocial(type: 'github' | 'google') {
    try {
        const result = await authClient.linkSocial({
            provider: type,
        })
        if (result.error) {
            throw new Error(result.error.message || `${type} 绑定/解绑失败`)
        }
        user[`${type}Linked`] = !user[`${type}Linked`]
        toast.add({
            severity: 'success',
            summary: user[`${type}Linked`] ? `已绑定${type}` : `已解绑${type}`,
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `${type} 绑定时发生未知错误`
        toast.add({
            severity: 'error',
            summary: `${type} 绑定/解绑失败`,
            detail: errorMessage,
            life: 2000,
        })
    }
}

async function saveProfile() {
    saving.value = true
    try {
        const result = await authClient.updateUser({
            image: user.avatar,
            name: user.nickname,
            // username: user.username,
        })
        if (result.error) {
            throw new Error(result.error.message || '资料保存失败')
        }
        toast.add({ severity: 'success', summary: '资料已保存', life: 2000 })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '资料保存时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '资料保存失败',
            detail: errorMessage,
            life: 2000,
        })
    } finally {
        saving.value = false
    }
}

function goChangePassword() {
    // 跳转到修改密码页面
    navigateTo('/forgot-password')
}

function goSecurity() {
    navigateTo('/security')
}
</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.profile-card {
    max-width: 480px;
}

.profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.profile-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
}

.profile-section {
    margin-bottom: 2rem;
}

.avatar-block {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;

    .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid $primary;
    }
}

.info-block {
    width: 100%;
}

.profile-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.social-list {
    display: flex;
    gap: 1rem;

    .linked {
        background: $primary;
        color: #fff;
    }
}

.verified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.profile-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.section-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: $secondary;
}

.flex-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.social-list {
    .social-btn {
        border: 1px solid $secondary-bg;
        background-color: $background-light;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 1rem;

        &.social-github {
            color: #24292e;
        }

        &.social-google {
            color: #4285f4;
        }

        .p-button-icon {
            margin-right: 0.75rem;
        }
    }
}
</style>
