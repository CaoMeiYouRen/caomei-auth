<template>
    <div class="auth-container">
        <AuthLeft title="快速登录" subtitle="验证码快速登录，安全便捷。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    快速登录
                </h2>
                <p class="auth-subtitle">
                    使用验证码一键完成登录。未注册的账号将自动创建。
                </p>

                <!-- Tab切换 -->
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                label="邮箱验证码"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab !== 'email'}"
                                @click="changeTab('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                v-tooltip.top="'使用手机验证码登录'"
                                label="短信验证码"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab !== 'phone'}"
                                @click="changeTab('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>

                <!-- 邮箱验证码登录 -->
                <div v-show="activeTab === 'email'">
                    <div class="form-group">
                        <label class="form-label" for="email">邮箱地址</label>
                        <InputText
                            id="email"
                            v-model="email"
                            class="form-input"
                            placeholder="example@mail.com"
                        />
                        <div v-if="errors.email" class="error-message">
                            {{ errors.email }}
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-label-group">
                            <label class="form-label" for="emailCode">验证码</label>
                            <div class="code-row">
                                <InputText
                                    id="emailCode"
                                    v-model="emailCode"
                                    class="form-input"
                                    placeholder="请输入邮箱验证码"
                                    maxlength="6"
                                    @input="handleEmailCodeInput"
                                />
                                <SendCodeButton
                                    :on-send="sendEmailVerificationCode"
                                    :duration="60"
                                    :disabled="emailCodeSending || !validateEmail(email)"
                                    :loading="emailCodeSending"
                                    text="获取验证码"
                                    resend-text="重新发送"
                                />
                            </div>
                        </div>
                        <div v-if="errors.emailCode" class="error-message">
                            {{ errors.emailCode }}
                        </div>
                    </div>

                    <!-- 邮箱登录按钮 -->
                    <Button
                        class="btn btn-primary"
                        label="邮箱快速登录"
                        :loading="isEmailLoggingIn"
                        @click="loginWithEmail"
                    />
                </div>

                <!-- 手机验证码登录 -->
                <div v-show="activeTab === 'phone'">
                    <div class="form-group">
                        <label class="form-label" for="phone">手机号</label>
                        <PhoneInput v-model="phone" />
                        <div v-if="errors.phone" class="error-message">
                            {{ errors.phone }}
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-label-group">
                            <label class="form-label" for="phoneCode">验证码</label>
                            <div class="code-row">
                                <InputText
                                    id="phoneCode"
                                    v-model="phoneCode"
                                    class="form-input"
                                    placeholder="请输入短信验证码"
                                    maxlength="6"
                                />
                                <SendCodeButton
                                    :on-send="sendPhoneVerificationCode"
                                    :duration="60"
                                    :disabled="phoneCodeSending || !validatePhone(phone)"
                                    :loading="phoneCodeSending"
                                    text="获取验证码"
                                    resend-text="重新发送"
                                />
                            </div>
                        </div>
                        <div v-if="errors.phoneCode" class="error-message">
                            {{ errors.phoneCode }}
                        </div>
                    </div>

                    <!-- 手机登录按钮 -->
                    <Button
                        class="btn btn-primary"
                        label="手机快速登录"
                        :loading="isPhoneLoggingIn"
                        @click="loginWithPhone"
                    />
                </div>

                <!-- 其他登录方式 -->
                <div class="toggle-login">
                    <NuxtLink to="/login" class="toggle-link">
                        使用密码登录
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink to="/register" class="toggle-link">
                        传统注册
                    </NuxtLink>
                </div>

                <!-- 用户协议 -->
                <div class="agreement-notice">
                    登录即表示您已阅读并同意
                    <NuxtLink
                        to="/terms"
                        target="_blank"
                        class="agreement-link"
                    >
                        《服务条款》
                    </NuxtLink>
                    和
                    <NuxtLink
                        to="/privacy"
                        target="_blank"
                        class="agreement-link"
                    >
                        《隐私政策》
                    </NuxtLink>
                </div>
            </div>
        </div>

        <Toast />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import AuthLeft from '@/components/auth-left.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import PhoneInput from '@/components/phone-input.vue'
import { authClient } from '@/lib/auth-client'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendEmailCode, useSendPhoneCode } from '@/utils/code'

// SEO 设置
definePageMeta({
    title: '快速登录 - 草梅 Auth',
    description: '使用验证码一键完成登录注册，安全便捷',
})

// 配置
const config = useRuntimeConfig().public
const phoneEnabled = config.phoneEnabled

// 响应式数据
const activeTab = ref<'email' | 'phone'>('email')

// 邮箱相关
const email = ref('')
const emailCode = ref('')
const isEmailLoggingIn = ref(false)

// 手机相关
const phone = ref('')
const phoneCode = ref('')
const isPhoneLoggingIn = ref(false)

// 错误状态
const errors = ref<Record<string, string>>({})

// 发送验证码状态
const emailCodeSending = ref(false)
const phoneCodeSending = ref(false)

// 组件
const toast = useToast()

// 使用 URL 参数
const params = useUrlSearchParams<{ tab: 'email' | 'phone' }>('history', { initialValue: { tab: 'email' } })

// 邮箱验证码发送工具
const sendEmailCode = useSendEmailCode(email, 'sign-in', validateEmail, errors, emailCodeSending)

// 手机验证码发送工具
const sendPhoneCode = useSendPhoneCode(phone, 'sign-in', validatePhone, errors, phoneCodeSending)

