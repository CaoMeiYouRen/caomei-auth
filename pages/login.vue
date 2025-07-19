<template>
    <div class="auth-container">
        <AuthLeft title="登录到草梅 Auth" subtitle="多方式登录，安全便捷。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    欢迎回来
                </h2>
                <p class="auth-subtitle">
                    请使用您的账号信息登录
                </p>
                <div class="login-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                label="用户名"
                                icon="mdi mdi-account"
                                :class="{'p-button-outlined': activeTab !== 'username'}"
                                @click="changeMode('username')"
                            />
                            <Button
                                label="邮箱"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': activeTab !== 'email'}"
                                @click="changeMode('email')"
                            />
                            <Button
                                v-if="phoneEnabled"
                                v-tooltip.top="'使用手机号登录'"
                                label="手机号"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': activeTab !== 'phone'}"
                                @click="changeMode('phone')"
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <!-- 邮箱登录表单 -->
                <div v-show="activeTab === 'email'">
                    <div class="form-group">
                        <label class="form-label" for="email">邮箱</label>
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
                        <template v-if="!emailUseCode">
                            <label class="form-label" for="emailPassword">密码</label>
                            <Password
                                id="emailPassword"
                                v-model="emailPassword"
                                class="form-input password-input"
                                placeholder="请输入密码"
                                :feedback="false"
                                toggle-mask
                            />
                            <div v-if="errors.emailPassword" class="error-message">
                                {{ errors.emailPassword }}
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-label-group">
                                <label class="form-label" for="emailCode">验证码</label>
                                <div class="code-row">
                                    <InputText
                                        id="emailCode"
                                        v-model="emailCode"
                                        class="form-input"
                                        placeholder="请输入邮箱验证码"
                                    />
                                    <SendCodeButton
                                        :on-send="sendEmailCode"
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
                        </template>
                        <Button
                            class="switch-btn"
                            text
                            :label="emailUseCode ? '使用密码登录' : '使用验证码登录'"
                            @click="emailUseCode = !emailUseCode"
                        />
                    </div>
                </div>
                <!-- 用户名登录表单 -->
                <div v-show="activeTab === 'username'">
                    <div class="form-group">
                        <label class="form-label" for="username">用户名</label>
                        <InputText
                            id="username"
                            v-model="username"
                            class="form-input"
                            placeholder="请输入用户名"
                        />
                        <div v-if="errors.username" class="error-message">
                            {{ errors.username }}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="usernamePassword">密码</label>
                        <Password
                            id="usernamePassword"
                            v-model="usernamePassword"
                            class="form-input password-input"
                            placeholder="请输入密码"
                            :feedback="false"
                            toggle-mask
                        />
                        <div v-if="errors.usernamePassword" class="error-message">
                            {{ errors.usernamePassword }}
                        </div>
                    </div>
                </div>
                <!-- 手机号登录表单 -->
                <div v-show="activeTab === 'phone'">
                    <div class="form-group">
                        <label class="form-label" for="phone">手机号</label>
                        <PhoneInput v-model="phone" />
                        <div v-if="errors.phone" class="error-message">
                            {{ errors.phone }}
                        </div>
                    </div>
                    <div class="form-group">
                        <template v-if="!phoneUseCode">
                            <label class="form-label" for="phonePassword">密码</label>
                            <Password
                                id="phonePassword"
                                v-model="phonePassword"
                                class="form-input password-input"
                                placeholder="请输入密码"
                                :feedback="false"
                                toggle-mask
                            />
                            <div v-if="errors.phonePassword" class="error-message">
                                {{ errors.phonePassword }}
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-label-group">
                                <label class="form-label" for="phoneCode">验证码</label>
                                <div class="code-row">
                                    <InputText
                                        id="phoneCode"
                                        v-model="phoneCode"
                                        class="form-input"
                                        placeholder="请输入短信验证码"
                                    />
                                    <SendCodeButton
                                        :on-send="sendPhoneCode"
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
                        </template>
                        <Button
                            class="switch-btn"
                            text
                            :label="phoneUseCode ? '使用密码登录' : '使用验证码登录'"
                            @click="phoneUseCode = !phoneUseCode"
                        />
                    </div>
                </div>
                <div class="remember-me">
                    <Checkbox
                        v-model="rememberMe"
                        v-tooltip.top="'勾选后下次登录将自动填充您的账号信息'"
                        input-id="remember"
                        binary
                    />
                    <label for="remember">记住我</label>
                </div>
                <Button
                    class="btn btn-primary"
                    label="登录"
                    @click="login"
                />
                <template v-if="socialProviders.length">
                    <div class="separator">
                        或者使用以下方式登录
                    </div>
                    <div class="social-login">
                        <Button
                            v-for="provider in socialProviders"
                            :key="provider.provider"
                            v-tooltip.top="provider.tooltip"
                            :class="['social-btn', `social-${provider.provider}`]"
                            :icon="provider.icon || `mdi mdi-${provider.provider}`"
                            :label="provider.label || `使用 ${provider.name} 账号登录`"
                            outlined
                            @click="loginWithSocial(provider)"
                        />
                    </div>
                </template>
                <div class="toggle-login">
                    还没有账号？ <NuxtLink :to="`/register?mode=${activeTab}`" class="toggle-link">
                        立即注册
                    </NuxtLink>
                    <span class="divider">|</span>
                    <NuxtLink :to="`/forgot-password?mode=${activeTab}`" class="toggle-link">
                        忘记密码？
                    </NuxtLink>
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
import { authClient, AUTH_BASE_URL } from '@/lib/auth-client'
import type { SocialProvider } from '@/types/social'
import { phoneEnabled } from '@/utils/env'

