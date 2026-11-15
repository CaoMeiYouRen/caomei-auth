<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                {{ t('static.about.title') }}
            </h1>
            <p class="auth-subtitle">
                {{ t('static.about.intro') }}
            </p>
            <div class="auth-section">
                <h2>{{ t('static.about.featuresTitle') }}</h2>
                <ul>
                    <li>{{ t('static.about.features.oauth') }}</li>
                    <li>{{ t('static.about.features.methods') }}</li>
                    <li>{{ t('static.about.features.permissions') }}</li>
                    <li>{{ t('static.about.features.mail') }}</li>
                    <li>{{ t('static.about.features.responsive') }}</li>
                    <li>{{ t('static.about.features.mfa') }}</li>
                    <li>{{ t('static.about.features.deploy') }}</li>
                </ul>
            </div>
            <div class="auth-section">
                <h2>{{ t('static.about.stackTitle') }}</h2>
                <ul>
                    <li>{{ t('static.about.stack.framework') }}</li>
                    <li>{{ t('static.about.stack.auth') }}</li>
                    <li>{{ t('static.about.stack.notification') }}</li>
                    <li>{{ t('static.about.stack.style') }}</li>
                    <li>{{ t('static.about.stack.database') }}</li>
                    <li>{{ t('static.about.stack.packageManager') }}</li>
                </ul>
            </div>
            <div class="auth-section">
                <h2>{{ t('static.about.themeTitle') }}</h2>
                <p>
                    {{ t('static.about.themeText') }}
                </p>
            </div>
            <div class="auth-section">
                <h2>{{ t('static.about.licenseTitle') }}</h2>
                <p>
                    <i18n-t keypath="static.about.license" tag="span">
                        <template #license>
                            <a
                                href="https://github.com/CaoMeiYouRen/caomei-auth/blob/master/LICENSE"
                                target="_blank"
                                rel="noopener"
                            >{{ t('static.about.licenseName') }}</a>
                        </template>
                    </i18n-t>
                </p>
            </div>
            <div class="auth-author auth-section">
                <span>{{ t('static.about.authorLabel') }}</span>
                <a href="https://github.com/CaoMeiYouRen" target="_blank">CaoMeiYouRen</a>
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
import { usePageMeta } from '@/composables/utils/use-page-meta'

const { t } = useI18n()
usePageMeta('static.about.title', 'static.about.intro')
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

.auth-subtitle {
    margin-bottom: 2rem;
    color: $secondary-light;
    font-size: 1.15rem;
    text-align: center;
}

.auth-section {
    margin-bottom: 2rem;

    h2 {
        margin-bottom: 0.7rem;
        color: $primary-dark;
        font-weight: 600;
        font-size: 1.18rem;
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
        margin-left: 0.3rem;
        color: $primary;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.auth-author {
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
