<template>
    <div class="auth-container">
        <AuthLeft title="快速登录" subtitle="智能识别，一步到位。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    快速登录
                </h2>
                <p class="auth-subtitle">
                    输入邮箱或手机号，一键完成登录注册
                </p>

                <!-- 智能输入框 -->
                <div class="smart-input-section">
                    <div class="form-group">
                        <label class="form-label" for="account">邮箱地址或手机号</label>
                        <div v-if="inputType === 'phone' && showRegionSelector" class="phone-input-wrapper">
                            <!-- 国家/地区选择器 -->
                            <Dropdown
                                v-model="selectedRegion"
                                class="region-dropdown"
                                :options="regionOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="CN +86"
                                filter
                                :filter-placeholder="'搜索国家/地区'"
                                @change="handleRegionChange"
                            >
                                <template #option="{option}">
                                    <div class="region-option">
                                        <span class="region-name">{{
                                            option.label
                                        }}</span>
                                    </div>
                                </template>
                            </Dropdown>
                            <!-- 手机号输入框 -->
                            <div class="phone-input smart-input">
                                <InputText
                                    id="account"
                                    v-model="account"
                                    class="form-input"
                                    :class="{error: hasInputError}"
                                    placeholder="请输入手机号"
                                    @input="handleInputChange"
                                    @blur="handleInputBlur"
                                />
                                <!-- 输入类型指示器 -->
                                <div class="input-type-indicator">
                                    <i class="mdi mdi-phone type-icon" />
                                    <span class="type-text">手机号</span>
                                </div>
                            </div>
                        </div>
                        <div
                            v-else
                            class="smart-input"
                            :class="{'has-type': inputType !== 'unknown'}"
                        >
                            <InputText
                                id="account"
                                v-model="account"
                                class="form-input"
                                :class="{error: hasInputError}"
                                placeholder="请输入邮箱地址或手机号"
                                @input="handleInputChange"
                                @blur="handleInputBlur"
                            />
                            <!-- 输入类型指示器 -->
                            <div v-if="inputType !== 'unknown'" class="input-type-indicator">
                                <i
                                    :class="inputType === 'email'
                                        ? 'mdi mdi-email'
                                        : 'mdi mdi-phone'
                                    "
                                    class="type-icon"
                                />
                                <span class="type-text">
                                    {{
                                        inputType === "email"
                                            ? "邮箱"
                                            : "手机号"
                                    }}
                                </span>
                            </div>
                        </div>

                        <!-- 输入错误提示 -->
                        <div v-if="inputError && account.trim()" class="error-message">
                            {{ inputError }}
                        </div>
                    </div>

                    <!-- 智能提示信息 -->
                    <div
                        v-if="
                            suggestion.suggestion &&
                                !inputError &&
                                account.trim()
                        "
                        class="suggestion-section"
                    >
                        <Message :severity="getSuggestionSeverity(suggestion)" :closable="false">
                            <div class="suggestion-content">
                                <span class="suggestion-text">{{
                                    suggestion.suggestion
                                }}</span>
                                <Button
                                    v-if="
                                        suggestion.needConfirm &&
                                            !isRegionConfirmed
                                    "
                                    class="confirm-btn"
                                    size="small"
                                    @click="confirmSuggestion"
                                >
                                    确认
                                </Button>
                            </div>
                        </Message>
                    </div>
                </div>

                <!-- 发送验证码 -->
                <div class="form-group">
                    <label class="form-label" for="code">验证码</label>
                    <div class="code-row">
                        <InputText
                            v-if="showCodeInput"
                            id="code"
                            v-model="verificationCode"
                            class="code-input form-input"
                            :class="{error: hasCodeError}"
                            placeholder="请输入6位验证码"
                            maxlength="6"
                            @input="handleCodeInput"
                        />
                        <InputText
                            v-else
                            class="code-input form-input"
                            placeholder="点击获取验证码"
                            disabled
                        />
                        <SendCodeButton
                            class="code-btn"
                            :text="'获取验证码'"
                            :resend-text="'重新发送'"
                            :disabled="!canSendCode"
                            :on-send="sendVerificationCode"
                        />
                    </div>
                    <div v-if="codeError" class="error-message">
                        {{ codeError }}
                    </div>
                </div>

                <!-- 一键登录按钮 -->
                <div v-if="showCodeInput">
                    <Button
                        class="btn btn-primary login-btn"
                        :label="loginButtonText"
                        :loading="isLoggingIn"
                        :disabled="!canLogin"
                        @click="quickLogin"
                    />
                </div>

                <!-- 其他登录方式 -->
                <div class="alternative-login">
                    <div class="separator">
                        其他登录方式
                    </div>
                    <div class="login-links">
                        <NuxtLink to="/login" class="login-link">
                            使用密码登录
                        </NuxtLink>
                        <span class="divider">|</span>
                        <NuxtLink to="/register" class="login-link">
                            传统注册
                        </NuxtLink>
                    </div>
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
import { ref, computed, watch, onMounted } from 'vue'
import AuthLeft from '@/components/auth-left.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import { authClient } from '@/lib/auth-client'
import {
    detectInputType,
    getInputSuggestion,
    formatAccountForVerification,
    validateFormattedAccount,
    getDefaultRegionByLocation,
    saveRegionPreference,
    detectPossibleRegions,
    type InputType,
    type InputSuggestion,
} from '@/utils/smart-input'
import { SUPPORTED_REGIONS } from '@/utils/phone'

