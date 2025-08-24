<template>
    <div class="auth-container">
        <AuthLeft title="个人中心" subtitle="管理您的账号信息。" />
        <div class="auth-right">
            <div class="auth-card profile-card">
                <div class="profile-header">
                    <h2 class="auth-title">
                        个人资料
                    </h2>
                </div>
                <div class="profile-header-actions">
                    <Button
                        v-tooltip.top="'已授权应用管理'"
                        label="授权应用"
                        icon="mdi mdi-key-variant"
                        severity="secondary"
                        @click="goOAuthClients"
                    />
                    <Button
                        v-tooltip.top="'账号安全设置'"
                        label="安全设置"
                        icon="mdi mdi-shield-account"
                        severity="secondary"
                        @click="goSecurity"
                    />
                    <Button
                        v-tooltip.top="'退出登录'"
                        label="退出登录"
                        icon="mdi mdi-logout"
                        severity="secondary"
                        @click="showLogoutConfirm = true"
                    />
                </div>
                <p class="auth-subtitle">
                    管理您的账号信息
                </p>
                <div class="profile-section">
                    <div class="avatar-block">
                        <Image
                            v-tooltip.top="'点击查看头像大图'"
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
                                    v-tooltip.top="'当前显示的头像'"
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
                            v-tooltip.top="'点击上传新的头像'"
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
                            <label class="form-label">ID</label>
                            <InputText
                                id="id"
                                v-model="user.id"
                                v-tooltip.top="'当前用户的唯一标识，不可编辑'"
                                class="form-input"
                                disabled
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="username">用户名</label>
                            <InputText
                                v-if="user.username"
                                id="username"
                                v-model="user.username"
                                v-tooltip.top="'当前使用的用户名，不可编辑'"
                                class="form-input"
                                disabled
                            />
                            <template v-if="!user.username">
                                <Button
                                    v-tooltip.top="'点击设置用户名，设置后可使用用户名密码登录'"
                                    label="设置用户名"
                                    text
                                    size="small"
                                    class="ml-2"
                                    @click="openSetUsernameDialog"
                                />
                                <Message severity="warn">
                                    您当前未设置用户名，无法通过用户名密码登录
                                </Message>
                            </template>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="nickname">昵称</label>
                            <InputText
                                id="nickname"
                                v-model="user.nickname"
                                v-tooltip.top="'您的昵称，可随时修改。2-36个字符。'"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <div class="privacy-field-header">
                                <label class="form-label">邮箱</label>
                                <div class="privacy-controls">
                                    <ToggleSwitch
                                        v-model="showEmailDetails"
                                        v-tooltip.top="'切换是否显示完整邮箱信息'"
                                        size="small"
                                    />
                                </div>
                            </div>
                            <div class="profile-row">
                                <div class="profile-info-content">
                                    <span
                                        v-if="showEmailDetails"
                                        v-tooltip.top="`完整邮箱地址：${user.email}`"
                                        class="privacy-value"
                                    >{{ user.email || "未绑定" }}</span>
                                    <span
                                        v-else
                                        v-tooltip.top="'邮箱信息已隐藏，点击右侧开关可显示'"
                                        class="privacy-hidden"
                                    >{{ user.email ? maskEmail(user.email) : "未绑定" }}</span>
                                </div>
                                <div class="profile-info-actions">
                                    <template v-if="user.emailVerified">
                                        <Button
                                            v-tooltip.top="'点击修改已验证的邮箱地址'"
                                            label="修改"
                                            text
                                            size="small"
                                            @click="openEmailModal"
                                        />
                                        <span v-tooltip.top="'邮箱已验证，可用于登录和找回密码'" class="verified">已验证</span>
                                    </template>
                                    <template v-else>
                                        <Button
                                            v-tooltip.top="'点击验证邮箱，验证后可用于登录和找回密码'"
                                            label="验证"
                                            text
                                            size="small"
                                            @click="openEmailModal"
                                        />
                                        <span v-tooltip.top="'邮箱未验证，无法用于登录和找回密码'" class="unverified">未验证</span>
                                    </template>
                                </div>
                            </div>
                            <Message v-if="!user.emailVerified" severity="warn">
                                您当前未验证邮箱，无法通过邮箱登录，也无法通过邮箱找回密码。<br>
                                为了您的账号安全，请尽快验证您的邮箱。
                            </Message>
                        </div>
                        <div v-if="phoneEnabled" class="form-group">
                            <div class="privacy-field-header">
                                <label class="form-label">手机号</label>
                                <div class="privacy-controls">
                                    <ToggleSwitch
                                        v-model="showPhoneDetails"
                                        v-tooltip.top="'切换是否显示完整手机号信息'"
                                        size="small"
                                    />
                                </div>
                            </div>
                            <div class="profile-row">
                                <div class="profile-info-content">
                                    <span
                                        v-if="showPhoneDetails"
                                        class="privacy-value"
                                    >{{ user.phone ? formatPhoneNumberInternational(user.phone) : "未绑定" }}</span>
                                    <span
                                        v-else
                                        v-tooltip.top="'手机号信息已隐藏，点击右侧开关可显示'"
                                        class="privacy-hidden"
                                    >{{ user.phone ? maskPhone(user.phone) : "未绑定" }}</span>
                                </div>
                                <div class="profile-info-actions">
                                    <Button
                                        v-if="user.phone"
                                        v-tooltip.top="'点击修改已绑定的手机号'"
                                        label="修改"
                                        text
                                        size="small"
                                        @click="showPhoneModal = true"
                                    />
                                    <Button
                                        v-else
                                        v-tooltip.top="phoneEnabled ? '点击绑定手机号，绑定后可用于登录和验证' : '短信功能未启用，无法绑定手机号'"
                                        label="绑定"
                                        text
                                        size="small"
                                        :disabled="!phoneEnabled"
                                        @click="phoneEnabled ? showPhoneModal = true : toast.add({severity: 'error', summary: '功能未启用', detail: '短信功能未启用，暂不支持绑定手机号', life: 3000})"
                                    />
                                    <span
                                        v-if="user.phoneVerified"
                                        v-tooltip.top="'手机号已验证，可用于登录和验证'"
                                        class="verified"
                                    >已验证</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">第三方账号</label>
                            <div class="social-list">
                                <!-- 已绑定的第三方账号 -->
                                <Button
                                    v-for="account in userAccounts"
                                    :key="account.provider"
                                    v-tooltip.top="`点击解绑 ${getProviderName(account.provider)} 账号，完整 ID: ${account.accountId}`"
                                    class="social-btn"
                                    :style="{color: socialProviders.find(p => p.provider === account.provider)?.color}"
                                    :icon="getProviderIcon(account.provider)"
                                    :label="`${getProviderName(account.provider)}(ID: ${account.accountId.slice(0, 10)}${account.accountId.length > 10 ? '...' : ''})`"
                                    outlined
                                    @click="confirmUnlink(account.provider, account.accountId)"
                                />

                                <!-- 绑定新账号   -->
                                <template v-for="provider in enabledProviders">
                                    <Button
                                        v-if="!userAccounts.some(account => account.provider === provider.provider) && !provider.anonymous"
                                        :key="provider.provider"
                                        class="social-btn"
                                        :style="{color: provider.color}"
                                        :icon="getProviderIcon(provider.provider)"
                                        :label="`绑定 ${provider.name} 账号`"
                                        outlined
                                        @click="linkSocialAccount(provider)"
                                    />
                                </template>
                            </div>
                        </div>
                        <div class="form-group profile-actions">
                            <Button
                                v-tooltip.top="'点击保存修改后的个人信息'"
                                label="保存修改"
                                class="btn btn-primary"
                                :loading="saving"
                                @click="saveProfile"
                            />
                            <Button
                                v-tooltip.top="'点击跳转到修改密码页面'"
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
            :header="user.emailVerified ? '修改邮箱' : '绑定邮箱'"
            :closable="true"
            :style="{minWidth: '450px'}"
        >
            <div class="form-group">
                <InputText
                    v-model="email"
                    v-tooltip.top="'输入新的邮箱地址'"
                    class="form-input"
                    placeholder="请输入新邮箱"
                />
            </div>
            <div class="form-group">
                <Button
                    v-tooltip.top="'点击发送验证链接到新邮箱'"
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
            :header="user.phoneVerified ? '修改手机号' : '绑定手机号'"
            :closable="true"
            :style="{width: '450px'}"
        >
            <div class="form-group">
                <PhoneInput
                    v-model="phone"
                    v-tooltip.top="'输入新的手机号'"
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
                    v-tooltip.top="'输入收到的短信验证码'"
                    class="form-input"
                    placeholder="验证码"
                />
                <SendCodeButton
                    v-tooltip.top="'点击发送验证码到新手机号'"
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
                    v-tooltip.top="'点击确认修改手机号信息'"
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
            :style="{width: '450px'}"
        >
            <p>确定要解绑 {{ getProviderName(selectedProvider) }} 平台，ID 为 {{ selectedAccountId }} 的账号吗？</p>
            <template #footer>
                <Button
                    v-tooltip.top="'点击取消解绑操作'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="showUnlinkConfirm = false"
                />
                <Button
                    v-tooltip.top="'点击确认解绑操作'"
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
            :style="{width: '450px'}"
        >
            <div class="form-group">
                <InputText
                    v-model="newUsername"
                    v-tooltip.top="'输入新的用户名，用于用户名密码登录'"
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
                    v-tooltip.top="'点击确认设置新的用户名'"
                    label="确认设置"
                    class="btn btn-primary w-full"
                    :loading="isSettingUsername"
                    @click="setUsername"
                />
            </div>
        </Dialog>

        <!-- 退出登录确认弹窗 -->
        <Dialog
            v-model:visible="showLogoutConfirm"
            modal
            header="确认退出"
            :closable="true"
            :style="{width: '450px'}"
        >
            <p>确定要退出登录吗？退出后需要重新登录才能访问您的账户。</p>
            <template #footer>
                <Button
                    v-tooltip.top="'取消退出登录'"
                    label="取消"
                    class="btn btn-secondary"
                    severity="secondary"
                    @click="showLogoutConfirm = false"
                />
                <Button
                    v-tooltip.top="'确认退出登录'"
                    label="确认退出"
                    class="btn btn-primary"
                    :loading="loggingOut"
                    @click="confirmLogout"
                />
            </template>
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
import { authClient } from '@/lib/auth-client'
import { formatPhoneNumberInternational } from '@/utils/phone'
import type { SocialProvider } from '@/types/social'
import { maskEmail, maskPhone } from '@/utils/privacy'
import { shortText } from '@/utils/short-text'
const config = useRuntimeConfig().public
const phoneEnabled = config.phoneEnabled

