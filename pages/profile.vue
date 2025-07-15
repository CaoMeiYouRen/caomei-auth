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
                        <Button
                            label="登出"
                            class="btn btn-link ml-3"
                            icon="mdi mdi-logout"
                            @click="logout"
                        />
                    </div>
                </div>
                <p class="auth-subtitle">
                    管理您的账号信息
                </p>
                <div class="profile-section">
                    <div class="avatar-block">
                        <Image
                            alt="Image"
                            preview
                            :pt="{
                                previewMask: {
                                    style: {
                                        borderRadius: '50%'
                                    }
                                }
                            }"
                        >
                            <template #previewicon>
                                <i class="mdi mdi-magnify" />
                            </template>
                            <template #image>
                                <Avatar
                                    :image="showAvatar"
                                    alt="avatar"
                                    preview
                                    size="xlarge"
                                    shape="circle"
                                />
                            </template>
                            <template #preview="slotProps">
                                <img
                                    :src="showAvatar"
                                    alt="preview"
                                    :style="slotProps.style"
                                    @click="slotProps.previewCallback"
                                >
                            </template>
                        </Image>
                        <FileUpload
                            v-show="false"
                            ref="fileupload"
                            mode="basic"
                            custom-upload
                            auto
                            severity="secondary"
                            class="p-button-outlined"
                            accept="image/*"
                            :max-file-size="MAX_AVATAR_SIZE"
                            @select="onFileSelect"
                        />
                        <Button
                            v-tooltip.top="'点击上传头像'"
                            label=""
                            class="avatar-btn"
                            icon="mdi mdi-camera"
                            severity="contrast"
                            variant="text"
                            size="small"
                            rounded
                            aria-label="Camera"
                            name="file"
                            @click="onSelectAvatar"
                        />
                    </div>
                    <div class="info-block">
                        <div class="form-group">
                            <label class="form-label" for="username">用户名</label>
                            <InputText
                                v-if="user.username"
                                id="username"
                                v-model="user.username"
                                class="form-input"
                                disabled
                            />
                            <template v-if="!user.username">
                                <Message severity="warn">
                                    您当前未设置用户名，无法通过用户名密码登录
                                </Message>
                                <Button
                                    label="设置用户名"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="openSetUsernameDialog"
                                />
                            </template>
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
                                <!-- 已绑定的第三方账号 -->
                                <Button
                                    v-for="account in userAccounts"
                                    :key="account.provider"
                                    v-tooltip.top="`点击可解绑 ${getProviderName(account.provider)} 账号，完整 ID: ${account.accountId}`"
                                    :class="['social-btn', `social-${account.provider}`]"
                                    :icon="`mdi mdi-${account.provider}`"
                                    :label="`${getProviderName(account.provider)}(ID: ${account.accountId.slice(0, 8)}${account.accountId.length > 8 ? '...' : ''})`"
                                    @click="confirmUnlink(account.provider, account.accountId)"
                                />

                                <!-- 绑定新账号   -->
                                <template v-for="provider in socialProviders">
                                    <Button
                                        v-if="!userAccounts.some(account => account.provider === provider.provider)"
                                        :key="provider.provider"
                                        :class="['social-btn', `social-${provider.provider}`]"
                                        :icon="`mdi mdi-${provider.provider}`"
                                        :label="`绑定 ${provider.name}`"
                                        @click="linkSocialAccount(provider.provider)"
                                    />
                                </template>
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
                    :loading="bindingEmail"
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
                <PhoneInput v-model="phone" placeholder="请输入新手机号" />
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

        <!-- 解绑确认对话框 -->
        <Dialog
            v-model:visible="showUnlinkConfirm"
            modal
            header="确认解绑"
            :closable="true"
            :style="{width: '400px'}"
        >
            <p>确定要解绑 {{ getProviderName(selectedProvider) }} 平台，ID 为 {{ selectedAccountId }} 的账号吗？</p>
            <template #footer>
                <Button
                    label="取消"
                    class="btn btn-secondary"
                    @click="showUnlinkConfirm = false"
                />
                <Button
                    label="确认"
                    class="btn btn-primary"
                    @click="unlinkSelectedAccount"
                />
            </template>
        </Dialog>

        <!-- 设置用户名弹窗 -->
        <Dialog
            v-model:visible="showSetUsernameDialog"
            modal
            header="设置用户名"
            :closable="true"
            :style="{width: '400px'}"
        >
            <div class="form-group">
                <InputText
                    v-model="newUsername"
                    class="form-input"
                    placeholder="请输入新用户名"
                />
                <Message
                    v-if="usernameError"
                    severity="error"
                    size="small"
                    variant="simple"
                >
                    {{ usernameError }}
                </Message>
            </div>
            <div class="form-group">
                <Button
                    label="确认设置"
                    class="btn btn-primary w-full"
                    :loading="isSettingUsername"
                    @click="setUsername"
                />
            </div>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import SendCodeButton from '@/components/send-code-button.vue'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendPhoneCode } from '@/utils/code'
