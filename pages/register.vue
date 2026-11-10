<template>
    <div class="auth-container">
        <AuthLeft title="注册新账号" subtitle="欢迎加入草梅 Auth，支持邮箱、手机号注册，可设置用户名。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    创建新账号
                </h2>
                <p class="auth-subtitle">
                    请填写以下信息完成注册
                </p>
                <div class="card form-group">
                    <CaomeiButtonGroup group-label="注册方式">
                        <CaomeiButton
                            :variant="activeTab === 'email' ? 'primary' : 'secondary'"
                            :aria-pressed="activeTab === 'email'"
                            @click="changeMode('email')"
                        >
                            <template #icon>
                                <i class="mdi mdi-email" />
                            </template>
                            邮箱
                        </CaomeiButton>
                        <CaomeiButton
                            v-if="phoneEnabled"
                            :variant="activeTab === 'phone' ? 'primary' : 'secondary'"
                            :aria-pressed="activeTab === 'phone'"
                            title="使用手机号注册"
                            @click="changeMode('phone')"
                        >
                            <template #icon>
                                <i class="mdi mdi-phone" />
                            </template>
                            手机号
                        </CaomeiButton>
                    </CaomeiButtonGroup>
                </div>

                <!-- 邮箱注册表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseInputV2
                        id="emailNickname"
                        v-model="nickname"
                        label="昵称"
                        placeholder="请输入昵称"
                        :error="errors.nickname"
                        required
                        title="昵称长度为2到36个字符，不能包含特殊控制字符。昵称将用于展示"
                    />
                    <div v-if="usernameEnabled">
                        <BaseInputV2
                            id="emailUsername"
                            v-model="username"
                            label="用户名"
                            placeholder="请输入用户名"
                            :error="errors.username"
                            required
                            title="用户名长度为2到36个字符，只能包含字母、数字、下划线和连字符。用户名将用于登录"
                        />
                    </div>
                    <BaseInputV2
                        id="email"
                        v-model="email"
                        label="邮箱"
                        placeholder="example@mail.com"
                        :error="errors.email"
                        required
                        title="请输入有效的邮箱地址，用于接收验证邮件"
                    />
                    <BasePasswordV2
                        id="password"
                        v-model="password"
                        label="密码"
                        placeholder="请输入密码"
                        :error="errors.password"
                        required
                        :feedback="false"
                        :title="getPasswordRequirementsShort()"
                    >
                        <template #append>
                            <PasswordStrength
                                :show-strength="!!password"
                                :password="password"
                                :show-score="false"
                                :min-length-for-display="1"
                            />
                        </template>
                    </BasePasswordV2>
                    <BasePasswordV2
                        id="confirmPassword"
                        v-model="confirmPassword"
                        label="确认密码"
                        placeholder="请再次输入密码"
                        :error="errors.confirmPassword"
                        required
                        :feedback="false"
                        title="请再次输入相同的密码以确认"
                    />
                </div>

                <!-- 手机号注册表单 -->
                <div v-show="activeTab === 'phone'">
                    <BaseInputV2
                        id="phoneNickname"
                        v-model="nickname"
                        label="昵称"
                        placeholder="请输入昵称"
                        :error="errors.nickname"
                        required
                        title="昵称长度为2到36个字符，不能包含特殊字符。昵称将用于展示"
                    />
                    <div v-if="usernameEnabled">
                        <BaseInputV2
                            id="phoneUsername"
                            v-model="username"
                            label="用户名"
                            placeholder="请输入用户名"
                            :error="errors.username"
                            required
                            title="用户名长度为2到36个字符，只能包含字母、数字、下划线和连字符。用户名将用于登录"
                        />
                    </div>
                    <BasePhoneInputV2
                        id="phone"
                        v-model="phone"
                        label="手机号"
                        :error="errors.phone"
                        required
                        title="请输入有效的手机号，用于接收短信验证码"
                    />
                    <BaseInputV2
                        id="phoneCode"
                        v-model="phoneCode"
                        label="短信验证码"
                        placeholder="请输入短信验证码"
                        :error="errors.phoneCode"
                        required
                        title="请输入发送到您手机的短信验证码"
                    >
                        <template #append>
                            <SendCodeButtonV2
                                :on-send="sendPhoneCode"
                                :duration="60"
                                :disabled="phoneCodeSending || !validatePhone(phone)"
                                :loading="phoneCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                                title="点击获取短信验证码，验证码将发送到您输入的手机号"
                            />
                        </template>
                    </BaseInputV2>
                </div>

                <!-- 用户协议和隐私政策 -->
                <div class="agreement-section form-group">
                    <CaomeiCheckbox
                        id="agreement"
                        v-model="agreedToTerms"
                        title="勾选表示您已阅读并同意服务条款和隐私政策"
                    >
                        <span class="checkbox-label">
                            我已阅读并同意
                            <NuxtLink
                                to="/terms"
                                target="_blank"
                                class="agreement-link"
                                @click.stop
                            >
                                《服务条款》
                            </NuxtLink>
                            和
                            <NuxtLink
                                to="/privacy"
                                target="_blank"
                                class="agreement-link"
                                @click.stop
                            >
                                《隐私政策》
                            </NuxtLink>
                        </span>
                    </CaomeiCheckbox>
                    <CaomeiMessage
                        v-if="errors.agreement"
                        tone="danger"
                        variant="simple"
                        size="sm"
                        role="alert"
                    >
                        {{ errors.agreement }}
                    </CaomeiMessage>
                </div>

                <Captcha ref="captcha" />
                <CaomeiMessage
                    v-if="errors.captcha"
                    tone="danger"
                    variant="simple"
                    size="sm"
                    role="alert"
                >
                    {{ errors.captcha }}
                </CaomeiMessage>

                <CaomeiButton
                    class="btn btn-primary mt-2"
                    block
                    :loading="loading"
                    @click="register"
                >
                    注册
                </CaomeiButton>
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
import { validatePhone } from '@/utils/shared/validate'
import { getPasswordRequirementsShort } from '@/utils/shared/password'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import AuthLeft from '@/components/auth-left.vue'
import PasswordStrength from '@/components/password-strength.vue'
import Captcha from '@/components/captcha.vue'
import { useRegisterFlow } from '@/composables/use-register-flow'

const {
    nickname,
    username,
    email,
    phone,
    phoneCode,
    password,
    confirmPassword,
    agreedToTerms,
    errors,
    loading,
    captcha,
    activeTab,
    phoneCodeSending,
    phoneEnabled,
    usernameEnabled,
    changeMode,
    sendPhoneCode,
    register,
} = useRegisterFlow()
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

.card {
    display: flex;
    justify-content: center;
    width: 100%;
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

.toggle-login {
    margin-top: 1em;
}

.agreement-section {
    margin-bottom: 1.2rem;
}

.checkbox-label {
    font-size: 0.9rem;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
}

@include dark-mode {
    .checkbox-label {
        color: $dark-secondary;
    }
}

.agreement-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

// 深色主题下的注册页面优化
@include auth-page-extended-dark-theme;
</style>
