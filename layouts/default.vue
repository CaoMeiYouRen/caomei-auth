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
                    <a
                        href="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        class="layout-default__footer-link"
                        aria-label="GitHub"
                    >
                        <i class="mdi mdi-github text-xl" />
                    </a>
                    <a
                        href="https://auth.cmyr.dev/"
                        target="_blank"
                        class="layout-default__footer-link"
                        aria-label="主页"
                    >
                        <i class="mdi mdi-web text-xl" />
                    </a>
                </div>
            </div>
            <div class="layout-default__footer-bottom">
                <div class="text-gray-500 text-sm">
                    统一登录平台 | 安全、便捷、可扩展
                </div>
                <div class="layout-default__footer-bottom-links">
                    <NuxtLink
                        to="/about"
                        class="layout-default__footer-bottom-link"
                    >
                        关于我们
                    </NuxtLink>
                    <a
                        href="mailto:support@cmyr.dev"
                        class="layout-default__footer-bottom-link"
                    >联系我们</a>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
// 默认布局无需特殊逻辑
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
            color: $secondary-light;
        }
        .layout-default__footer-bottom-links {
            display: flex;
            gap: 1.2rem;
            margin-top: 0.2rem;
            .layout-default__footer-bottom-link {
                color: $primary;
                text-decoration: none;
                font-weight: 500;
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>
