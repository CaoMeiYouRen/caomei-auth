<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                关于草梅 Auth 统一登录平台
            </h1>
            <p class="auth-subtitle">
                草梅 Auth 是一个基于 Nuxt 全栈框架的现代化统一登录平台，支持 OAuth2.0 协议，集成邮箱、用户名、手机号、验证码、社交媒体等多种登录注册方式，安全、便捷、可扩展。
            </p>
            <div class="auth-section">
                <h2>主要功能特性</h2>
                <ul>
                    <li>支持 OAuth2.0 协议，便于与各类应用集成</li>
                    <li>多种登录/注册方式：邮箱、用户名、手机号、验证码、社交媒体等</li>
                    <li>用户权限管理基于 better-auth</li>
                    <li>邮件服务基于 nodemailer</li>
                    <li>响应式设计，用户体验友好</li>
                    <li>多因子认证与安全性设计</li>
                    <li>支持 Node.js、Docker、Vercel、Cloudflare Workers 等多种部署</li>
                </ul>
            </div>
            <div class="auth-section">
                <h2>技术栈</h2>
                <ul>
                    <li>全栈框架：Nuxt 3.x（Vue 3.x + SSR + API 路由）</li>
                    <li>权限与认证：better-auth、OAuth2.0 Server</li>
                    <li>邮件与短信：nodemailer、第三方短信服务</li>
                    <li>样式与图标：SCSS、@mdi/font</li>
                    <li>数据库：PostgreSQL/MySQL/SQLite（可选）</li>
                    <li>包管理器：pnpm</li>
                </ul>
            </div>
            <div class="auth-section">
                <h2>主题色与设计规范</h2>
                <p>
                    平台主色调为红色（#e63946），强调安全与活力，采用完整主色调色板，风格现代明快。样式统一使用 SCSS 变量，便于主题切换和风格统一。
                </p>
            </div>
            <div class="auth-section">
                <h2>开源协议</h2>
                <p>
                    本项目遵循 <a href="https://github.com/CaoMeiYouRen/caomei-auth/blob/master/LICENSE" target="_blank">MIT
                        License</a> 开源协议，欢迎贡献与交流。
                </p>
            </div>
            <div class="auth-author auth-section">
                <span>作者：</span>
                <a href="https://github.com/CaoMeiYouRen" target="_blank">CaoMeiYouRen</a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// about 页面无需特殊逻辑
</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/common';

.auth-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column-reverse;
    background-color: $background;

    @media (min-width: 768px) {
        flex-direction: row;
    }
}

.auth-main {
    max-width: 800px;
    margin: 2.5rem auto 2rem auto;
    padding: 2rem 1.2rem;
    // background: $background;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
    color: $secondary;
}

.auth-title {
    font-size: 2rem;
    font-weight: 700;
    color: $primary;
    margin-bottom: 1.2rem;
    letter-spacing: 1px;
    text-align: center;
}

.auth-subtitle {
    font-size: 1.15rem;
    color: $secondary-light;
    margin-bottom: 2rem;
    text-align: center;
}

.auth-section {
    margin-bottom: 2rem;

    h2 {
        font-size: 1.18rem;
        color: $primary-dark;
        font-weight: 600;
        margin-bottom: 0.7rem;
    }

    ul {
        padding-left: 1.2rem;

        li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
        }
    }

    p {
        color: $secondary-light;
        font-size: 1rem;
    }

    a {
        color: $primary;
        text-decoration: none;
        margin-left: 0.3rem;

        &:hover {
            text-decoration: underline;
        }
    }
}

.auth-author {
    text-align: right;
    font-size: 0.98rem;
    color: $secondary-light;

    a {
        color: $primary;
        text-decoration: none;
        margin-left: 0.3rem;

        &:hover {
            text-decoration: underline;
        }
    }
}

@media (max-width: 600px) {
    .auth-container {
        padding: 1.2rem 1.2rem;
    }

    .auth-title {
        font-size: 1.3rem;
    }
}
</style>