// SEO 设置
definePageMeta({
    title: '快速登录 - 草梅 Auth',
    description: '智能识别邮箱和手机号，一键完成登录注册',
})

// 响应式数据
const account = ref('')
const inputType = ref<InputType>('unknown')
const suggestion = ref<InputSuggestion>({
    type: 'unknown',
    suggestion: '',
    needConfirm: false,
    confidence: 0,
})
const inputError = ref('')
const selectedRegion = ref('')
const isRegionConfirmed = ref(false)
const verificationCode = ref('')
const codeError = ref('')

// 状态控制
const isLoggingIn = ref(false)
const showCodeInput = ref(false)
const codeSentAccount = ref('') // 记录已发送验证码的账号

// 组件
const toast = useToast()

// 区域选项
const regionOptions = computed(() => {
    return SUPPORTED_REGIONS.map((region) => {
        return {
            label: `${region.region} +${region.countryCode}`,
            value: region.region,
        }
    })
})

// 计算属性
const showRegionSelector = computed(() => {
    return (
        (inputType.value === 'phone' && suggestion.value.needConfirm)
        || (inputType.value === 'unknown' && suggestion.value.needConfirm)
    )
})

const hasInputError = computed(() => {
    return (
        !!inputError.value
        || (suggestion.value.type === 'unknown'
            && suggestion.value.confidence === 0
            && account.value.length > 0)
    )
})

const hasCodeError = computed(() => {
    return !!codeError.value
})

const canSendCode = computed(() => {
    if (!account.value.trim()) return false

    // 如果需要确认且未确认，不能发送
    if (
        suggestion.value.needConfirm
        && !isRegionConfirmed.value
        && !selectedRegion.value
    ) {
        return false
    }

    // 如果输入有错误，不能发送
    if (hasInputError.value) return false

    // 如果置信度为0，不能发送
    if (suggestion.value.confidence === 0) return false

    return true
})

const canLogin = computed(() => {
    return verificationCode.value.length === 6 && !hasCodeError.value
})

const loginButtonText = computed(() => {
    if (isLoggingIn.value) return '登录中...'
    return '一键登录'
})

// 方法
const handleInputChange = () => {
    // 清除之前的错误
    inputError.value = ''
    codeError.value = ''
    isRegionConfirmed.value = false

    // 检测输入类型
    inputType.value = detectInputType(account.value)
    suggestion.value = getInputSuggestion(account.value)

    // 如果账号变化了，隐藏验证码输入框
    if (codeSentAccount.value && codeSentAccount.value !== account.value) {
        showCodeInput.value = false
        verificationCode.value = ''
    }

    // 自动设置区域（仅对手机号）
    if (inputType.value === 'phone' && suggestion.value.needConfirm) {
        const cleanInput = account.value.trim().replace(/[\s\-()]/g, '')
        const possibleRegions = detectPossibleRegions(cleanInput)

        if (possibleRegions.length > 0 && possibleRegions[0]) {
            // 自动选择最可能的区域
            selectedRegion.value = possibleRegions[0].region
        } else {
            // 使用默认区域
            selectedRegion.value = getDefaultRegionByLocation()
        }
    }
}

