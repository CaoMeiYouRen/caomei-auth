<template>
    <div class="auth-container">
        <AuthLeft title="草梅 Auth 统一登录平台" subtitle="基于 Nuxt 3 的现代化统一登录平台，支持多种登录注册方式，安全、便捷、可扩展。">
            <template #content>
                <div class="auth-links">
                    <NuxtLink
                        to="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        class="project-link"
                    >
                        <i class="mdi mdi-github" /> GitHub 项目地址
                    </NuxtLink>
                    <br>
                    <NuxtLink
                        to="https://auth-docs.cmyr.dev/"
                        target="_blank"
                        class="project-link"
                    >
                        <i class="mdi mdi-book" /> 项目文档
                    </NuxtLink>
                </div>
            </template>
        </AuthLeft>
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    页面入口
                </h2>
                <div class="button-group">
                    <!-- 如果是管理员，显示管理后台按钮 -->
                    <Button
                        v-if="session?.user?.role?.includes('admin')"
                        label="管理后台"
                        icon="mdi mdi-cog"
                        class="btn btn-admin"
                        @click="toAdmin"
                    />
                    <!-- 如果session 存在，则显示跳转资料页-->
                    <Button
                        v-if="session?.user"
                        label="前往个人中心"
                        icon="mdi mdi-account"
                        class="btn btn-primary"
                        @click="toProfile"
                    />
                    <Button
                        label="前往登录页"
                        icon="mdi mdi-login"
                        class="btn btn-primary"
                        @click="toLogin"
                    />
                    <Button
                        label="前往快速登录页"
                        icon="mdi mdi-flash"
                        class="btn btn-primary"
                        @click="toQuickLogin"
                    />
                    <Button
                        label="前往注册页"
                        icon="mdi mdi-account-plus"
                        class="btn btn-primary"
                        @click="toRegister"
                    />
                    <Button
                        label="前往忘记密码页"
                        icon="mdi mdi-lock-reset"
                        class="btn btn-primary"
                        @click="toForgotPassword"
                    />
                </div>
                <div class="separator">
                    GitHub源码
                </div>
                <div class="auth-links-mobile">
                    <a
                        href="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        class="project-link"
                    >
                        <i class="mdi mdi-github" /> GitHub 项目地址
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Button from 'primevue/button'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'

// 使用 SSR 渲染，解决界面刷新时的 UI 重渲染问题
const { data: session } = await authClient.useSession(useFetch)

function toLogin() {
    navigateTo('/login')
}

function toQuickLogin() {
    navigateTo('/quick-login')
}

function toRegister() {
    navigateTo('/register')
}

function toForgotPassword() {
    navigateTo('/forgot-password')
}

function toProfile() {
    navigateTo('/profile')
}

function toAdmin() {
    navigateTo('/admin/users')
}</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-links {
    margin-top: 1.2rem;

    .project-link {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
        padding-bottom: 2px;
        color: $secondary-light;
        font-weight: 500;
        font-size: 1.1rem;
        text-decoration: none;
        border-bottom: 1px dashed rgba($background-light, 0.3);
        transition: color 0.2s;

        &:hover {
            color: $primary-light;
            text-decoration: underline;
        }

        i {
            font-size: 1.3rem;
        }
    }

    @media (width <= 767px) {
        display: none;
    }
}

.auth-links-mobile {
    display: none;

    @media (width <= 767px) {
        display: flex;
        justify-content: center;
        margin-top: 1rem;

        .project-link {
            color: $secondary;
            background: none;
        }
    }
}

.auth-right {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem 1rem;
    background: $background;

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 420px;
    padding: 2.5rem 2rem 2rem;
    background-color: $background-light;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.07);
}

.auth-title {
    margin-bottom: 2rem;
    color: $secondary;
    font-weight: 600;
    font-size: 1.5rem;
    letter-spacing: 0.5px;
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    width: 100%;
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

.btn-admin {
    min-height: 44px;
    color: $background-light !important;
    background-color: #ff6b35 !important;
    border: none !important;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-admin:hover {
    background-color: #e55a2e !important;
}

.separator {
    display: flex;
    align-items: center;
    width: 100%;
    margin: 2rem 0 1rem;
    color: $secondary-light;
    font-size: 0.98rem;

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

    @media (width >= 768px) {
        display: none;
    }
}
</style>
