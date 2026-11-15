<template>
    <div class="auth-container">
        <div class="auth-main">
            <h1 class="auth-title">
                {{ t('static.terms.title') }}
            </h1>
            <div class="auth-section">
                <ol>
                    <li>
                        <strong>{{ t('static.terms.conduct.label') }}</strong>{{ t('static.colon') }}{{ t('static.terms.conduct.intro') }}
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.terms.conduct.item1') }}</li>
                            <li>{{ t('static.terms.conduct.item2') }}</li>
                            <li>{{ t('static.terms.conduct.item3') }}</li>
                            <li>{{ t('static.terms.conduct.item4') }}</li>
                            <li>{{ t('static.terms.conduct.item5') }}</li>
                        </ul>
                    </li>
                    <li><strong>{{ t('static.terms.ipLabel') }}</strong>{{ t('static.colon') }}{{ t('static.terms.ipText') }}</li>
                    <li>
                        <strong>{{ t('static.terms.privacy.label') }}</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.terms.privacy.item1') }}</li>
                            <li>{{ t('static.terms.privacy.item2') }}</li>
                            <li>{{ t('static.terms.privacy.item3') }}</li>
                            <li>{{ t('static.terms.privacy.item4') }}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{{ t('static.terms.marketing.label') }}</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.terms.marketing.item1') }}</li>
                            <li>{{ t('static.terms.marketing.item2') }}</li>
                            <li>{{ t('static.terms.marketing.item3') }}</li>
                        </ul>
                    </li>
                    <li><strong>{{ t('static.terms.monitoringLabel') }}</strong>{{ t('static.colon') }}{{ t('static.terms.monitoringText') }}</li>
                    <li><strong>{{ t('static.terms.changesLabel') }}</strong>{{ t('static.colon') }}{{ t('static.terms.changesText') }}</li>
                    <li>
                        <strong>{{ t('static.terms.disclaimer.label') }}</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.terms.disclaimer.item1') }}</li>
                            <li>{{ t('static.terms.disclaimer.item2') }}</li>
                            <li>{{ t('static.terms.disclaimer.item3') }}</li>
                            <li>{{ t('static.terms.disclaimer.item4') }}</li>
                        </ul>
                    </li>
                    <li>
                        <strong>{{ t('static.terms.dispute.label') }}</strong>
                        <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                            <li>{{ t('static.terms.dispute.item1') }}</li>
                            <li>{{ t('static.terms.dispute.item2') }}</li>
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
usePageMeta('static.terms.title')

const {
    contactEmail,
    contactEmailLink,
} = useStaticPageFlow()
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
