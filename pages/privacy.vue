<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                隐私政策
            </h1>
            <div class="auth-section">
                <ol>
                    <li>数据收集：我们会收集用户的邮箱、手机号、用户名等信息，用于账号注册、登录和提供服务。</li>
                    <li>数据使用：收集的数据仅用于提供服务、保障账号安全和改善用户体验。</li>
                    <li>数据存储：用户数据会存储在安全的服务器上，采取加密等措施保护数据安全。</li>
                    <li>数据共享：未经用户同意，不会将用户数据共享给第三方，法律法规另有规定的除外。</li>
                    <li>用户权利：用户有权访问、修改和删除自己的数据，可随时联系我们行使这些权利。</li>
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