const activeTab = ref<'username' | 'email' | 'phone'>('username')
const email = ref('')
const emailPassword = ref('')
const username = ref('')
const usernamePassword = ref('')
const phone = ref('')
const phonePassword = ref('')
const rememberMe = ref(true)
const errors = ref<Record<string, string>>({})
const toast = useToast()
const emailUseCode = ref(false)
const emailCode = ref('')
const emailCodeSending = ref(false)
const phoneUseCode = ref(false)
const phoneCode = ref('')
const phoneCodeSending = ref(false)

const { data: providersData } = await useFetch('/api/social/providers')

const socialProviders = computed(() => providersData.value?.providers || [])

const sendEmailCode = useSendEmailCode(email, 'sign-in', validateEmail, errors, emailCodeSending)
const sendPhoneCode = useSendPhoneCode(phone, 'sign-in', validatePhone, errors, phoneCodeSending)

// 使用 useUrlSearchParams 获取 URL 参数
const params = useUrlSearchParams<{ mode: 'username' | 'email' | 'phone' }>('history', { initialValue: { mode: 'username' } })

onMounted(() => {
    // 确保默认值
    if (!['username', 'email', 'phone'].includes(params.mode as string)) {
        params.mode = 'username'
    }
    activeTab.value = params.mode
})

// 切换登录模式并更新 URL
const changeMode = (mode: 'username' | 'email' | 'phone') => {
    // 如果短信功能未启用且尝试切换到手机登录，提示错误并阻止切换
    if (mode === 'phone' && !phoneEnabled) {
        toast.add({ severity: 'error', summary: '功能未启用', detail: '短信功能未启用，请使用其他方式登录', life: 3000 })
        return
    }
    params.mode = mode
    activeTab.value = mode
}

async function login() {
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

        if (emailUseCode.value) {
            if (!emailCode.value) {
                errors.value.emailCode = '请输入验证码'
                return
            }
        } else if (!emailPassword.value) {
            errors.value.emailPassword = '请输入密码'
            return
        }

        try {
            const result = emailUseCode.value
                ? await authClient.signIn.emailOtp({
                    email: email.value,
                    otp: emailCode.value,
                })
                : await authClient.signIn.email({
                    email: email.value,
                    password: emailPassword.value,
                    rememberMe: rememberMe.value,
                })

            if (result.error) {
                throw new Error(result.error.message || '登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '即将跳转到首页',
                life: 2000,
            })
            setTimeout(() => {
                navigateTo('/profile')
            }, 1200)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '登录失败',
                detail: errorMessage,
                life: 5000,
            })
        }
        return
    }

    if (activeTab.value === 'username') {
        if (!username.value) {
            errors.value.username = '请输入用户名'
            return
        }
        if (!usernamePassword.value) {
            errors.value.usernamePassword = '请输入密码'
            return
        }

        try {
            const result = await authClient.signIn.username({
                username: username.value,
                password: usernamePassword.value,
            })

            if (result.error) {
                throw new Error(result.error.message || '登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '即将跳转到首页',
                life: 2000,
            })
            setTimeout(() => {
                navigateTo('/profile')
            }, 1200)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '登录失败',
                detail: errorMessage,
                life: 2000,
            })
        }
        return
    }

    if (activeTab.value === 'phone') {
        if (!phone.value) {
            errors.value.phone = '请输入手机号'
            return
        }
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            return
        }

        if (phoneUseCode.value) {
            if (!phoneCode.value) {
                errors.value.phoneCode = '请输入验证码'
                return
            }
        } else if (!phonePassword.value) {
            errors.value.phonePassword = '请输入密码'
            return
        }

        try {
            let result
            if (phoneUseCode.value) {
                result = await authClient.phoneNumber.verify({
                    phoneNumber: phone.value,
                    code: phoneCode.value,
                })
            } else {
                result = await authClient.signIn.phoneNumber({
                    phoneNumber: phone.value,
                    password: phonePassword.value,
                    rememberMe: rememberMe.value,
                })
            }

            if (result.error) {
                throw new Error(result.error.message || '登录失败')
            }

            toast.add({
                severity: 'success',
                summary: '登录成功',
                detail: '即将跳转到首页',
                life: 2000,
            })
            setTimeout(() => {
                navigateTo('/profile')
            }, 1200)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '登录时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '登录失败',
                detail: errorMessage,
                life: 2000,
            })
        }
    }
}

