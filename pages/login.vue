<template>
    <div class="login-container">
        <div class="login-left">
            <h1 class="login-title">
                草梅Auth统一登录平台
            </h1>
            <p class="login-subtitle">
                安全、便捷的一站式登录体验
            </p>
            <div class="login-logo">
                <img src="/logo.png" alt="logo">
            </div>
        </div>
        <div class="login-right">
            <div class="login-card">
                <h2 class="login-title">
                    欢迎回来
                </h2>
                <p class="login-subtitle">
                    请使用您的账号信息登录
                </p>
                <div class="login-btn mb-4" style="display: flex; gap: 1rem;">
                    <div class="btn-group">
                        <Button
                            :class="{active: activeTab === 'username'}"
                            severity="secondary"
                            @click="activeTab = 'username'"
                        >
                            用户名登录
                        </Button>
                        <Button
                            :class="{active: activeTab === 'email'}"
                            severity="secondary"
                            @click="activeTab = 'email'"
                        >
                            邮箱登录
                        </Button>
                        <Button
                            :class="{active: activeTab === 'phone'}"
                            severity="secondary"
                            @click="activeTab = 'phone'"
                        >
                            手机号登录
                        </Button>
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
                        <label class="form-label" for="emailPassword">密码</label>
                        <Password
                            id="emailPassword"
                            v-model="emailPassword"
                            class="form-input"
                            placeholder="请输入密码"
                            toggle-mask
                        />
                        <div v-if="errors.emailPassword" class="error-message">
                            {{ errors.emailPassword }}
                        </div>
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
                            class="form-input"
                            placeholder="请输入密码"
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
                        <InputText
                            id="phone"
                            v-model="phone"
                            class="form-input"
                            placeholder="请输入手机号"
                        />
                        <div v-if="errors.phone" class="error-message">
                            {{ errors.phone }}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="phonePassword">密码</label>
                        <Password
                            id="phonePassword"
                            v-model="phonePassword"
                            class="form-input"
                            placeholder="请输入密码"
                            toggle-mask
                        />
                        <div v-if="errors.phonePassword" class="error-message">
                            {{ errors.phonePassword }}
                        </div>
                    </div>
                </div>
                <div class="remember-me">
                    <Checkbox v-model="rememberMe" input-id="remember" />
                    <label for="remember">记住我</label>
                </div>
                <Button
                    class="btn btn-primary"
                    label="登录"
                    @click="login"
                />
                <div class="separator">
                    或者使用以下方式登录
                </div>
                <div class="social-login">
                    <Button
                        class="social-btn social-github"
                        icon="mdi mdi-github"
                        label="使用 GitHub 账号登录"
                        outlined
                        @click="loginWithGitHub"
                    />
                    <Button
                        class="social-btn social-google"
                        icon="mdi mdi-google"
                        label="使用 Google 账号登录"
                        outlined
                        @click="loginWithGoogle"
                    />
                </div>
                <div class="toggle-login">
                    还没有账号？ <NuxtLink to="/register" class="toggle-link">
                        立即注册
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'

const activeTab = ref<'username' | 'email' | 'phone'>('username')
const email = ref('')
const emailPassword = ref('')
const username = ref('')
const usernamePassword = ref('')
const phone = ref('')
const phonePassword = ref('')
const rememberMe = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToast()
const router = useRouter()

function validateEmail(emailValue: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(emailValue)
}
function validatePhone(phoneValue: string) {
  return /^\d{11}$/.test(phoneValue)
}
function login() {
  errors.value = {}
  let isValid = true
  if (activeTab.value === 'email') {
    if (!email.value) {
      errors.value.email = '请输入邮箱'
      isValid = false
    } else if (!validateEmail(email.value)) {
      errors.value.email = '请输入有效的邮箱地址'
      isValid = false
    }
    if (!emailPassword.value) {
      errors.value.emailPassword = '请输入密码'
      isValid = false
    }
  } else if (activeTab.value === 'username') {
    if (!username.value) {
      errors.value.username = '请输入用户名'
      isValid = false
    }
    if (!usernamePassword.value) {
      errors.value.usernamePassword = '请输入密码'
      isValid = false
    }
  } else if (activeTab.value === 'phone') {
    if (!phone.value) {
      errors.value.phone = '请输入手机号'
      isValid = false
    } else if (!validatePhone(phone.value)) {
      errors.value.phone = '请输入有效的手机号'
      isValid = false
    }
    if (!phonePassword.value) {
      errors.value.phonePassword = '请输入密码'
      isValid = false
    }
  }
  if (isValid) {
    toast.add({
      severity: 'success',
      summary: '登录成功',
      detail: '即将跳转到首页',
      life: 2000,
    })
    setTimeout(() => {
      router.push('/')
    }, 1200)
  }
}
function loginWithGitHub() {
  toast.add({
    severity: 'info',
    summary: 'GitHub 登录',
    detail: '即将跳转到 GitHub 登录页面',
    life: 2000,
  })
}
function loginWithGoogle() {
  toast.add({
    severity: 'info',
    summary: 'Google 登录',
    detail: '即将跳转到 Google 登录页面',
    life: 2000,
  })
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  min-height: 100vh;
  flex-direction: column-reverse;
  @media (min-width: 768px) {
    flex-direction: row;
  }
}
.login-left {
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  min-height: 20vh;
//   background: linear-gradient(135deg, #e63946 0%, #a52834 100%);
  .login-logo img {
    width: 80%;
    max-width: 160px;
  }
  @media (min-width: 768px) {
    width: 50%;
    min-height: 100vh;
    .login-logo img {
      width: 25%;
      max-width: none;
    }
  }
}
.login-right {
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
.login-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}
.login-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2d3748;
}
.login-subtitle {
  color: #718096;
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
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-size: 1rem;
}
.form-input:focus {
  outline: none;
  border-color: #e63946;
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
}
.login-btn {
  display: flex;
}
.btn-group {
  display: flex;
  border: 1px solid #e63946;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  .p-button {
    border: none;
    background: #fff;
    color: #e63946;
    border-radius: 0;
    box-shadow: none;
    transition: background 0.2s, color 0.2s;
    &.active,
    &:focus.active {
      background: #e63946;
      color: #fff;
    }
    &:not(:last-child) {
      border-right: 1px solid #e63946;
    }
  }
}
.error-message {
  color: #e63946;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
.remember-me {
  display: flex;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
}
.separator {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: #718096;
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }
  &::before {
    margin-right: 1rem;
  }
  &::after {
    margin-left: 1rem;
  }
}
.social-login {
  margin-top: 2rem;
  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-bottom: 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background-color: #fff;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1rem;
    &.social-github {
      color: #24292e;
    }
    &.social-google {
      color: #4285f4;
    }
    .p-button-icon {
      margin-right: 0.75rem;
    }
  }
}
.toggle-login {
  margin-top: 1.5rem;
  text-align: center;
  color: #718096;
}
.toggle-link {
  color: #e63946;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
}
</style>
