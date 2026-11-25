<template>
    <footer class="app-footer">
        <div class="app-footer__inner">
            <div class="app-footer__left">
                <i
                    class="mdi mdi-shield-account mr-2 text-primary text-xl"
                />
                <span class="font-medium text-gray-700 text-sm">{{ t('footer.copyright') }}</span>
            </div>
            <div class="app-footer__links">
                <NuxtLink
                    to="https://github.com/CaoMeiYouRen/caomei-auth"
                    target="_blank"
                    external
                    class="app-footer__link"
                    :aria-label="t('footer.ariaGithub')"
                >
                    <i class="mdi mdi-github text-xl" />
                </NuxtLink>
                <NuxtLink
                    :to="homeUrl"
                    target="_blank"
                    external
                    class="app-footer__link"
                    :aria-label="t('footer.ariaHome')"
                >
                    <i class="mdi mdi-web text-xl" />
                </NuxtLink>
            </div>
        </div>
        <div class="app-footer__bottom">
            <div class="text-gray-500 text-sm">
                {{ t('footer.tagline') }}
            </div>

            <div class="app-footer__bottom-links">
                <NuxtLink
                    :to="localePath('/')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.home') }}
                </NuxtLink>
                <NuxtLink
                    v-if="session?.user"
                    :to="localePath('/profile')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.profile') }}
                </NuxtLink>
                <NuxtLink
                    v-if="session?.user?.role?.includes('admin')"
                    :to="localePath('/admin/users')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.admin') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/forgot-password')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.forgotPassword') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/privacy')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.privacy') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/terms')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.terms') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/about')"
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.about') }}
                </NuxtLink>

                <NuxtLink
                    :to="contactEmail"
                    external
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.contact') }}
                </NuxtLink>
                <NuxtLink
                    to="https://auth-docs.cmyr.dev/"
                    external
                    class="app-footer__bottom-link"
                >
                    {{ t('footer.docs') }}
                </NuxtLink>

                <!-- ICP 备案号 -->
                <div v-if="icpBeianNumber">
                    <NuxtLink
                        to="https://beian.miit.gov.cn/"
                        target="_blank"
                        external
                        class="app-footer__bottom-link"
                    >
                        {{ icpBeianNumber }}
                    </NuxtLink>
                </div>
                <!-- 公安备案号 -->
                <div v-if="publicSecurityBeianNumber">
                    <NuxtLink
                        to="https://beian.mps.gov.cn/"
                        target="_blank"
                        external
                        class="app-footer__bottom-link"
                    >
                        {{ publicSecurityBeianNumber }}
                    </NuxtLink>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

/* 必须在顶层 await 之前调用，保证 setup 上下文可用 */
const { t } = useI18n()
const localePath = useLocalePath()

const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
    ...options,
    headers: {
        ...options?.headers,
        ...useRequestHeaders(['cookie']),
    },
}))

const config = useRuntimeConfig().public

const homeUrl = config.authBaseUrl || window?.location?.origin
const contactEmail = `mailto:${config.contactEmail}`

// 读取环境变量
// 用 computed 是因为 vue-tsc 3.3.14 会把模板闭包中的普通 string 变量误补 .value（TS2551）；
// 上游修复（vuejs/language-tools #6267/#6305/#6322）后可还原为普通常量
const icpBeianNumber = computed(() => config.icpBeianNumber)
const publicSecurityBeianNumber = computed(() => config.publicSecurityBeianNumber)
</script>

<style scoped lang="scss">

.app-footer {
    background: $background-light;
    border-top: 1px solid $secondary-bg;
    padding: 1.2rem 0 0.5rem;
    font-size: 0.98rem;

    @media (width <= 767px) {
        display: none;
    }

    .app-footer__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .app-footer__left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: $secondary;

        i {
            color: $primary;
        }
    }

    .app-footer__links {
        display: flex;
        align-items: center;
        gap: 1.2rem;

        .app-footer__link {
            color: $secondary-light;
            transition: color 0.2s;

            &:hover {
                color: $primary;
            }

            i {
                font-size: 1.4rem;
            }
        }
    }

    .app-footer__bottom {
        max-width: 1200px;
        margin: 0.7rem auto 0;
        padding: 0 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .text-gray-500 {
            color: $secondary;
        }

        .app-footer__bottom-links {
            display: flex;
            gap: 1.2rem;
            margin-top: 0.2rem;

            .app-footer__bottom-link {
                color: $secondary-light;
                text-decoration: none;

                &:hover {
                    color: $primary;
                    text-decoration: underline;
                }
            }
        }
    }
}

// 应用暗色模式支持
@include footer-dark-theme;
</style>