async function loginWithSocial(socialProvider: SocialProvider) {
    const { provider, name, social, oauth2 } = socialProvider
    if (provider === 'anonymous') {
        // 处理匿名登录
        await loginAnonymously()
        return
    }
    try {
        let result: any
        if (social) {
            result = await authClient.signIn.social({
                provider,
                callbackURL: `${AUTH_BASE_URL}/profile`, // 回调到资料页
            })
        } else if (oauth2) {
            result = await authClient.signIn.oauth2({
                providerId: provider,
                callbackURL: `${AUTH_BASE_URL}/profile`, // 回调到资料页
            })
        }
        if (!result || result.error) {
            throw new Error(result?.error?.message || `${name} 登录失败`)
        }
        toast.add({
            severity: 'success',
            summary: `正在通过 ${name} 登录`,
            detail: '即将跳转到登录页',
            life: 2000,
        })
        setTimeout(() => {
            navigateTo('/profile')
        }, 1200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `${name} 登录时发生未知错误`
        toast.add({
            severity: 'error',
            summary: `${name} 登录失败`,
            detail: errorMessage,
            life: 5000,
        })
    }
}

async function loginAnonymously() {
    try {
        const result = await authClient.signIn.anonymous()

        if (result.error) {
            throw new Error(result.error.message || '匿名登录失败')
        }

        toast.add({
            severity: 'success',
            summary: '匿名登录成功',
            detail: '即将跳转到首页',
            life: 2000,
        })
        setTimeout(() => {
            navigateTo('/profile')
        }, 1200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '匿名登录时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '匿名登录失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}

</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.login-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

// 添加媒体查询优化小屏幕显示
@media (max-width: 375px) {
    .login-btn .p-button {
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
    }
}

@media (max-width: 320px) {
    .login-btn .p-button {
        padding: 0.5rem 0.5rem !important;
        font-size: 0.75rem !important;
    }
}

.auth-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column-reverse;
    background: $background;

    @media (min-width: 768px) {
        flex-direction: row;
    }
}

.auth-left {
    color: $background-light;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    min-height: 20vh;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (min-width: 768px) {
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
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 60vh;

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 450px;
}

.auth-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
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
    border: 1px solid $secondary-bg;
    background-color: $background-light;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-size: 1rem;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2); // 可考虑用rgba($primary, 0.2)如有mixin
}

.separator {
    color: $secondary-light;
    display: flex;
    align-items: center;
    margin: 2rem 0;

    &::before,
    &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
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
    text-align: center;
    color: $secondary-light;
}

.toggle-link {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
}

.remember-me {
    display: flex;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
    color: $secondary-light;

    label {
        margin-left: 0.5rem;
        cursor: pointer;
    }
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    border-radius: 8px;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
}

.btn-primary {
    background-color: $primary !important;
    color: $background-light !important;
    border: none !important;
    width: 100%;
    min-height: 44px;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.p-password {
    padding: 0 0 0 0;
    width: 100%;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem 0.75rem;
    font-size: 0.95rem;
}

.switch-btn {
    margin-top: 0.5rem;
    width: 100%;
}

</style>

<style lang="scss">
.password-input {
    .p-password-input {
        width: 100%;
        border: none;
    }
}
.social-btn {
    .icon-discord-simple {
        // font-size: 16px;
        padding-top: 2px;
    }
}
</style>
