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
                <div class="form-group">
                    <ButtonGroup>
                        <Button
                            label="邮箱"
                            icon="mdi mdi-email"
                            :class="{'p-button-outlined': activeTab !== 'email'}"
                            @click="changeMode('email')"
                        />
                        <Button
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
                        <label class="form-label" for="username">用户名 <span style="color: #e63946">*</span></label>
                        <InputText
                            id="username"
                            v-model="username"
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
                        <label class="form-label" for="email">邮箱 <span style="color: #e63946">*</span></label>
                        <InputText
                            id="email"
                            v-model="email"
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
                        <label class="form-label" for="password">密码 <span style="color: #e63946">*</span></label>
                        <Password
                            id="password"
                            v-model="password"
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
                        <label class="form-label" for="confirmPassword">确认密码 <span style="color: #e63946">*</span></label>
                        <Password
                            id="confirmPassword"
                            v-model="confirmPassword"
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
                        <label class="form-label" for="username">用户名 <span style="color: #e63946">*</span></label>
                        <InputText
                            id="username"
                            v-model="username"
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
                        <label class="form-label" for="phone">手机号 <span style="color: #e63946">*</span></label>
                        <PhoneInput v-model="phone" />
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
                        <label class="form-label" for="phoneCode">短信验证码 <span style="color: #e63946">*</span></label>
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

                <Button
                    class="btn btn-primary mt-2"
                    label="注册"
                    @click="register"
                />
                <div class="toggle-login">
                    已有账号？ <NuxtLink :to="`/login?mode=${activeTab}`" class="toggle-link">
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
import { useToast } from 'primevue/usetoast'
import ButtonGroup from 'primevue/buttongroup'
import { validateEmail, validatePhone, usernameValidator } from '@/utils/validate'
import { useSendPhoneCode } from '@/utils/code'
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'

const username = ref('')
const email = ref('')
const phone = ref('')
const phoneCode = ref('')
const phoneCodeSending = ref(false)
const password = ref('')
const confirmPassword = ref('')
const errors = ref<Record<string, string>>({})
const toast = useToast()

// 使用 useUrlSearchParams 获取 URL 参数
const params = useUrlSearchParams<{ mode: 'email' | 'phone' }>('history', { initialValue: { mode: 'email' } })
const activeTab = ref<'email' | 'phone'>('email')

const sendPhoneCode = useSendPhoneCode(phone, 'sign-in', validatePhone, errors, phoneCodeSending)

onMounted(() => {
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
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.auth-container {
    display: flex;
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
    margin-bottom: 0.25rem;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-size: 1rem;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
}

.register-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.card {
    width: 100%;
    display: flex;
    justify-content: center;
}

.separator {
    color: $secondary-light;
    display: flex;
    align-items: center;
    margin: 2rem 0;
    justify-content: center;
    gap: 0.5rem;

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

.toggle-link {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
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

.toggle-login {
    margin-top: 1em;
}
</style>

import { passwordValidator } from '@/utils/validate'
