<template>
    <div class="form-group">
        <label class="form-label">邮箱</label>
        <div class="profile-row">
            <div class="profile-info-content">
                <span
                    v-if="!privacyMode"
                    v-tooltip.top="`完整邮箱地址：${user.email}`"
                    class="privacy-value"
                >{{ user.email || "未绑定" }}</span>
                <span
                    v-else
                    v-tooltip.top="'邮箱信息已隐藏，点击顶部隐私模式开关可显示'"
                    class="privacy-hidden"
                >{{ user.email ? maskEmail(user.email) : "未绑定" }}</span>
            </div>
            <div class="profile-info-actions">
                <template v-if="user.emailVerified">
                    <CaomeiButton
                        variant="ghost"
                        size="sm"
                        title="点击修改已验证的邮箱地址"
                        @click="emit('openEmailModal')"
                    >
                        修改
                    </CaomeiButton>
                    <span v-tooltip.top="'邮箱已验证，可用于登录和找回密码'" class="verified">已验证</span>
                </template>
                <template v-else>
                    <CaomeiButton
                        variant="ghost"
                        size="sm"
                        title="点击验证邮箱，验证后可用于登录和找回密码"
                        @click="emit('openEmailModal')"
                    >
                        验证
                    </CaomeiButton>
                    <span v-tooltip.top="'邮箱未验证，无法用于登录和找回密码'" class="unverified">未验证</span>
                </template>
            </div>
        </div>
        <CaomeiMessage v-if="!user.emailVerified" tone="warning">
            您当前未验证邮箱，无法通过邮箱登录，也无法通过邮箱找回密码。<br>
            为了您的账号安全，请尽快验证您的邮箱。
        </CaomeiMessage>
    </div>
    <div v-if="phoneEnabled" class="form-group">
        <label class="form-label">手机号</label>
        <div class="profile-row">
            <div class="profile-info-content">
                <span
                    v-if="!privacyMode"
                    class="privacy-value"
                >{{ user.phone ? formatPhoneNumberInternational(user.phone) : "未绑定" }}</span>
                <span
                    v-else
                    v-tooltip.top="'手机号信息已隐藏，点击顶部隐私模式开关可显示'"
                    class="privacy-hidden"
                >{{ user.phone ? maskPhone(user.phone) : "未绑定" }}</span>
            </div>
            <div class="profile-info-actions">
                <CaomeiButton
                    v-if="user.phone"
                    variant="ghost"
                    size="sm"
                    title="点击修改已绑定的手机号"
                    @click="emit('openPhoneModal')"
                >
                    修改
                </CaomeiButton>
                <CaomeiButton
                    v-else
                    variant="ghost"
                    size="sm"
                    :title="phoneEnabled ? '点击绑定手机号，绑定后可用于登录和验证' : '短信功能未启用，无法绑定手机号'"
                    :disabled="!phoneEnabled"
                    @click="phoneEnabled ? emit('openPhoneModal') : toast.danger({title: '功能未启用', description: '短信功能未启用，暂不支持绑定手机号', duration: 3000})"
                >
                    绑定
                </CaomeiButton>
                <span
                    v-if="user.phoneVerified"
                    v-tooltip.top="'手机号已验证，可用于登录和验证'"
                    class="verified"
                >已验证</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { maskEmail, maskPhone } from '@/utils/shared/privacy'
import { formatPhoneNumberInternational } from '@/utils/shared/phone'

const props = defineProps<{
    privacyMode: boolean
    phoneEnabled: boolean
}>()

const user = defineModel<{
    email: string
    emailVerified: boolean
    phone: string
    phoneVerified: boolean
}>('user', { required: true })

const emit = defineEmits<{
    (e: 'openEmailModal'): void
    (e: 'openPhoneModal'): void
}>()

const toast = useToast()
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
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

.verified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.unverified {
    color: $primary;
    margin-left: 0.5em;
    font-size: 0.98em;
}

.privacy-value {
    color: $secondary;
    font-weight: 500;
    word-break: break-all;
    flex: 1;

    @include dark-mode {
        color: #{$dark-secondary} !important;
    }
}

.privacy-hidden {
    color: $secondary;
    font-weight: 500;
}
</style>
