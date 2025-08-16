<template>
    <div class="auth-container">
        <AuthLeft title="注册新账号" subtitle="欢迎加入草梅 Auth，支持邮箱、手机号注册。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    创建新账号
                </h2>
                <p class="auth-subtitle">
                    请填写以下信息完成注册
                </p>
                <div class="card form-group">
                    <ButtonGroup>
                        <Button
                            label="邮箱"
                            icon="mdi mdi-email"
                            :class="{'p-button-outlined': activeTab !== 'email'}"
                            @click="changeMode('email')"
                        />
                        <Button
                            v-if="phoneEnabled"
                            v-tooltip.top="'使用手机号注册'"
                            label="手机号"
                            icon="mdi mdi-phone"
                            :class="{'p-button-outlined': activeTab!== 'phone'}"
                            @click="changeMode('phone')"
                        />
                    </ButtonGroup>
                </div>

                <!-- 邮箱注册表单 -->
                <div v-show="activeTab === 'email'">
                    <div class="form-group">
                        <label class="form-label" for="username">用户名 <span style="color: #e63946;">*</span></label>
                        <InputText
                            id="username"
                            v-model="username"
                            v-tooltip.top="'用户名只能包含字母、数字、下划线和连字符，长度在2到36个字符之间，且不能为邮箱或手机号格式'"
                            class="form-input"
                            placeholder="请输入用户名"
                        />
                        <Message
                            v-if="errors.username"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.username }}
                        </Message>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email">邮箱 <span style="color: #e63946;">*</span></label>
                        <InputText
                            id="email"
                            v-model="email"
                            v-tooltip.top="'请输入有效的邮箱地址，用于接收验证邮件'"
                            class="form-input"
                            placeholder="example@mail.com"
                        />
                        <Message
                            v-if="errors.email"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.email }}
                        </Message>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">密码 <span style="color: #e63946;">*</span></label>
                        <Password
                            id="password"
                            v-model="password"
                            v-tooltip.top="'密码必须包含至少1个小写字母、1个大写字母、1个数字和1个特殊字符，且长度至少为8个字符'"
                            class="form-input password-input"
                            placeholder="请输入密码"
                            :feedback="false"
                            toggle-mask
                        />
                        <Message
                            v-if="errors.password"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.password }}
                        </Message>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="confirmPassword">确认密码 <span style="color: #e63946;">*</span></label>
                        <Password
                            id="confirmPassword"
                            v-model="confirmPassword"
                            v-tooltip.top="'请再次输入相同的密码以确认'"
                            class="form-input password-input"
                            placeholder="请再次输入密码"
                            :feedback="false"
                            toggle-mask
                        />
                        <Message
                            v-if="errors.confirmPassword"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.confirmPassword }}
                        </Message>
                    </div>
                </div>

                <!-- 手机号注册表单 -->
                <div v-show="activeTab === 'phone'">
                    <div class="form-group">
                        <label class="form-label" for="username">用户名 <span style="color: #e63946;">*</span></label>
                        <InputText
                            id="username"
                            v-model="username"
                            v-tooltip.top="'用户名只能包含字母、数字、下划线和连字符，长度在2到36个字符之间，且不能为邮箱或手机号格式'"
                            class="form-input"
                            placeholder="请输入用户名"
                        />
                        <Message
                            v-if="errors.username"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.username }}
                        </Message>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="phone">手机号 <span style="color: #e63946;">*</span></label>
                        <PhoneInput
                            v-model="phone"
                            v-tooltip.top="'请输入有效的手机号，用于接收短信验证码'"
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
                    <div class="form-group">
                        <label class="form-label" for="phoneCode">短信验证码 <span style="color: #e63946;">*</span></label>
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
                        <Message
                            v-if="errors.phoneCode"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.phoneCode }}
                        </Message>
                    </div>
                </div>

                <!-- 用户协议和隐私政策 -->
                <div class="agreement-section form-group">
                    <div v-tooltip.top="'勾选表示您已阅读并同意服务条款和隐私政策'" class="agreement-checkbox">
                        <Checkbox
                            v-model="agreedToTerms"

                            input-id="agreement"
                            binary
                        />
                        <label for="agreement" class="checkbox-label">
                            我已阅读并同意
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
                        </label>
                    </div>
                    <Message
                        v-if="errors.agreement"
                        severity="error"
                        size="small"
                        variant="simple"
                    >
                        {{ errors.agreement }}
                    </Message>
                </div>

                <Button
                    class="btn btn-primary mt-2"
                    label="注册"
                    @click="register"
                />
                <div class="toggle-login">
                    已有账号？ <NuxtLink
                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        立即登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import ButtonGroup from 'primevue/buttongroup'
import { validateEmail, validatePhone, usernameValidator } from '@/utils/validate'
import { useSendPhoneCode } from '@/utils/code'
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'

const config = useRuntimeConfig().public
const phoneEnabled = config.phoneEnabled

const username = ref('')
const email = ref('')
const phone = ref('')
const phoneCode = ref('')
const phoneCodeSending = ref(false)
const password = ref('')
const confirmPassword = ref('')
const agreedToTerms = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToast()