import AuthLeft from '@/components/auth-left.vue'
import { authClient, MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_TEXT } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/phone'

const MAX_AVATAR_SIZE = MAX_UPLOAD_SIZE

const toast = useToast()
const user = reactive({
    username: '',
    nickname: '',
    avatar: '',
    email: '',
    emailVerified: false,
    phone: '',
    phoneVerified: false,
})

const saving = ref(false)
const showEmailModal = ref(false)
const showPhoneModal = ref(false)

const email = ref('')
const phone = ref('')
const phoneCode = ref('')
const errors = ref<Record<string, string>>({})
const phoneCodeSending = ref(false)
const bindingEmail = ref(false)
const bindingPhone = ref(false)
// 解绑确认对话框显示状态
const showUnlinkConfirm = ref(false)
// 选中要解绑的提供商
const selectedProvider = ref('')
// 选中要解绑的账号 ID
const selectedAccountId = ref('')

const showSetUsernameDialog = ref(false) // 设置用户名弹窗显示状态
const newUsername = ref('') // 新用户名
const usernameError = ref('') // 用户名错误信息
const isSettingUsername = ref(false) // 设置用户名加载状态

const config = useRuntimeConfig().public
const socialProviders = ref(config.socialProviders as { name: string, provider: string }[])

// 根据 provider 获取对应的名称
const getProviderName = (provider: string) => {
    const providerObj = socialProviders.value.find((p) => p.provider === provider)
    return `${providerObj ? providerObj.name : provider}`
}

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
    async (status) => {
        if (status) { // 如果 session 正在加载中，则不执行后续逻辑
            return
        }
        const newUser = session.value?.data?.user
        if (newUser) {
            user.username = newUser.displayUsername || ''
            user.nickname = newUser.name || ''
            user.avatar = newUser.image || ''
            user.email = newUser.email || ''
            user.emailVerified = newUser.emailVerified || false
            user.phone = newUser.phoneNumber || ''
            user.phoneVerified = newUser.phoneNumberVerified || false
        }
        // await fetchUserAccounts()
    },
    { immediate: true },
)

onMounted(async () => {
    await fetchUserAccounts()
})

async function bindEmail() {
    if (!validateEmail(email.value)) {
        toast.add({ severity: 'warn', summary: '请输入有效的邮箱地址', life: 2000 })
        return
    }
    bindingEmail.value = true
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
            life: 5000,
        })
    } finally {
        bindingEmail.value = false
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
            life: 5000,
        })
    } finally {
        bindingPhone.value = false
        phone.value = ''
        phoneCode.value = ''
    }
}

const userAccounts = ref<{
    id: string
    provider: string
    createdAt: Date
    updatedAt: Date
    accountId: string
    scopes: string[]
}[]>([])

