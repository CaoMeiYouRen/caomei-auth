<template>
    <div class="auth-container">
        <AuthLeft title="草梅 Auth 统一登录平台" subtitle="基于 Nuxt 3 的现代化统一登录平台，支持多种登录注册方式，安全、便捷、可扩展。">
            <template #content>
                <div class="auth-links">
                    <a
                        href="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        class="project-link"
                    >
                        <i class="mdi mdi-github" /> GitHub 项目地址
                    </a>
                </div>
            </template>
        </AuthLeft>
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    页面入口
                </h2>
                <div class="button-group">
                    <!-- 如果是管理员，显示管理后台按钮 -->
                    <Button
                        v-if="session?.user?.role?.includes('admin')"
                        label="管理后台"
                        icon="mdi mdi-cog"
                        class="btn btn-admin"
                        @click="toAdmin"
                    />
                    <!-- 如果session 存在，则显示跳转资料页-->
                    <Button
                        v-if="session?.user"
                        label="前往个人中心"
                        icon="mdi mdi-account"
                        class="btn btn-primary"
                        @click="toProfile"
                    />
                    <Button
                        label="前往登录页"
                        icon="mdi mdi-login"
                        class="btn btn-primary"
                        @click="toLogin"
                    />
                    <Button
                        label="前往注册页"
                        icon="mdi mdi-account-plus"
                        class="btn btn-primary"
                        @click="toRegister"
                    />
                    <Button
                        label="前往忘记密码页"
                        icon="mdi mdi-lock-reset"
                        class="btn btn-primary"
                        @click="toForgotPassword"
                    />
                </div>
                <div class="separator">
                    GitHub源码
                </div>
                <div class="auth-links-mobile">
                    <a
                        href="https://github.com/CaoMeiYouRen/caomei-auth"
                        target="_blank"
                        class="project-link"
                    >
                        <i class="mdi mdi-github" /> GitHub 项目地址
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Button from 'primevue/button'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'
import { syncAdminRole } from '@/utils/admin-role-client'

// 使用 SSR 渲染，解决界面刷新时的 UI 重渲染问题
const { data: session } = await authClient.useSession(useFetch)

function toLogin() {
    navigateTo('/login')
}

function toRegister() {
    navigateTo('/register')
}

function toForgotPassword() {
    navigateTo('/forgot-password')
}

function toProfile() {
    navigateTo('/profile')
}

function toAdmin() {
    navigateTo('/admin/users')
}

/**
 * 获取当前用户的管理员状态
 */
async function getAdminStatus() {
    try {
        const response = await $fetch('/api/admin/status')
        return response.data
    } catch (error) {
        console.error('获取管理员状态失败:', error)
        return null
    }
}

/**
 * 智能同步管理员角色：只有在需要时才同步
 */
async function smartSyncAdminRole() {
    if (!session.value?.user?.id) {
        return false
    }

    try {
        // 先检查当前状态
        const adminStatus = await getAdminStatus()

        if (!adminStatus) {
            console.log('无法获取管理员状态，跳过同步')
            return false
        }

        console.log('管理员状态检查:', {
            isAdmin: adminStatus.isAdmin,
            isAdminByRole: adminStatus.isAdminByRole,
            isAdminByConfig: adminStatus.isAdminByConfig,
            syncRequired: adminStatus.adminStatus.syncRequired,
        })

        // 只有在需要同步时才执行同步操作
        if (adminStatus.adminStatus.syncRequired) {
            console.log('检测到角色不一致，执行同步操作')
            const result = await syncAdminRole(session.value.user.id)
            console.log('管理员角色同步结果:', result)
            return result.success
        }

        console.log('角色状态一致，无需同步')
        return adminStatus.isAdmin
    } catch (error) {
        console.error('智能同步管理员角色失败:', error)
        return false
    }
}

onMounted(async () => {
    // 如果用户已登录，智能同步管理员角色
    if (session.value?.user?.id) {
        const isAdmin = await smartSyncAdminRole()
        if (isAdmin) {
            console.log('用户是管理员')
        } else {
            console.log('用户不是管理员')
        }
    }
})

</script>

<style scoped lang="scss">
@import "@/styles/theme";
@import "@/styles/form";
@import "@/styles/common";

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100vh;
    background: $background;

    @media (min-width: 768px) {
        flex-direction: row;
    }
}

.auth-links {
    margin-top: 1.2rem;

    .project-link {
        color: $secondary-light;
        font-weight: 500;
        text-decoration: none;
        font-size: 1.1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s;
        border-bottom: 1px dashed rgba($background-light, 0.3);
        padding-bottom: 2px;

        &:hover {
            color: $primary-light;
            text-decoration: underline;
        }

        i {
            font-size: 1.3rem;
        }
    }

    @media (max-width: 767px) {
        display: none;
    }
}

.auth-links-mobile {
    display: none;

    @media (max-width: 767px) {
        display: flex;
        justify-content: center;
        margin-top: 1rem;

        .project-link {
            color: $secondary;
            background: none;
        }
    }
}

.auth-right {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
    min-height: 60vh;
    background: $background;

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    background-color: $background-light;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
    padding: 2.5rem 2rem 2rem 2rem;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.auth-title {
    color: $secondary;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 2rem;
    letter-spacing: 0.5px;
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    width: 100%;
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    border-radius: 8px;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
}

.btn-primary {
    background-color: $primary !important;
    color: $background-light !important;
    border: none !important;
    min-height: 44px;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.btn-admin {
    background-color: #ff6b35 !important;
    color: $background-light !important;
    border: none !important;
    min-height: 44px;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-admin:hover {
    background-color: #e55a2e !important;
}

.separator {
    color: $secondary-light;
    display: flex;
    align-items: center;
    margin: 2rem 0 1rem 0;
    width: 100%;
    font-size: 0.98rem;

    &::before,
    &::after {
        content: "";
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
    }

    &::before {
        margin-right: 1rem;
    }

    &::after {
        margin-left: 1rem;
    }

    @media (min-width: 768px) {
        display: none;
    }
}
</style>
