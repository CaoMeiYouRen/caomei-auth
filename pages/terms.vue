<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                服务条款
            </h1>
            <div class="auth-section">
                <ol>
                    <li>行为规范：用户需遵守法律法规和平台规则，不得利用平台进行违法违规活动。</li>
                    <li>知识产权：平台内容受知识产权保护，未经授权不得复制、传播。</li>
                    <li>服务监控：为保障服务质量和安全性，我们会监控系统运行状态和用户关键操作行为，所收集的数据仅用于技术优化和问题诊断。</li>
                    <li>数据处理：我们承诺按照隐私政策的规定处理用户数据，不会将个人信息用于营销推广等商业目的。</li>
                    <li>服务变更：我们保留根据业务需要调整服务功能的权利，重大变更将提前通知用户。</li>
                    <li>免责声明：平台尽力提供准确、及时的服务，但不保证服务无中断、无错误，对用户因使用平台造成的损失不承担责任。</li>
                </ol>
            </div>
            <div class="auth-contact auth-section">
                <span>联系方式：</span>
                <NuxtLink
                    :to="contactEmailLink"
                    external
                    class="layout-default__footer-bottom-link"
                >
                    {{ contactEmail }}
                </NuxtLink>
            </div>
            <div class="auth-nav">
                <NuxtLink to="/" class="back-home-btn">
                    <i class="mdi mdi-home" />
                    返回首页
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig().public
const contactEmail = config.contactEmail
const contactEmailLink = `mailto:${config.contactEmail}`
</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/common';

.auth-container{
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

.auth-nav {
    text-align: center;
    margin-bottom: 1.5rem;
}

.back-home-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    background-color: $primary;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
        background-color: $primary-dark;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($primary, 0.3);
    }

    i {
        font-size: 1.1rem;
    }
}
.auth-section {
    margin-bottom: 2rem;
    h2 {
        font-size: 1.18rem;
        color: $primary-dark;
        font-weight: 600;
        margin-bottom: 0.7rem;
    }
    ol {
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
}

.auth-contact {
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
