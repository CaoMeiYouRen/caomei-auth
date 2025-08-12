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
                    <li>
                        错误监控：我们使用 <NuxtLink
                            to="https://sentry.io"
                            external
                            class="external-link"
                        >
                            Sentry
                        </NuxtLink> 服务监控系统错误和性能问题，以提高服务稳定性。该服务仅收集技术错误信息，不包含个人敏感数据。
                    </li>
                    <li>
                        行为分析：我们使用 <NuxtLink
                            to="https://clarity.microsoft.com"
                            external
                            class="external-link"
                        >
                            Microsoft Clarity
                        </NuxtLink>分析用户在关键页面的操作行为，以优化用户体验。该工具会自动对用户标识符进行哈希加密处理，确保隐私安全。我们仅在登录、注册、安全设置等关键功能页面收集必要的操作数据，不会记录用户输入的密码、邮箱等敏感信息。
                    </li>
                    <li>
                        访问统计：我们使用 <NuxtLink
                            to="https://tongji.baidu.com"
                            external
                            class="external-link"
                        >
                            百度统计
                        </NuxtLink>服务收集网站访问数据，包括页面访问量、用户来源、访问时长等信息，用于分析网站使用情况和改进服务质量。该服务会收集匿名的访问统计信息，不会获取用户的个人身份信息。您可以通过浏览器设置或安装相关插件来阻止统计代码的执行。
                    </li>
                    <li>
                        网站分析：我们使用 <NuxtLink
                            to="https://analytics.google.com"
                            external
                            class="external-link"
                        >
                            Google Analytics
                        </NuxtLink> 服务分析网站流量和用户行为，以了解用户如何使用我们的服务并改进用户体验。Google Analytics 会收集匿名的使用数据，包括页面访问、用户互动、设备信息和大致地理位置等。这些数据经过匿名化处理，不会直接识别个人身份。Google 会根据其隐私政策处理这些数据。您可以通过安装 Google Analytics 退出插件或调整浏览器设置来选择不被追踪。
                    </li>
                    <li>Cookie 使用：我们使用 Cookie 来维持登录状态和提供个性化服务。您可以通过浏览器设置管理 Cookie，但这可能影响部分功能的正常使用。</li>
                    <li>第三方服务：我们集成的第三方登录服务（如 GitHub、Google 等）将按照其各自的隐私政策处理您的数据。</li>
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

.external-link {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
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
