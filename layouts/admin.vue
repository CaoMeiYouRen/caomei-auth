# coding=utf-8
<template>
    <div class="admin-layout">
        <div class="admin-sidebar">
            <div class="sidebar-header">
                <img
                    src="/logo.png"
                    alt="Logo"
                    class="logo"
                >
                <h2 class="app-name">
                    草梅 Auth
                </h2>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <h3 class="nav-title">
                        管理后台
                    </h3>
                    <NuxtLink
                        to="/admin/users"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-account-multiple" />
                        <span>用户管理</span>
                    </NuxtLink>
                    <NuxtLink
                        to="/admin/oauth/clients"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-application" />
                        <span>应用管理</span>
                    </NuxtLink>
                    <a href="#" class="disabled nav-item">
                        <i class="mdi mdi-shield-account" />
                        <span>权限管理</span>
                        <small>即将上线</small>
                    </a>
                    <a href="#" class="disabled nav-item">
                        <i class="mdi mdi-chart-line" />
                        <span>登录统计</span>
                        <small>即将上线</small>
                    </a>
                    <a href="#" class="disabled nav-item">
                        <i class="mdi mdi-cog" />
                        <span>系统设置</span>
                        <small>即将上线</small>
                    </a>
                </div>

                <div class="nav-section">
                    <h3 class="nav-title">
                        快速访问
                    </h3>
                    <NuxtLink
                        to="/profile"
                        class="nav-item"
                    >
                        <i class="mdi mdi-account-circle" />
                        <span>个人中心</span>
                    </NuxtLink>
                    <NuxtLink
                        to="/oauth/clients"
                        class="nav-item"
                    >
                        <i class="mdi mdi-key-variant" />
                        <span>我的应用</span>
                    </NuxtLink>
                    <NuxtLink
                        to="/"
                        class="nav-item"
                    >
                        <i class="mdi mdi-home" />
                        <span>返回首页</span>
                    </NuxtLink>
                </div>
            </nav>
        </div>

        <div class="admin-main">
            <slot />
            <AppFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
    layout: false,
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';
.admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
}

.admin-sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
        width: 100%;
        position: relative;
        height: auto;
    }
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1rem;

    .logo {
        width: 40px;
        height: 40px;
        border-radius: 8px;
    }

    .app-name {
        margin: 0;
        color: $primary;
        font-size: 1.2rem;
        font-weight: 700;
    }
}

.sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
}

.nav-section {
    margin-bottom: 2rem;

    &:last-child {
        margin-bottom: 0;
    }
}

.nav-title {
    padding: 0 1.5rem;
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: $secondary-light;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    margin: 0 0.5rem;
    border-radius: 8px;
    color: $secondary;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
        background: $primary-50;
        color: $primary;
    }

    &.active {
        background: $primary-100;
        color: $primary;
        font-weight: 600;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            background: $primary;
            border-radius: 0 2px 2px 0;
        }
    }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            background: transparent;
            color: $secondary;
        }

        small {
            color: $secondary-light;
            font-size: 0.75rem;
            margin-left: auto;
        }
    }

    i {
        font-size: 1.25rem;
        min-width: 1.25rem;
    }

    span {
        flex: 1;
    }
}

.admin-main {
    flex: 1;
    margin-left: 280px;
    min-height: 100vh;

    @media (max-width: 768px) {
        margin-left: 0;
    }
}

// 响应式调整
@media (max-width: 768px) {
    .admin-layout {
        flex-direction: column;
    }

    .admin-sidebar {
        position: static;
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
    }

    .admin-main {
        margin-left: 0;
    }
}
</style>
