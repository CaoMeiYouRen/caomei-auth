<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                隐私政策
            </h1>
            <div class="auth-section">
                <ol>
                    <li>
                        <strong>数据收集：</strong>我们会收集以下类型的个人信息：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li><strong>邮箱地址：</strong>用于账号注册、登录验证、密码重置、安全通知、以及（在您明确同意的情况下）发送服务相关信息和产品更新通知。</li>
                            <li><strong>手机号码：</strong>用于手机短信验证、多因子认证、账号安全保护、以及（在您明确同意的情况下）发送安全验证码和重要服务通知。</li>
                            <li><strong>用户名：</strong>用于账号标识、个人资料展示和服务个性化。</li>
                            <li><strong>登录凭据：</strong>包括加密后的密码、登录令牌等，用于身份验证和账号安全。</li>
                            <li><strong>设备信息：</strong>包括IP地址、浏览器类型、操作系统版本等，用于安全监控和服务优化。</li>
                        </ul>
                    </li>
                    <li>
                        <strong>数据使用：</strong>我们收集的个人数据将用于以下目的：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>提供账号注册、登录和身份验证服务</li>
                            <li>保障账号安全，包括异常登录监控和多因子认证</li>
                            <li>发送重要的安全通知和服务更新信息</li>
                            <li>改善用户体验和优化服务功能</li>
                            <li>遵守法律法规要求和防范安全风险</li>
                            <li>在您明确同意的前提下，发送产品更新、功能介绍等营销信息</li>
                        </ul>
                    </li>
                    <li>
                        <strong>数据存储：</strong>用户数据会存储在安全的服务器上，我们采取以下安全措施：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>对敏感数据（如密码等）进行加密存储</li>
                            <li>限制数据访问权限，仅授权人员可访问必要数据</li>
                            <li>定期备份数据并进行安全审计</li>
                            <li>数据保留期限：活跃账号数据长期保留，非活跃账号数据可能会在最后登录时间距今超过1年以上时删除</li>
                        </ul>
                    </li>
                    <li><strong>数据共享：</strong>未经用户明确同意，我们不会将您的个人数据出售、出租或共享给第三方。但在以下情况下可能会共享数据：法律法规要求、政府部门要求、保护用户或公众安全、经您明确授权的第三方服务集成。</li>
                    <li>
                        <strong>营销通信：</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>我们可能会使用您的邮箱地址或手机号码发送服务相关的重要通知（如安全警报、服务更新）</li>
                            <li>对于营销性质的信息（如产品推广、功能介绍），我们将仅在您明确同意的情况下发送</li>
                            <li>您可以随时通过邮件中的退订链接或联系我们取消营销邮件订阅</li>
                            <li>即使退订营销邮件，您仍会收到重要的服务和安全相关通知</li>
                        </ul>
                    </li>
                    <li>
                        <strong>用户权利：</strong>您享有以下数据权利：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li><strong>访问权：</strong>查询我们持有的您的个人数据</li>
                            <li><strong>更正权：</strong>要求更正不准确或不完整的个人数据</li>
                            <li><strong>删除权：</strong>要求删除您的个人数据（在符合法律要求的情况下）</li>
                            <li><strong>限制处理权：</strong>要求限制我们对您个人数据的处理</li>
                            <li><strong>数据可携权：</strong>要求以结构化、常用的机器可读格式获取您的数据</li>
                            <li><strong>反对权：</strong>反对我们基于合法利益处理您的个人数据</li>
                            <li>
                                如需行使上述权利，请通过   <NuxtLink
                                    :to="contactEmailLink"
                                    external
                                    class="external-link"
                                >
                                    {{ contactEmail }}
                                </NuxtLink> 联系我们的客服团队
                            </li>
                        </ul>
                    </li>
                    <li><strong>Cookie 使用</strong>：我们使用 Cookie 来维持登录状态和提供个性化服务。您可以通过浏览器设置管理 Cookie，但这可能影响部分功能的正常使用。</li>
                    <li>
                        错误监控：我们使用 <NuxtLink
                            to="https://sentry.io"
                            external
                            class="external-link"
                            target="_blank"
                        >
                            Sentry
                        </NuxtLink> 服务监控系统错误和性能问题，以提高服务稳定性。该服务仅收集技术错误信息，不包含个人敏感数据。
                    </li>
                    <li>
                        <strong>行为分析</strong>：我们使用 <NuxtLink
                            to="https://clarity.microsoft.com"
                            external
                            class="external-link"
                            target="_blank"
                        >
                            Microsoft Clarity
                        </NuxtLink>分析用户在关键页面的操作行为，以优化用户体验。该工具会自动对用户标识符进行哈希加密处理，确保隐私安全。我们仅在登录、注册、安全设置等关键功能页面收集必要的操作数据，不会记录用户输入的密码、邮箱等敏感信息。
                    </li>
                    <li>
                        <strong>访问统计</strong>：我们使用 <NuxtLink
                            to="https://tongji.baidu.com"
                            external
                            class="external-link"
                            target="_blank"
                        >
                            百度统计
                        </NuxtLink>服务收集网站访问数据，包括页面访问量、用户来源、访问时长等信息，用于分析网站使用情况和改进服务质量。该服务会收集匿名的访问统计信息，不会获取用户的个人身份信息。您可以通过浏览器设置或安装相关插件来阻止统计代码的执行。
                    </li>
                    <li>
                        <strong>网站分析</strong>：我们使用 <NuxtLink
                            to="https://analytics.google.com"
                            external
                            class="external-link"
                            target="_blank"
                        >
                            Google Analytics
                        </NuxtLink> 服务分析网站流量和用户行为，以了解用户如何使用我们的服务并改进用户体验。Google Analytics 会收集匿名的使用数据，包括页面访问、用户互动、设备信息和大致地理位置等。这些数据经过匿名化处理，不会直接识别个人身份。Google 会根据其隐私政策处理这些数据。您可以通过安装 Google Analytics 退出插件或调整浏览器设置来选择不被追踪。
                    </li>
                    <li>
                        <strong>第三方登录服务</strong>：我们可能会集成以下第三方登录服务；如果集成了对应的登录服务，则这些服务将按照其各自的隐私政策处理您的数据：
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>
                                <NuxtLink
                                    to="https://github.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    GitHub 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://google.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Google 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://microsoft.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Microsoft 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://www.apple.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Apple 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://x.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Twitter 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://discord.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Discord 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://weixin.qq.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    微信登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://im.qq.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    QQ 登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://douyin.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    抖音登录
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink
                                    to="https://weibo.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    微博登录
                                </NuxtLink>
                            </li>
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

.external-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
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
</style>