const MAX_AVATAR_SIZE = MAX_UPLOAD_SIZE

const toast = useToast()
const user = reactive({
    id: '',
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

const { data: providersData } = await useFetch('/api/social/providers?includeDisabled=true')
const socialProviders = computed(() => providersData.value?.providers || [])

// 获取启用的providers，用于显示绑定按钮
const enabledProviders = computed(() => socialProviders.value.filter((p) => p.enabled))

// 根据 provider 获取对应的名称
const getProviderName = (provider: string) => {
    const providerObj = socialProviders.value.find((p) => p.provider === provider)
    return providerObj ? providerObj.name : provider
}
const getProviderIcon = (provider: string) => {
    const providerObj = socialProviders.value.find((p) => p.provider === provider)
    return providerObj?.icon || `mdi mdi-${provider}`
}

const sendPhoneCode = useSendPhoneCode(
    phone,
    'phone-verification',
    validatePhone,
    errors,
    phoneCodeSending,
)

// 通过 SSR 渲染
const { data: session } = await authClient.useSession(useFetch)

// Clarity 追踪
const clarity = useClarity()

watch(
    () => session.value?.session,
    async () => {
        const newUser = session.value?.user
        if (newUser) {
            Object.assign(user, {
                id: newUser.id,
                username: newUser.displayUsername || '',
                nickname: newUser.name || '',
                avatar: newUser.image || '',
                email: newUser.email || '',
                emailVerified: newUser.emailVerified || false,
                phone: newUser.phoneNumber || '',
                phoneVerified: newUser.phoneNumberVerified || false,
            })

            // 用户标识追踪
            clarity.identify(newUser.id, undefined, '/profile', newUser.name)
            clarity.setTag('page_type', 'profile')
            clarity.setTag('user_verified_email', newUser.emailVerified ? 'yes' : 'no')
            clarity.setTag('user_verified_phone', newUser.phoneNumberVerified ? 'yes' : 'no')
        }
    },
    { immediate: true }, // 立即执行
)

function openEmailModal() {
    showEmailModal.value = true
    if (!user.emailVerified) { // 如果未验证，则默认填写当前邮箱
        email.value = user.email
    }
}

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

onMounted(async () => {
    await fetchUserAccounts()
})

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
        const accounts = await authClient.listAccounts({})
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
async function linkSocialAccount(socialProvider: SocialProvider) {
    const { provider, name, social, oauth2, enabled } = socialProvider

    // 检查该provider是否已启用
    if (!enabled) {
        toast.add({
            severity: 'warn',
            summary: '绑定失败',
            detail: `${name} 登录方式未启用，无法绑定`,
            life: 5000,
        })
        return
    }

    try {
        let result: any
        if (social) {
            result = await authClient.linkSocial({
                provider,
                callbackURL: `${AUTH_BASE_URL}/profile`,
            })
        } else if (oauth2) {
            result = await authClient.oauth2.link({
                providerId: provider,
                callbackURL: `${AUTH_BASE_URL}/profile`, // 回调到资料页
            })
        }
        if (!result || result.error) {
            throw new Error(result?.error?.message || `${name} 绑定失败`)
        }
        await fetchUserAccounts()
        toast.add({
            severity: 'success',
            summary: `正在绑定 ${name} 中`,
            life: 2000,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `${name} 绑定时发生未知错误`
        toast.add({
            severity: 'error',
            summary: `${name} 绑定失败`,
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

function goOAuthClients() {
    navigateTo('/oauth/clients')
}

function goSecurity() {
    navigateTo('/security')
}

const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

// 隐私信息显示控制
const showEmailDetails = ref(true)
const showPhoneDetails = ref(true)

onMounted(async () => {
    await fetchUserAccounts()

    // 恢复隐私设置
    if (import.meta.client) {
        const savedEmailSetting = localStorage.getItem('caomei-auth-show-email')
        const savedPhoneSetting = localStorage.getItem('caomei-auth-show-phone')

        if (savedEmailSetting !== null) {
            showEmailDetails.value = savedEmailSetting === 'true'
        }
        if (savedPhoneSetting !== null) {
            showPhoneDetails.value = savedPhoneSetting === 'true'
        }
    }
})

if (import.meta.client) {
    // 监听隐私设置变化并保存到本地存储
    watch(showEmailDetails, (newValue) => {
        localStorage.setItem('caomei-auth-show-email', String(newValue))
    })

    watch(showPhoneDetails, (newValue) => {
        localStorage.setItem('caomei-auth-show-phone', String(newValue))
    })
}

// 获取用户关联的第三方账号

// 确认退出登录
async function confirmLogout() {
    loggingOut.value = true
    try {
        await authClient.signOut({})
        toast.add({ severity: 'success', summary: '登出成功', life: 2000 })
        showLogoutConfirm.value = false
        navigateTo('/login') // 重定向到登录页面
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登出时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '登出失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        loggingOut.value = false
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
    justify-content: space-between;
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
    justify-content: space-between;
    min-height: 2.5rem;
    padding: 0.5rem 0;
    gap: 1rem;
}

.profile-info-content {
    flex: 1;
    min-width: 0;
}

.profile-info-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.social-list {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .linked {
        background: $primary;
        color: #fff;
    }

    .social-btn {
        margin-bottom: 0.2rem;
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

.unverified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .profile-header-actions {
        display: flex;
        gap: 0.5rem;

        .btn-header {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;

            &:hover {
                background-color: var(--primary-100);
                color: var(--primary-500);
            }

            .p-button-icon {
                font-size: 1.2rem;
            }
        }
    }
}

.privacy-field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .form-label {
        margin-bottom: 0;
        font-weight: 600;
    }
}

.privacy-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba($secondary, 0.05);
    border-radius: 6px;
    border: 1px solid rgba($secondary, 0.1);

    :deep(.p-toggleswitch) {
        .p-toggleswitch-slider {
            background: rgba($secondary-light, 0.3);
            border-radius: 10px;

            &::before {
                background: #fff;
                border-radius: 50%;
            }
        }

        &.p-toggleswitch-checked .p-toggleswitch-slider {
            background: $primary;
        }
    }
}

.privacy-label {
    color: $secondary;
    font-size: 0.85rem;
    white-space: nowrap;
}

.privacy-value {
    color: $secondary;
    font-weight: 500;
    word-break: break-all;
    flex: 1;
}

.privacy-hidden {
    color: $secondary;

    // font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-weight: 500;
}
</style>