// 获取用户关联的第三方账号
const fetchUserAccounts = async () => {
    try {
        const accounts = await authClient.listAccounts()
        // 过滤掉邮箱登录的账户
        userAccounts.value = accounts.data?.filter((account) => account.provider !== 'credential') || []
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '获取第三方账号信息失败'
        toast.add({
            severity: 'error',
            summary: '获取第三方账号失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}

// 绑定新的第三方账号
async function linkSocialAccount(type: string) {
    try {
        const result = await authClient.linkSocial({
            provider: type,
            callbackURL: '/profile',
        })
        if (result.error) {
            throw new Error(result.error.message || `${type} 绑定失败`)
        }
        await fetchUserAccounts()
        toast.add({
            severity: 'success',
            summary: `正在绑定 ${type} 中`,
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `${type} 绑定时发生未知错误`
        toast.add({
            severity: 'error',
            summary: `${type} 绑定失败`,
            detail: errorMessage,
            life: 5000,
        })
    }
}

// 确认解绑提示
function confirmUnlink(provider: string, accountId: string) {
    selectedProvider.value = provider
    selectedAccountId.value = accountId
    showUnlinkConfirm.value = true
}

// 取消关联第三方账号
async function unlinkSelectedAccount() {
    try {
        const result = await authClient.unlinkAccount({
            providerId: selectedProvider.value,
            accountId: selectedAccountId.value,
        })
        if (result.error) {
            throw new Error(result.error.message || `${selectedProvider.value} 解绑失败`)
        }
        await fetchUserAccounts()
        toast.add({
            severity: 'success',
            summary: `已解绑${selectedProvider.value}`,
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `${selectedProvider.value} 解绑时发生未知错误`
        toast.add({
            severity: 'error',
            summary: `${selectedProvider.value} 解绑失败`,
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        showUnlinkConfirm.value = false
    }
}

// 验证昵称
function validateNickname() {
    if (!nicknameValidator(user.nickname)) {
        errors.value.nickname = '昵称长度需在 2 - 36 个字符之间，仅允许中英文、数字和常见标点符号。'
    } else {
        errors.value.nickname = ''
    }
}

async function saveProfile() {
    validateNickname() // 保存前验证昵称
    if (errors.value.nickname) {
        toast.add({ severity: 'warn', summary: '昵称格式有误', detail: errors.value.nickname, life: 5000 })
        return
    }
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
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}

function openSetUsernameDialog() {
    showSetUsernameDialog.value = true
    newUsername.value = user.username || user.nickname
}

// 设置用户名
async function setUsername() {
    usernameError.value = ''
    if (!validateUsername(newUsername.value)) {
        usernameError.value = '用户名只能包含字母、数字、下划线和连字符，长度在 2 到 36 个字符之间。'
        return
    }
    isSettingUsername.value = true
    try {
        const result = await authClient.updateUser({
            username: newUsername.value,
        })
        if (result.error) {
            throw new Error(result.error.message || '设置用户名失败')
        }
        user.username = newUsername.value
        showSetUsernameDialog.value = false
        toast.add({
            severity: 'success',
            summary: '用户名设置成功',
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '设置用户名时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '设置用户名失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        isSettingUsername.value = false
        newUsername.value = ''
    }
}

function goChangePassword() {
    // 跳转到修改密码页面
    navigateTo('/change-password')
}

function goSecurity() {
    navigateTo('/security')
}

// 登出
async function logout() {
    try {
        await authClient.signOut({})
        toast.add({ severity: 'success', summary: '登出成功', life: 2000 })
        navigateTo('/login') // 重定向到登录页面
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登出时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '登出失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}

// 获取 FileUpload 组件
const fileupload = ref<any>()

function onSelectAvatar() {
    fileupload.value?.choose() // 选择文件
}

// 用于临时显示上传的头像
const tempAvatar = ref<string>()

const showAvatar = computed(() => tempAvatar.value || user.avatar || '/logo.png')

// 处理文件选择事件
async function onFileSelect(event: FileUploadSelectEvent) {
    const file = event.files[0] as File
    if (!file) {
        return
    }

    // 检查文件类型
    if (!file?.type?.startsWith('image/')) {
        toast.add({ severity: 'error', summary: '请选择图片文件', life: 5000 })
        return
    }

    // 检查文件大小
    if (file?.size > MAX_AVATAR_SIZE) {
        toast.add({ severity: 'error', summary: `文件大小不能超过 ${MAX_UPLOAD_SIZE_TEXT}`, life: 5000 })
        return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            tempAvatar.value = e.target?.result as string

            const form = new FormData()
            form.append('file', file)

            const { data, error } = await useFetch('/api/file/upload', {
                method: 'POST',
                body: form,
            })
            if (error.value) {
                throw new Error(error.value.message || '头像上传失败')
            }
            user.avatar = data.value?.url || ''
            toast.add({ severity: 'success', summary: '头像上传成功', life: 2000 })

            // 上传成功后，刷新用户信息
            await fetchUserAccounts()
            // 清理临时头像
            tempAvatar.value = ''

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '头像上传失败'
            toast.add({ severity: 'error', summary: errorMessage, life: 2000 })
        }
    }
    reader.readAsDataURL(file)
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

    .btn-link {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        margin-left: 0.6rem;
    }
}

.profile-section {
    margin-bottom: 2rem;
}

.avatar-block {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;

    .avatar-btn {
        position: absolute;
        bottom: -13px;
        left: 38px;
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
    gap: 0.5rem;
    flex-wrap: wrap;

    .linked {
        background: $primary;
        color: #fff;
    }

    .social-btn {
        border: 1px solid $secondary-bg;
        background-color: $background-light;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        // margin-bottom: 1rem;
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

        &.social-microsoft {
            color: #0078d4;
        }

        .p-button-icon {
            margin-right: 0.75rem;
        }
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
</style>
