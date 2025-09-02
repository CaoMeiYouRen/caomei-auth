<template>
    <div class="auth-container">
        <AuthLeft title="找回密码" subtitle="通过邮箱或手机号重置密码。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    找回密码
                </h2>
                <p class="auth-subtitle">
                    请输入相关信息以重置密码
                </p>
                <div class="forgot-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                label="邮箱"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab!== 'email'}"
                                @click="changeMode('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                label="手机号"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab!== 'phone'}"
                                @click="changeMode('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <!-- 邮箱找回密码表单 -->
                <div v-show="activeTab === 'email'">
                    <div class="form-group">
                        <label class="form-label" for="email">邮箱</label>
                        <InputText
                            id="email"
                            v-model="email"
                            v-tooltip.top="'请输入注册时使用的邮箱地址'"
                            class="form-input"
                            placeholder="请输入邮箱"
                        />
                        <div v-if="errors.email" class="error-message">
                            {{ errors.email }}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="emailCode">邮箱验证码</label>
                        <div class="code-row">
                            <InputText
                                id="emailCode"
                                v-model="emailCode"
                                v-tooltip.top="'请输入发送到您邮箱的验证码'"
                                class="form-input"
                                placeholder="请输入邮箱验证码"
                            />
                            <SendCodeButton
                                v-tooltip.top="'点击获取验证码，验证码将发送到您输入的邮箱'"
                                :on-send="sendEmailCode"
                                :duration="60"
                                :disabled="emailCodeSending || !validateEmail(email)"
                                :loading="emailCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </div>
                        <div v-if="errors.emailCode" class="error-message">
                            {{ errors.emailCode }}
                        </div>
                    </div>
                </div>
                <!-- 手机号找回密码表单 -->
                <div v-show="activeTab === 'phone'">
                    <div class="form-group">
                        <label class="form-label" for="phone">手机号</label>
                        <PhoneInput
                            v-model="phone"
                            v-tooltip.top="'请输入注册时使用的手机号'"
                        />
                        <div v-if="errors.phone" class="error-message">
                            {{ errors.phone }}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="phoneCode">短信验证码</label>
                        <div class="code-row">
                            <InputText
                                id="phoneCode"
                                v-model="phoneCode"
                                v-tooltip.top="'请输入发送到您手机的短信验证码'"
                                class="form-input"
                                placeholder="请输入短信验证码"
                            />
                            <SendCodeButton
                                v-tooltip.top="'点击获取短信验证码，验证码将发送到您输入的手机号'"
                                :on-send="sendPhoneCode"
                                :duration="60"
                                :disabled="phoneCodeSending || !validatePhone(phone)"
                                :loading="phoneCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </div>
                        <div v-if="errors.phoneCode" class="error-message">
                            {{ errors.phoneCode }}
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="newPassword">新密码</label>
                    <Password
                        id="newPassword"
                        v-model="newPassword"
                        v-tooltip.top="getPasswordRequirementsShort()"
                        class="form-input password-input"
                        placeholder="请输入新密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <PasswordStrength
                        :show-strength="!!newPassword"
                        :password="newPassword"
                        :show-score="false"
                        :min-length-for-display="1"
                    />
                    <div v-if="errors.newPassword" class="error-message">
                        {{ errors.newPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">确认新密码</label>
                    <Password
                        id="confirmPassword"
                        v-model="confirmPassword"
                        v-tooltip.top="'请再次输入相同的新密码以确认'"
                        class="form-input password-input"
                        placeholder="请再次输入新密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.confirmPassword" class="error-message">
                        {{ errors.confirmPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <Button
                        v-tooltip.top="'点击提交信息重置密码'"
                        class="btn btn-primary mt-2"
                        label="重置密码"

                        @click="resetPassword"
                    />
                </div>
                <div class="toggle-login">
                    已有账号？ <NuxtLink

                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        立即登录
                    </nuxtlink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import SendCodeButton from '@/components/send-code-button.vue'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendEmailCode, useSendPhoneCode } from '@/utils/code'
import AuthLeft from '@/components/auth-left.vue'
import PasswordStrength from '@/components/password-strength.vue'
import { authClient } from '@/lib/auth-client'
import { getPasswordRequirementsShort } from '@/utils/password'
import { validatePasswordForm } from '@/utils/password-validator'

const config = useRuntimeConfig().public
const phoneEnabled = config.phoneEnabled

const email = ref('')
const phone = ref('')
const emailCode = ref('')
const phoneCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const emailCodeSending = ref(false)
const phoneCodeSending = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToast()
const route = useRoute()

// 使用 useUrlSearchParams 获取 URL 参数
const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
const activeTab = ref<'email' | 'phone'>('email')

onMounted(() => {
    // 如果短信功能未启用，强制使用邮箱方式
    if (!phoneEnabled) {
        activeTab.value = 'email'
        params.mode = 'email'
        return
    }
    // 支持通过 query 传递初始 tab
    if (params.mode === 'phone') {
        activeTab.value = 'phone'
    } else {
        activeTab.value = 'email'
    }
    params.mode = activeTab.value
})

const sendEmailCode = useSendEmailCode(email, 'forget-password', validateEmail, errors, emailCodeSending)
const sendPhoneCode = useSendPhoneCode(phone, 'forget-password', validatePhone, errors, phoneCodeSending)

// 切换找回密码模式并更新 URL
const changeMode = (mode: 'email' | 'phone') => {
    activeTab.value = mode
    params.mode = mode
}

async function resetPassword() {
    errors.value = {}

    if (activeTab.value === 'email') {
        if (!email.value) {
            errors.value.email = '请输入邮箱'
            return
        }
        if (!validateEmail(email.value)) {
            errors.value.email = '请输入有效的邮箱地址'
            return
        }
        if (!emailCode.value) {
            errors.value.emailCode = '请输入邮箱验证码'
            return
        }
    } else if (activeTab.value === 'phone') {
        if (!phone.value) {
            errors.value.phone = '请输入手机号'
            return
        }
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            return
        }
        if (!phoneCode.value) {
            errors.value.phoneCode = '请输入短信验证码'
            return
        }
    }

    // 使用新的密码验证工具函数
    const passwordErrors = validatePasswordForm({
        password: newPassword.value,
        confirmPassword: confirmPassword.value,
    })

    if (Object.keys(passwordErrors).length > 0) {
        Object.assign(errors.value, passwordErrors)
        return
    }

    try {
        if (activeTab.value === 'email') {
            const { data, error } = await authClient.emailOtp.resetPassword({
                email: email.value,
                otp: emailCode.value,
                password: newPassword.value,
            })
            if (error) {
                throw new Error(error.message || '密码重置失败')
            }
        } else if (activeTab.value === 'phone') {
            const isVerified = await authClient.phoneNumber.resetPassword({
                otp: phoneCode.value,
                phoneNumber: phone.value,
                newPassword: newPassword.value,
            })
            if (!isVerified.data?.status) {
                throw new Error('密码重置失败')
            }
        }
        toast.add({ severity: 'success', summary: '密码重置成功', detail: '请使用新密码登录', life: 2500 })
        setTimeout(() => {
            window.location.href = `/login?mode=${activeTab.value}`
        }, 1500)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '密码重置时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '重置失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}
</script>

<style scoped lang="scss">

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 20vh;
    padding: 1rem;
    color: $background-light;
    text-align: center;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;

        .auth-logo img {
            width: 25%;
            max-width: none;
        }
    }
}

.auth-right {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 1rem;

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.05);
}

.auth-title {
    margin-bottom: 1rem;
    color: $secondary;
    font-weight: 600;
    font-size: 2rem;
}

.auth-subtitle {
    margin-bottom: 2rem;
    color: $secondary-light;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: $background-light;
    border: 1px solid $secondary-bg;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgb(230 57 70 / 0.2);
}

.forgot-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
    border-radius: 8px;
}

.btn-primary {
    width: 100%;
    min-height: 44px;
    color: $background-light !important;
    background-color: $primary !important;
    border: none !important;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.toggle-login {
    margin-top: 1.5rem;
    color: $secondary-light;
    text-align: center;
}

.toggle-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

.choose-way {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}

.p-password {
    width: 100%;
    padding: 0;
}
</style>