// 计算属性
const canSendEmailCode = computed(() => {
    return email.value.trim() && validateEmail(email.value) && !errors.value.email
})

const canSendPhoneCode = computed(() => {
    return phone.value.trim() && validatePhone(phone.value) && !errors.value.phone
})

// 方法
const changeTab = (tab: 'email' | 'phone') => {
    // 如果短信功能未启用且尝试切换到手机登录，提示错误并阻止切换
    if (tab === 'phone' && !phoneEnabled) {
        toast.add({
            severity: 'error',
            summary: '功能未启用',
            detail: '短信功能未启用，请使用邮箱验证码登录',
            life: 3000,
        })
        return
    }

    params.tab = tab
    activeTab.value = tab

    // 清除错误状态
    errors.value = {}
}

const sendEmailVerificationCode = async () => {
    try {
        errors.value.email = ''

        if (!validateEmail(email.value)) {
            throw new Error('请输入有效的邮箱地址')
        }

        const result = await sendEmailCode()

        toast.add({
            severity: 'success',
            summary: '验证码已发送',
            detail: '验证码已发送到您的邮箱，请注意查收',
            life: 3000,
        })

        return result
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '验证码发送失败'
        errors.value.email = errorMessage
        toast.add({
            severity: 'error',
            summary: '发送失败',
            detail: errorMessage,
            life: 5000,
        })
        throw error
    }
}

const sendPhoneVerificationCode = async () => {
    try {
        errors.value.phone = ''

        if (!validatePhone(phone.value)) {
            throw new Error('请输入有效的手机号')
        }

        const result = await sendPhoneCode()

        toast.add({
            severity: 'success',
            summary: '验证码已发送',
            detail: '验证码已发送到您的手机，请注意查收',
            life: 3000,
        })

        return result
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '验证码发送失败'
        errors.value.phone = errorMessage
        toast.add({
            severity: 'error',
            summary: '发送失败',
            detail: errorMessage,
            life: 5000,
        })
        throw error
    }
}

const loginWithEmail = async () => {
    try {
        isEmailLoggingIn.value = true
        errors.value.emailCode = ''

        if (!emailCode.value || emailCode.value.length !== 6) {
            errors.value.emailCode = '请输入6位验证码'
            return
        }

        if (!/^\d{6}$/.test(emailCode.value)) {
            errors.value.emailCode = '验证码格式不正确'
            return
        }

        // 使用authClient进行邮箱验证码登录
        const result = await authClient.signIn.emailOtp({
            email: email.value,
            otp: emailCode.value,
        })

        if (result.error) {
            throw new Error(result.error.message || '登录失败')
        }

        // 成功登录
        toast.add({
            severity: 'success',
            summary: '登录成功',
            detail: '即将跳转到个人中心',
            life: 2000,
        })

        setTimeout(() => {
            navigateTo('/profile')
        }, 1200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登录失败'
        errors.value.emailCode = errorMessage
        toast.add({
            severity: 'error',
            summary: '登录失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        isEmailLoggingIn.value = false
    }
}

const loginWithPhone = async () => {
    try {
        isPhoneLoggingIn.value = true
        errors.value.phoneCode = ''

        if (!phoneCode.value || phoneCode.value.length !== 6) {
            errors.value.phoneCode = '请输入6位验证码'
            return
        }

        if (!/^\d{6}$/.test(phoneCode.value)) {
            errors.value.phoneCode = '验证码格式不正确'
            return
        }

        // 使用authClient进行手机验证码登录
        const result = await authClient.phoneNumber.verify({
            phoneNumber: phone.value,
            code: phoneCode.value,
        })

        if (result.error) {
            throw new Error(result.error.message || '登录失败')
        }

        // 成功登录
        toast.add({
            severity: 'success',
            summary: '登录成功',
            detail: '即将跳转到个人中心',
            life: 2000,
        })

        setTimeout(() => {
            navigateTo('/profile')
        }, 1200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登录失败'
        errors.value.phoneCode = errorMessage
        toast.add({
            severity: 'error',
            summary: '登录失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        isPhoneLoggingIn.value = false
    }
}

// 初始化
onMounted(() => {
    // 确保默认值
    if (!['email', 'phone'].includes(params.tab as string)) {
        params.tab = 'email'
    }

    // 如果手机登录未启用但URL参数是phone，则切换到email
    if (params.tab === 'phone' && !phoneEnabled) {
        params.tab = 'email'
    }

    activeTab.value = params.tab
})
</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
    background: $background;

    @media (width >=768px) {
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

    @media (width >=768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-right {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 1rem;

    @media (width >=768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    width: 100%;
    max-width: 500px;
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

.login-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

// 添加媒体查询优化小屏幕显示
@media (width <= 375px) {
    .login-btn .p-button {
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
    }
}

@media (width <= 320px) {
    .login-btn .p-button {
        padding: 0.5rem !important;
        font-size: 0.75rem !important;
    }
}

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
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

.separator {
    display: flex;
    align-items: center;
    margin: 2rem 0;
    color: $secondary-light;

    &::before,
    &::after {
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
        content: "";
    }

    &::before {
        margin-right: 1rem;
    }

    &::after {
        margin-left: 1rem;
    }
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

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem;
    font-size: 0.95rem;
}

.agreement-notice {
    margin-top: 0.75rem;
    color: $secondary-light;
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: center;
}

.agreement-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}
</style>