// 使用 useUrlSearchParams 获取 URL 参数
const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
const activeTab = ref<'email' | 'phone'>('email')

const sendPhoneCode = useSendPhoneCode(phone, 'sign-in', validatePhone, errors, phoneCodeSending)

onMounted(() => {
    // 如果短信功能未启用，强制使用邮箱方式
    if (!phoneEnabled) {
        activeTab.value = 'email'
        params.mode = 'email'
        return
    }
    // 确保默认值
    if (!['email', 'phone'].includes(params.mode as string)) {
        params.mode = 'email'
    }
    activeTab.value = params.mode
})

// 切换注册模式并更新 URL
const changeMode = (mode: 'email' | 'phone') => {
    params.mode = mode
    activeTab.value = mode
}

// 表单验证函数
const resolver = (values: {
    username: string
    email?: string
    phone?: string
    phoneCode?: string
    password?: string
    confirmPassword?: string
    agreedToTerms?: boolean
}) => {
    const newErrors: Record<string, string> = {}

    if (!values.username) {
        newErrors.username = '请输入用户名'
    } else if (!usernameValidator(values.username)) {
        newErrors.username = '用户名只能包含字母、数字、下划线和连字符，长度在2到36个字符之间，且不能为邮箱或手机号格式'
    }

    if (params.mode === 'email') {
        if (!values.email) {
            newErrors.email = '请输入邮箱'
        } else if (!validateEmail(values.email)) {
            newErrors.email = '请输入有效的邮箱地址'
        }
        if (!values.password) {
            newErrors.password = '请输入密码'
        } else if (values.password.length < 6) {
            newErrors.password = '密码长度不能少于6个字符'
        } else if (values.password.length > 64) {
            newErrors.password = '密码长度不能超过64个字符'
        } else if (!passwordValidator(values.password)) {
            newErrors.password = '密码必须包含至少1个小写字母、1个大写字母、1个数字和1个特殊字符，且长度至少为8个字符'
        }
        if (!values.confirmPassword) {
            newErrors.confirmPassword = '请确认密码'
        } else if (values.password !== values.confirmPassword) {
            newErrors.confirmPassword = '两次输入的密码不一致'
        }
    } else if (params.mode === 'phone') {
        if (!values.phone) {
            newErrors.phone = '请输入手机号'
        } else if (!validatePhone(values.phone)) {
            newErrors.phone = '请输入有效的手机号'
        }
        if (!values.phoneCode) {
            newErrors.phoneCode = '请输入短信验证码'
        }
    }

    // 验证用户协议同意
    if (!values.agreedToTerms) {
        newErrors.agreement = '请阅读并同意服务条款和隐私政策'
    }

    return newErrors
}

async function register() {
    const values = {
        username: username.value,
        email: email.value,
        phone: phone.value,
        phoneCode: phoneCode.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        agreedToTerms: agreedToTerms.value,
    }

    // 执行验证
    errors.value = resolver(values)

    // 检查是否有错误
    const isValid = Object.keys(errors.value).length === 0

    if (!isValid) {
        return
    }

    try {
        if (params.mode === 'email') {
            // 使用邮箱和用户名注册
            const { data, error } = await authClient.signUp.email({
                email: email.value,
                password: password.value,
                name: username.value,
                username: username.value,
            })

            if (error) {
                throw new Error(error.message || '注册失败')
            }
        } else if (params.mode === 'phone') {

            // 验证手机号码
            const isVerified = await authClient.phoneNumber.verify({
                phoneNumber: phone.value,
                code: phoneCode.value,
            })

            if (!isVerified.data?.status) {
                throw new Error('手机号码验证失败')
            }
            // 验证手机号之后就自动注册了，所以这里更新用户名
            const { data, error } = await authClient.updateUser({
                name: username.value,
                username: username.value,
            })
            if (error) {
                throw new Error(error.message || '更新用户信息失败')
            }
        }

        toast.add({
            severity: 'success',
            summary: '注册成功',
            detail: params.mode === 'email' ? '验证邮件已发送，请前往邮箱激活账号' : '注册成功，请登录',
            life: 2500,
        })
        setTimeout(() => {
            navigateTo(`/login?mode=${params.mode}`)
        }, 1500)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册过程中发生未知错误'
        toast.add({
            severity: 'error',
            summary: '注册失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}
</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

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
    box-shadow: 0 10px 25px rgb(0 0 0 / 5%);
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
    margin-bottom: 0.25rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: $background-light;
    border: 1px solid $secondary-bg;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgb(230 57 70 / 20%);
}

.register-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.card {
    display: flex;
    justify-content: center;
    width: 100%;
}

.separator {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
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

.p-password {
    width: 100%;
    padding: 0;
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

.toggle-login {
    margin-top: 1em;
}

.agreement-section {
    margin-bottom: 1.2rem;
}

.agreement-checkbox {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.checkbox-label {
    color: $secondary;
    font-size: 0.9rem;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
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

import { passwordValidator } from '@/utils/validate'