const handleInputBlur = () => {
    // 输入失焦时进行最终验证
    if (account.value.trim() && suggestion.value.confidence === 0) {
        inputError.value = '请输入有效的邮箱地址或手机号'
    }
}

const confirmSuggestion = () => {
    isRegionConfirmed.value = true

    if (selectedRegion.value) {
        // 保存用户的区域偏好
        saveRegionPreference(selectedRegion.value)

        toast.add({
            severity: 'success',
            summary: '已确认',
            detail: `已设置为${regionOptions.value.find(
                (r) => r.value === selectedRegion.value,
            )?.label
            }`,
            life: 2000,
        })
    }
}

const handleRegionChange = () => {
    if (selectedRegion.value) {
        isRegionConfirmed.value = true
        saveRegionPreference(selectedRegion.value)
    }
}

const getSuggestionSeverity = (suggestion: InputSuggestion) => {
    if (suggestion.confidence === 0) return 'error'
    if (suggestion.needConfirm) return 'warn'
    return 'success'
}

const sendVerificationCode = async () => {
    inputError.value = ''

    // 格式化账号
    const formattedAccount = formatAccountForVerification(
        account.value,
        selectedRegion.value,
    )

    // 验证格式化后的账号
    if (!validateFormattedAccount(formattedAccount)) {
        throw new Error('账号格式不正确，请检查输入')
    }

    // 实际发送验证码的 API 调用
    console.log('发送验证码到:', formattedAccount)

    // 使用authClient发送验证码
    let result
    if (inputType.value === 'email') {
        // 发送邮箱验证码
        result = await authClient.emailOtp.sendVerificationOtp({
            email: formattedAccount,
            type: 'sign-in',
        })
    } else {
        // 发送手机验证码
        result = await authClient.phoneNumber.sendOtp({
            phoneNumber: formattedAccount,
        })
    }

    if (result.error) {
        throw new Error(result.error.message || '验证码发送失败')
    }

    // 成功发送 - 显示验证码输入框
    codeSentAccount.value = account.value
    showCodeInput.value = true

    const accountType = inputType.value === 'email' ? '邮箱' : '手机号'
    toast.add({
        severity: 'success',
        summary: '验证码已发送',
        detail: `验证码已发送到您的${accountType}，请注意查收`,
        life: 3000,
    })

    return result
}

const handleCodeInput = () => {
    codeError.value = ''

    // 自动提交（当输入6位数字时）
    if (
        verificationCode.value.length === 6
        && /^\d{6}$/.test(verificationCode.value)
    ) {
        // 延迟一下再自动登录，给用户反应时间
        setTimeout(() => {
            if (canLogin.value && !isLoggingIn.value) {
                quickLogin()
            }
        }, 500)
    }
}

