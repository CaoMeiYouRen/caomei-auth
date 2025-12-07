<template>
    <div class="auth-container">
        <AuthLeft title="个人中心" subtitle="管理您的账号信息。" />
        <div class="auth-right">
            <div class="auth-card profile-card">
                <ProfileHeader
                    v-model:privacy-mode="privacyMode"
                    @go-o-auth-clients="goOAuthClients"
                    @go-security="goSecurity"
                    @logout="handleLogout"
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
    </div>
</template>

<script lang="ts" setup>
import { useProfileFlow } from '@/composables/use-profile-flow'
import AuthLeft from '@/components/auth-left.vue'

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

const {
    user,
    saving,
    showEmailModal,
    showPhoneModal,
    showSetUsernameDialog,
    userAccounts,
    privacyMode,
    socialProviders,
    enabledProviders,
    phoneEnabled,
    fetchUserAccounts,
    linkSocialAccount,
    confirmUnlink,
    saveProfile,
    goChangePassword,
    goOAuthClients,
    goSecurity,
    handleLogout,
} = await useProfileFlow()
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
