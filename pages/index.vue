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
                    <CaomeiButton
                        v-if="session?.user?.role?.includes('admin')"
                        block
                        tone="warning"
                        @click="toAdmin"
                    >
                        <template #icon>
                            <i class="mdi mdi-cog" aria-hidden="true" />
                        </template>
                        管理后台
                    </CaomeiButton>
                    <!-- 如果session 存在，则显示跳转资料页-->
                    <CaomeiButton
                        v-if="session?.user"
                        block
                        @click="toProfile"
                    >
                        <template #icon>
                            <i class="mdi mdi-account" aria-hidden="true" />
                        </template>
                        前往个人中心
                    </CaomeiButton>
                    <CaomeiButton
                        block
                        @click="toLogin"
                    >
                        <template #icon>
                            <i class="mdi mdi-login" aria-hidden="true" />
                        </template>
                        前往登录页
                    </CaomeiButton>
                    <CaomeiButton
                        block
                        @click="toQuickLogin"
                    >
                        <template #icon>
                            <i class="mdi mdi-flash" aria-hidden="true" />
                        </template>
                        前往快速登录页
                    </CaomeiButton>
                    <CaomeiButton
                        block
                        @click="toRegister"
                    >
                        <template #icon>
                            <i class="mdi mdi-account-plus" aria-hidden="true" />
                        </template>
                        前往注册页
                    </CaomeiButton>
                    <CaomeiButton
                        block
                        @click="toForgotPassword"
                    >
                        <template #icon>
                            <i class="mdi mdi-lock-reset" aria-hidden="true" />
                        </template>
                        前往忘记密码页
                    </CaomeiButton>
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
import AuthLeft from '@/components/auth-left.vue'
import { useIndexFlow } from '@/composables/use-index-flow'

const {
    session,
    toLogin,
    toQuickLogin,
    toRegister,
    toForgotPassword,
    toProfile,
    toAdmin,
} = await useIndexFlow()
</script>

<style scoped lang="scss">

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

    @include dark-mode {
        background: #{$dark-background-light} !important;
        border-color: #{$dark-border-color} !important;
        color: #{$dark-secondary} !important;
    }

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

@include auth-page-extended-dark-theme;
</style>