const quickLogin = async () => {
    try {
        isLoggingIn.value = true
        codeError.value = ''

        if (!verificationCode.value || verificationCode.value.length !== 6) {
            throw new Error('请输入6位验证码')
        }

        if (!/^\d{6}$/.test(verificationCode.value)) {
            throw new Error('验证码格式不正确')
        }

        // 格式化账号
        const formattedAccount = formatAccountForVerification(
            account.value,
            selectedRegion.value,
        )

        // 实际登录的 API 调用
        console.log('一键登录:', {
            account: formattedAccount,
            code: verificationCode.value,
            type: inputType.value,
        })

        // 使用authClient进行登录
        let result
        if (inputType.value === 'email') {
            // 邮箱验证码登录
            result = await authClient.signIn.emailOtp({
                email: formattedAccount,
                otp: verificationCode.value,
            })
        } else {
            // 手机验证码登录
            result = await authClient.phoneNumber.verify({
                phoneNumber: formattedAccount,
                code: verificationCode.value,
            })
        }

        if (result.error) {
            throw new Error(result.error.message || '登录失败')
        }

        // 成功登录
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
        const errorMessage =
            error instanceof Error ? error.message : '登录失败'
        codeError.value = errorMessage
        toast.add({
            severity: 'error',
            summary: '登录失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        isLoggingIn.value = false
    }
}

// 监听
watch(
    () => inputType.value,
    (newType) => {
        // 当输入类型确定后，重置区域选择状态
        if (newType !== 'phone') {
            selectedRegion.value = ''
            isRegionConfirmed.value = false
        }
    },
)

// 初始化
onMounted(() => {
    // 设置默认区域
    selectedRegion.value = getDefaultRegionByLocation()
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

.smart-input-section {
    margin-bottom: 1.5rem;

    .phone-input-wrapper {
        display: flex;
        align-items: stretch;
        gap: 0.5rem;

        .region-dropdown {
            flex-shrink: 0;
            min-width: 120px;
            padding: 2px;
            line-height: 1.5;

            // :deep(.p-dropdown) {
            //     height: 100%;
            //     border: 1px solid $secondary-bg;
            //     border-radius: 8px;
            //     background-color: $background-light;

            //     .p-dropdown-label {
            //         padding: 0.75rem 1rem;
            //         font-size: 1rem;
            //         line-height: 1.5;
            //     }

            //     .p-dropdown-trigger {
            //         width: 2.5rem;
            //         color: $secondary-light;
            //     }

            //     &:focus-within {
            //         border-color: $primary;
            //         box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
            //     }
            // }
        }

        .phone-input {
            flex: 1;
        }
    }

    .smart-input {
        position: relative;

        &.has-type {
            .form-input {
                padding-right: 80px;
            }
        }

        .input-type-indicator {
            position: absolute;
            top: 50%;
            right: 12px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            color: $secondary-light;
            font-size: 0.85rem;
            background-color: $background;
            border-radius: 4px;
            transform: translateY(-50%);

            .type-icon {
                font-size: 1rem;
            }

            .type-text {
                font-weight: 500;
            }
        }
    }

    .form-input.error {
        border-color: #e74c3c;
        box-shadow: 0 0 0 3px rgb(231 76 60 / 0.2);
    }
}

.suggestion-section {
    margin-bottom: 1rem;

    .suggestion-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;

        .suggestion-text {
            flex: 1;
        }

        .confirm-btn {
            flex-shrink: 0;
        }
    }
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

.code-input-section {
    margin-bottom: 1.5rem;

    .code-input-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .code-input {
            flex: 1;
            text-align: center;
            font-size: 1.1rem;
            letter-spacing: 0.2em;

            &.error {
                border-color: #e74c3c;
                box-shadow: 0 0 0 3px rgb(231 76 60 / 0.2);
            }
        }

        .resend-btn {
            flex-shrink: 0;
            min-width: 120px;
            font-size: 0.875rem;
        }
    }

    .login-btn {
        width: 100%;
        min-height: 44px;
        color: $background-light !important;
        background-color: $primary !important;
        border: none !important;
        transition: background 0.2s;

        &:hover:not(:disabled) {
            background-color: $primary-dark !important;
        }

        &:disabled {
            opacity: 0.6;
        }
    }
}

.alternative-login {
    margin-top: 2rem;
    text-align: center;

    .separator {
        position: relative;
        margin: 1.5rem 0;
        color: $secondary-light;
        font-size: 0.9rem;

        &::before,
        &::after {
            position: absolute;
            top: 50%;
            width: 30%;
            height: 1px;
            background-color: $secondary-bg;
            content: "";
        }

        &::before {
            left: 0;
        }

        &::after {
            right: 0;
        }
    }

    .login-links {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        .login-link {
            color: $primary;
            font-weight: 500;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }

        .divider {
            color: $secondary-light;
        }
    }
}

.agreement-notice {
    margin-top: 1.5rem;
    color: $secondary-light;
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: center;

    .agreement-link {
        color: $primary;
        font-weight: 500;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

// 响应式优化
@media (width <=480px) {
    .auth-card {
        padding: 1.5rem;
    }

    .auth-title {
        font-size: 1.75rem;
    }

    .smart-input-section {
        .phone-input-wrapper {
            flex-direction: column;
            gap: 0.75rem;

            .region-dropdown {
                width: 100%;
                min-width: unset;
            }
        }
    }

    .code-row {
        flex-direction: column;
        gap: 0.5rem;

        .code-btn {
            width: 100%;
            min-width: unset;
        }
    }

    .code-input-wrapper {
        flex-direction: column;
        gap: 0.5rem;

        .code-input {
            text-align: left;
        }

        .resend-btn {
            align-self: stretch;
            min-width: unset;
        }
    }

    .suggestion-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;

        .confirm-btn {
            align-self: flex-end;
        }
    }

    .login-links {
        flex-direction: column;
        gap: 0.5rem;

        .divider {
            display: none;
        }
    }
}
</style>
