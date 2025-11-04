<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                服务条款
            </h1>
            <div class="auth-section">
                <ol>
                    <li>
                        <strong>行为规范：</strong>用户在使用本平台时须遵守以下规定：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>遵守国家法律法规和平台使用规则</li>
                            <li>不得利用平台进行违法违规活动，包括但不限于欺诈、洗钱、传播违法信息等</li>
                            <li>不得恶意攻击系统、尝试未授权访问或干扰平台正常运行</li>
                            <li>不得使用虚假信息注册账号或冒充他人身份</li>
                            <li>保护自己的账号安全，不与他人共享登录凭据</li>
                        </ul>
                    </li>
                    <li><strong>知识产权：</strong>平台的所有内容（包括但不限于软件、界面设计、文档、商标等）均受知识产权法律保护。未经明确授权，用户不得复制、修改、分发、出售或以其他方式使用这些内容。</li>
                    <li>
                        <strong>个人信息保护：</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>用户同意我们按照隐私政策收集、使用和保护您的个人信息</li>
                            <li>用户有权随时查看、修改或删除自己的个人信息</li>
                            <li>用户可以选择是否接收我们的营销推广信息</li>
                            <li>我们承诺不会将您的个人信息用于未经授权的商业目的</li>
                        </ul>
                    </li>
                    <li>
                        <strong>营销通信同意：</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>注册时，您可以选择是否同意接收我们的产品更新和推广信息</li>
                            <li>我们可能通过邮件或短信向您发送服务相关的重要通知，这些通知对于账号安全和服务正常使用是必要的</li>
                            <li>对于营销性质的信息，您可以随时退订，这不会影响您正常使用我们的服务</li>
                        </ul>
                    </li>
                    <li><strong>服务监控：</strong>为保障服务质量和安全性，我们会监控系统运行状态和用户关键操作行为。所收集的数据仅用于技术优化、问题诊断和安全防护，严格按照隐私政策执行。</li>
                    <li><strong>服务变更：</strong>我们保留根据业务需要、法律要求或技术发展调整服务功能的权利。对于重大变更（如涉及用户权益的政策调整），我们将通过邮件、站内通知等方式提前通知用户。</li>
                    <li>
                        <strong>免责声明：</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>我们努力提供稳定、安全的服务，但不保证服务完全无中断、无错误或无安全漏洞</li>
                            <li>对于因不可抗力（如自然灾害、网络故障、政府行为等）导致的服务中断，我们不承担责任</li>
                            <li>用户应为自己的行为承担责任，我们不对用户因违反本条款或法律法规而遭受的损失承担责任</li>
                            <li>我们对第三方服务（如第三方登录）的可用性和安全性不承担直接责任</li>
                        </ul>
                    </li>
                    <li>
                        <strong>争议解决：</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>如发生争议，双方应首先通过友好协商解决</li>
                            <li>协商不成的，任何一方均可向平台所在地的法院提起诉讼</li>
                        </ul>
                    </li>
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

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
    background-color: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-main {
    max-width: 800px;
    margin: 2.5rem auto 2rem;
    padding: 2rem 1.2rem;
    color: $secondary;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.07);
}

.auth-title {
    margin-bottom: 1.2rem;
    color: $primary;
    font-weight: 700;
    font-size: 2rem;
    letter-spacing: 1px;
    text-align: center;
}

.auth-nav {
    margin-bottom: 1.5rem;
    text-align: center;
}

.back-home-btn {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.6rem 1.2rem;
    color: white;
    font-weight: 500;
    font-size: 0.95rem;
    text-decoration: none;
    background-color: $primary;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
        background-color: $primary-dark;
        box-shadow: 0 4px 12px rgba($primary, 0.3);
        transform: translateY(-2px);
    }

    i {
        font-size: 1.1rem;
    }
}

.auth-section {
    margin-bottom: 2rem;

    h2 {
        margin-bottom: 0.7rem;
        color: $primary-dark;
        font-weight: 600;
        font-size: 1.18rem;
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
    color: $secondary-light;
    font-size: 0.98rem;
    text-align: right;

    a {
        margin-left: 0.3rem;
        color: $primary;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

@media (width <= 600px) {
    .auth-container {
        padding: 1.2rem;
    }

    .auth-title {
        font-size: 1.3rem;
    }
}

@include auth-page-dark-theme
</style>
