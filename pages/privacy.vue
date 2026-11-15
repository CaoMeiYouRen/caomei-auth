<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                {{ t('static.privacy.title') }}
            </h1>
            <div class="auth-section">
                <ol>
                    <li>
                        <strong>{{ t('static.privacy.collect.label') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.intro') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li><strong>{{ t('static.privacy.collect.emailLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.emailText') }}</li>
                            <li><strong>{{ t('static.privacy.collect.phoneLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.phoneText') }}</li>
                            <li><strong>{{ t('static.privacy.collect.usernameLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.usernameText') }}</li>
                            <li><strong>{{ t('static.privacy.collect.credentialLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.credentialText') }}</li>
                            <li><strong>{{ t('static.privacy.collect.deviceLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.collect.deviceText') }}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.use.label') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.use.intro') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.privacy.use.item1') }}</li>
                            <li>{{ t('static.privacy.use.item2') }}</li>
                            <li>{{ t('static.privacy.use.item3') }}</li>
                            <li>{{ t('static.privacy.use.item4') }}</li>
                            <li>{{ t('static.privacy.use.item5') }}</li>
                            <li>{{ t('static.privacy.use.item6') }}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.storage.label') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.storage.intro') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.privacy.storage.item1') }}</li>
                            <li>{{ t('static.privacy.storage.item2') }}</li>
                            <li>{{ t('static.privacy.storage.item3') }}</li>
                            <li>{{ t('static.privacy.storage.item4') }}</li>
                        </ul>
                    </li>
                    <li><strong>{{ t('static.privacy.shareLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.shareText') }}</li>
                    <li>
                        <strong>{{ t('static.privacy.marketing.label') }}</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.privacy.marketing.item1') }}</li>
                            <li>{{ t('static.privacy.marketing.item2') }}</li>
                            <li>{{ t('static.privacy.marketing.item3') }}</li>
                            <li>{{ t('static.privacy.marketing.item4') }}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.rights.label') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.rights.intro') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li><strong>{{ t('static.privacy.rights.accessLabel') }}</strong>{{ t('static.privacy.rights.accessText') }}</li>
                            <li><strong>{{ t('static.privacy.rights.rectifyLabel') }}</strong>{{ t('static.privacy.rights.rectifyText') }}</li>
                            <li><strong>{{ t('static.privacy.rights.eraseLabel') }}</strong>{{ t('static.privacy.rights.eraseText') }}</li>
                            <li><strong>{{ t('static.privacy.rights.restrictLabel') }}</strong>{{ t('static.privacy.rights.restrictText') }}</li>
                            <li><strong>{{ t('static.privacy.rights.portabilityLabel') }}</strong>{{ t('static.privacy.rights.portabilityText') }}</li>
                            <li><strong>{{ t('static.privacy.rights.objectLabel') }}</strong>{{ t('static.privacy.rights.objectText') }}</li>
                            <li>
                                <i18n-t keypath="static.privacy.rights.contact">
                                    <template #email>
                                        <NuxtLink
                                            :to="contactEmailLink"
                                            external
                                            class="external-link"
                                        >
                                            {{ contactEmail }}
                                        </NuxtLink>
                                    </template>
                                </i18n-t>
                            </li>
                        </ul>
                    </li>
                    <li><strong>{{ t('static.privacy.cookieLabel') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.cookieText') }}</li>
                    <li>
                        <i18n-t keypath="static.privacy.sentry">
                            <template #sentry>
                                <NuxtLink
                                    to="https://sentry.io"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Sentry
                                </NuxtLink>
                            </template>
                        </i18n-t>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.clarity.label') }}</strong>{{ t('static.colon') }}<i18n-t keypath="static.privacy.clarity.text">
                            <template #clarity>
                                <NuxtLink
                                    to="https://clarity.microsoft.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Microsoft Clarity
                                </NuxtLink>
                            </template>
                        </i18n-t>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.baidu.label') }}</strong>{{ t('static.colon') }}<i18n-t keypath="static.privacy.baidu.text">
                            <template #baidu>
                                <NuxtLink
                                    to="https://tongji.baidu.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    {{ t('static.privacy.baidu.name') }}
                                </NuxtLink>
                            </template>
                        </i18n-t>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.google.label') }}</strong>{{ t('static.colon') }}<i18n-t keypath="static.privacy.google.text">
                            <template #google>
                                <NuxtLink
                                    to="https://analytics.google.com"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    Google Analytics
                                </NuxtLink>
                            </template>
                        </i18n-t>
                    </li>
                    <li>
                        <strong>{{ t('static.privacy.thirdParty.label') }}</strong>{{ t('static.colon') }}{{ t('static.privacy.thirdParty.text') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li v-for="platform in thirdPartyPlatforms" :key="platform.labelKey">
                                <NuxtLink
                                    :to="platform.url"
                                    external
                                    class="external-link"
                                    target="_blank"
                                >
                                    {{ t(platform.labelKey) }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </li>
                </ol>
            </div>
            <div class="auth-contact auth-section">
                <span>{{ t('static.contactLabel') }}</span>
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
                    {{ t('static.backHome') }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStaticPageFlow } from '@/composables/use-static-page-flow'
import { usePageMeta } from '@/composables/utils/use-page-meta'

const { t } = useI18n()
usePageMeta('static.privacy.title')

const {
    contactEmail,
    contactEmailLink,
} = useStaticPageFlow()

const thirdPartyPlatforms = [
    { labelKey: 'static.privacy.thirdParty.github', url: 'https://github.com' },
    { labelKey: 'static.privacy.thirdParty.google', url: 'https://google.com' },
    { labelKey: 'static.privacy.thirdParty.microsoft', url: 'https://microsoft.com' },
    { labelKey: 'static.privacy.thirdParty.apple', url: 'https://www.apple.com' },
    { labelKey: 'static.privacy.thirdParty.twitter', url: 'https://x.com' },
    { labelKey: 'static.privacy.thirdParty.facebook', url: 'https://facebook.com' },
    { labelKey: 'static.privacy.thirdParty.discord', url: 'https://discord.com' },
    { labelKey: 'static.privacy.thirdParty.wechat', url: 'https://weixin.qq.com' },
    { labelKey: 'static.privacy.thirdParty.qq', url: 'https://im.qq.com' },
    { labelKey: 'static.privacy.thirdParty.douyin', url: 'https://douyin.com' },
    { labelKey: 'static.privacy.thirdParty.weibo', url: 'https://weibo.com' },
] as const
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

@include auth-page-dark-theme
</style>
