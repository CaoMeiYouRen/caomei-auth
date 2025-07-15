<template>
    <div class="layout-default">
        <main class="layout-default__main">
            <NuxtPage />
        </main>
        <!-- 页脚 -->
        <footer class="layout-default__footer">
            <div class="layout-default__footer-inner">
                <div class="layout-default__footer-left">
                    <i
                        class="mdi mdi-shield-account mr-2 text-primary text-xl"
                    />
                    <span class="font-medium text-gray-700 text-sm">草梅 Auth © 2025</span>
                </div>
                <div class="layout-default__footer-links">
                    <NuxtLink
                        to="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        external
                        class="layout-default__footer-link"
                        aria-label="GitHub"
                    >
                        <i class="mdi mdi-github text-xl" />
                    </NuxtLink>
                    <NuxtLink
                        :to="homeUrl"
                        target="_blank"
                        external
                        class="layout-default__footer-link"
                        aria-label="主页"
                    >
                        <i class="mdi mdi-web text-xl" />
                    </NuxtLink>
                </div>
            </div>
            <div class="layout-default__footer-bottom">
                <div class="text-gray-500 text-sm">
                    统一登录平台 | 安全、便捷、可扩展
                </div>

                <div class="layout-default__footer-bottom-links">
                    <!-- ICP 备案号 -->
                    <div v-if="icpBeianNumber" class="text-sm">
                        <NuxtLink
                            to="https://beian.miit.gov.cn/"
                            target="_blank"
                            external
                            class="layout-default__footer-bottom-link"
                        >
                            {{ icpBeianNumber }}
                        </NuxtLink>
                    </div>
                    <!-- 公安备案号 -->
                    <div v-if="publicSecurityBeianNumber" class="text-gray-500 text-sm">
                        <NuxtLink
                            to="https://beian.mps.gov.cn/"
                            target="_blank"
                            external
                            class="layout-default__footer-bottom-link"
                        >
                            {{ publicSecurityBeianNumber }}
                        </NuxtLink>
                    </div>
                    <NuxtLink
                        to="/about"
                        class="layout-default__footer-bottom-link"
                    >
                        关于我们
                    </NuxtLink>
                    <NuxtLink
                        :to="contactEmail"
                        external
                        class="layout-default__footer-bottom-link"
                    >
                        联系我们
                    </NuxtLink>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
// 默认布局无需特殊逻辑
const config = useRuntimeConfig().public

const homeUrl = config.authBaseUrl || window?.location?.origin
const contactEmail = `mailto:${config.contactEmail}`

// 读取环境变量
const icpBeianNumber = config.icpBeianNumber
const publicSecurityBeianNumber = config.publicSecurityBeianNumber
</script>

<style scoped lang="scss">
@import "@/styles/theme";
.layout-default {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
.layout-default__main {
    flex: 1 1 auto;
}
.layout-default__footer {
    background: $background-light;
    border-top: 1px solid $secondary-bg;
    padding: 1.2rem 0 0.5rem 0;
    font-size: 0.98rem;
    @media (max-width: 767px) {
        display: none;
    }
    .layout-default__footer-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .layout-default__footer-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: $secondary;
        i {
            color: $primary;
        }
    }
    .layout-default__footer-links {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        .layout-default__footer-link {
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
    .layout-default__footer-bottom {
        max-width: 1200px;
        margin: 0.7rem auto 0 auto;
        padding: 0 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        .text-gray-500 {
            color: $secondary;
        }
        .layout-default__footer-bottom-links {
            display: flex;
            gap: 1.2rem;
            margin-top: 0.2rem;
            .layout-default__footer-bottom-link {
                color: $secondary-light;
                text-decoration: none;
                // font-weight: 500;
                &:hover {
                     color: $primary;
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>
