<template>
    <div class="auth-container">
        <AuthLeft title="个人中心" subtitle="管理您的账号信息。" />
        <div class="auth-right">
            <div class="auth-card profile-card">
                <ProfileHeader
                    v-model:privacy-mode="privacyMode"
                    @go-o-auth-clients="goOAuthClients"
                    @go-security="goSecurity"
                    @logout="showLogoutConfirm = true"
                />

                <div class="profile-section">
                    <UserAvatar
                        v-model:user="user"
                        @refresh="fetchUserAccounts"
                    />

                    <div class="info-block">
                        <UserBasicInfo
                            v-model:user="user"
                            :privacy-mode="privacyMode"
                            @open-set-username-dialog="showSetUsernameDialog = true"
                        />

                        <UserContactInfo
                            v-model:user="user"
                            :privacy-mode="privacyMode"
                            :phone-enabled="phoneEnabled"
                            @open-email-modal="showEmailModal = true"
                            @open-phone-modal="showPhoneModal = true"
                        />

                        <SocialAccounts
                            :user-accounts="userAccounts"
                            :enabled-providers="enabledProviders"
                            :social-providers="socialProviders"
                            :privacy-mode="privacyMode"
                            @unlink="confirmUnlink"
                            @link="linkSocialAccount"
                        />

                        <ProfileFooterActions
                            :saving="saving"
                            @save="saveProfile"
                            @change-password="goChangePassword"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Dialogs -->
        <EditEmailDialog
            v-model:visible="showEmailModal"
            v-model:user="user"
        />

        <EditPhoneDialog
            v-model:visible="showPhoneModal"
            v-model:user="user"
        />

        <SetUsernameDialog
            v-model:visible="showSetUsernameDialog"
            v-model:user="user"
        />

        <UnlinkConfirmDialog
            v-model:visible="showUnlinkConfirm"
            :provider-name="getProviderName(selectedProvider)"
            :account-id="selectedAccountId"
            @confirm="unlinkSelectedAccount"
        />

        <LogoutConfirmDialog
            v-model:visible="showLogoutConfirm"
            :loading="loggingOut"
            @confirm="confirmLogout"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'
import { nicknameValidator } from '@/utils/validate'
import { getSocialColor } from '@/utils/social-colors'
import type { SocialProvider } from '@/types/social'

// Components
import ProfileHeader from '@/components/profile/profile-header.vue'
import UserAvatar from '@/components/profile/user-avatar.vue'
import UserBasicInfo from '@/components/profile/user-basic-info.vue'
import UserContactInfo from '@/components/profile/user-contact-info.vue'
import SocialAccounts from '@/components/profile/social-accounts.vue'
import ProfileFooterActions from '@/components/profile/profile-footer-actions.vue'
import EditEmailDialog from '@/components/profile/dialogs/edit-email-dialog.vue'
import EditPhoneDialog from '@/components/profile/dialogs/edit-phone-dialog.vue'
import SetUsernameDialog from '@/components/profile/dialogs/set-username-dialog.vue'
import UnlinkConfirmDialog from '@/components/profile/dialogs/unlink-confirm-dialog.vue'
import LogoutConfirmDialog from '@/components/profile/dialogs/logout-confirm-dialog.vue'

const config = useRuntimeConfig().public
const phoneEnabled = !!config.phoneEnabled

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
const showSetUsernameDialog = ref(false)
const showUnlinkConfirm = ref(false)
const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

const selectedProvider = ref('')
const selectedAccountId = ref('')

const { data: providersData } = await useFetch('/api/social/providers?includeDisabled=true')
const isDark = useDark()

const socialProviders = computed(() => {
    const providers = providersData.value?.providers || []
    return providers.map((provider) => {
        const theme = isDark.value ? 'dark' : 'light'
        const color = getSocialColor(provider.provider, theme)
        return { ...provider, color }
    })
})

const enabledProviders = computed(() => socialProviders.value.filter((p) => p.enabled))

const getProviderName = (provider: string) => {
    const providerObj = socialProviders.value.find((p) => p.provider === provider)
    return providerObj ? providerObj.name : provider
}

// Session handling
const { data: session } = await authClient.useSession(useFetch)
const clarity = useClarity()

watch(
    () => session.value?.session,
    async () => {
        const newUser = session.value?.user
        if (newUser) {
            Object.assign(user, {
                id: newUser.id,
                username: newUser.username || '',
                nickname: newUser.name || '',
                avatar: newUser.image || '',
                email: newUser.email || '',
                emailVerified: newUser.emailVerified || false,
                phone: newUser.phoneNumber || '',
                phoneVerified: newUser.phoneNumberVerified || false,
            })

            clarity.identify(newUser.id, undefined, '/profile', newUser.name)
            clarity.setTag('page_type', 'profile')
            clarity.setTag('user_verified_email', newUser.emailVerified ? 'yes' : 'no')
            clarity.setTag('user_verified_phone', newUser.phoneNumberVerified ? 'yes' : 'no')
        }
    },
    { immediate: true },
)

// Social Accounts
const userAccounts = ref<{
    id: string
    providerId: string
    createdAt: Date
    updatedAt: Date
    accountId: string
    scopes: string[]
}[]>([])

const fetchUserAccounts = async () => {
    try {
        const accounts = await authClient.listAccounts({})
        userAccounts.value = accounts.data?.filter((account) => account.providerId !== 'credential') || []
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

async function linkSocialAccount(socialProvider: SocialProvider) {
    const { provider, name, social, oauth2, enabled } = socialProvider

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
                callbackURL: `${AUTH_BASE_URL}/profile`,
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

function confirmUnlink(provider: string, accountId: string) {
    selectedProvider.value = provider
    selectedAccountId.value = accountId
    showUnlinkConfirm.value = true
}

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

// Profile Actions
async function saveProfile() {
    if (!nicknameValidator(user.nickname)) {
        toast.add({ severity: 'warn', summary: '昵称格式有误', detail: '昵称长度需在 2 - 36 个字符之间，仅允许中英文、数字和常见标点符号。', life: 5000 })
        return
    }
    saving.value = true
    try {
        const result = await authClient.updateUser({
            image: user.avatar,
            name: user.nickname,
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

function goChangePassword() {
    navigateTo('/change-password')
}

function goOAuthClients() {
    navigateTo('/oauth/clients')
}

function goSecurity() {
    navigateTo('/security')
}

async function confirmLogout() {
    loggingOut.value = true
    try {
        await authClient.signOut({})
        toast.add({ severity: 'success', summary: '登出成功', life: 2000 })
        showLogoutConfirm.value = false
        navigateTo('/login')
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

// Privacy Mode
const privacyMode = ref(false)

onMounted(async () => {
    await fetchUserAccounts()

    if (import.meta.client) {
        const savedPrivacyMode = localStorage.getItem('caomei-auth-privacy-mode')
        if (savedPrivacyMode !== null) {
            privacyMode.value = savedPrivacyMode === 'true'
        }
    }
})

if (import.meta.client) {
    watch(privacyMode, (newValue) => {
        localStorage.setItem('caomei-auth-privacy-mode', String(newValue))
    })
}
</script>

<style scoped lang="scss">
.profile-card {
    max-width: 480px;
}

.profile-section {
    margin-bottom: 2rem;
}

.info-block {
    width: 100%;
}
</style>
