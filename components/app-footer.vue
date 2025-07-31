<template>
    <footer class="app-footer">
        <div class="app-footer__inner">
            <div class="app-footer__left">
                <i
                    class="mdi mdi-shield-account mr-2 text-primary text-xl"
                />
                <span class="font-medium text-gray-700 text-sm">草梅 Auth © 2025</span>
            </div>
            <div class="app-footer__links">
                <NuxtLink
                    to="https://github.com/CaoMeiYouRen/caomei-auth"
                    target="_blank"
                    external
                    class="app-footer__link"
                    aria-label="GitHub"
                >
                    <i class="mdi mdi-github text-xl" />
                </NuxtLink>
                <NuxtLink
                    :to="homeUrl"
                    target="_blank"
                    external
                    class="app-footer__link"
                    aria-label="主页"
                >
                    <i class="mdi mdi-web text-xl" />
                </NuxtLink>
            </div>
        </div>
        <div class="app-footer__bottom">
            <div class="text-gray-500 text-sm">
                统一登录平台 | 安全、便捷、可扩展
            </div>

            <div class="app-footer__bottom-links">
                <NuxtLink
                    to="/"
                    class="app-footer__bottom-link"
                >
                    首页
                </NuxtLink>
                <NuxtLink
                    v-if="session?.user"
                    to="/profile"
                    class="app-footer__bottom-link"
                >
                    个人中心
                </NuxtLink>
                <NuxtLink
                    v-if="session?.user?.role?.includes('admin')"
                    to="/admin/users"
                    class="app-footer__bottom-link"
                >
                    管理后台
                </NuxtLink>
                <NuxtLink
                    to="/forgot-password"
                    class="app-footer__bottom-link"
                >
                    忘记密码
                </NuxtLink>
                <NuxtLink
                    to="/privacy"
                    class="app-footer__bottom-link"
                >
                    隐私政策
                </NuxtLink>
                <NuxtLink
                    to="/terms"
                    class="app-footer__bottom-link"
                >
                    服务条款
                </NuxtLink>
                <NuxtLink
                    to="/about"
                    class="app-footer__bottom-link"
                >
                    关于我们
                </NuxtLink>

                <NuxtLink
                    :to="contactEmail"
                    external
                    class="app-footer__bottom-link"
                >
                    联系我们
                </NuxtLink>
                <NuxtLink
                    to="https://auth-docs.cmyr.dev/"
                    external
                    class="app-footer__bottom-link"
                >
                    项目文档
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
const { data: session } = await authClient.useSession(useFetch)

const config = useRuntimeConfig().public

const homeUrl = config.authBaseUrl || window?.location?.origin
const contactEmail = `mailto:${config.contactEmail}`

// 读取环境变量
const icpBeianNumber = config.icpBeianNumber
const publicSecurityBeianNumber = config.publicSecurityBeianNumber
</script>

<style scoped lang="scss">
@import "@/styles/theme";

.app-footer {
    background: $background-light;
    border-top: 1px solid $secondary-bg;
    padding: 1.2rem 0 0.5rem 0;
    font-size: 0.98rem;

    @media (max-width: 767px) {
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
        margin: 0.7rem auto 0 auto;
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
</style>
