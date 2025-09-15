# coding=utf-8
<template>
    <div class="admin-layout">
        <div
            class="admin-sidebar"
            :class="{'collapsed': isCollapsed}"
        >
            <div class="sidebar-header">
                <img
                    src="/logo.png"
                    alt="Logo"
                    class="logo"
                >
                <h2
                    v-show="!isCollapsed"
                    class="app-name"
                >
                    草梅 Auth
                </h2>
                <button
                    class="collapse-btn"
                    :title="isCollapsed ? '展开侧边栏' : '收缩侧边栏'"
                    @click="toggleSidebar"
                >
                    <i
                        class="mdi"
                        :class="isCollapsed ? 'mdi-menu' : 'mdi-menu-open'"
                    />
                </button>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <h3
                        v-show="!isCollapsed"
                        class="nav-title"
                    >
                        管理后台
                    </h3>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '用户管理' : ''"
                        to="/admin/users"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-account-multiple" />
                        <span v-show="!isCollapsed">用户管理</span>
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '应用管理' : ''"
                        to="/admin/oauth/applications"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-application" />
                        <span v-show="!isCollapsed">应用管理</span>
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? 'SSO 管理' : ''"
                        to="/admin/sso/providers"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-account-network" />
                        <span v-show="!isCollapsed">SSO 管理</span>
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '登录统计' : ''"
                        to="/admin/logs"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-chart-line" />
                        <span v-show="!isCollapsed">登录统计</span>
                    </NuxtLink>
                </div>

                <div class="nav-section">
                    <h3
                        v-show="!isCollapsed"
                        class="nav-title"
                    >
                        快速访问
                    </h3>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '个人中心' : ''"
                        to="/profile"
                        class="nav-item"
                    >
                        <i class="mdi mdi-account-circle" />
                        <span v-show="!isCollapsed">个人中心</span>
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '我的应用' : ''"
                        to="/oauth/clients"
                        class="nav-item"
                    >
                        <i class="mdi mdi-key-variant" />
                        <span v-show="!isCollapsed">我的应用</span>
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '项目文档' : ''"
                        to="https://auth-docs.cmyr.dev/"
                        external
                        target="_blank"
                        class="nav-item"
                    >
                        <i class="mdi mdi-book-open-variant" />
                        <span v-show="!isCollapsed">项目文档</span>
                        <i v-show="!isCollapsed" class="external-icon mdi mdi-open-in-new" />
                    </NuxtLink>
                    <NuxtLink
                        v-tooltip.right="isCollapsed ? '返回首页' : ''"
                        to="/"
                        class="nav-item"
                    >
                        <i class="mdi mdi-home" />
                        <span v-show="!isCollapsed">返回首页</span>
                    </NuxtLink>
                </div>
            </nav>
        </div>

        <div
            class="admin-main"
            :class="{'collapsed': isCollapsed}"
        >
            <!-- Demo模式横幅 -->
            <DemoModeBanner />

            <slot />
            <AppFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
// 侧边栏收缩状态管理
const isCollapsed = ref(false)

// Demo模式横幅管理
const { showBanner, closeBanner } = useDemoBanner()

// 切换侧边栏状态
const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
}

</script>

<style lang="scss" scoped>

.admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
}

.admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    width: 280px;
    height: 100vh;
    background: white;
    border-right: 1px solid #e2e8f0;
    box-shadow: 2px 0 8px rgb(0 0 0 / 0.1);
    transition: width 0.3s ease;

    &.collapsed {
        width: 80px;

        .sidebar-header {
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;

            .logo {
                width: 32px;
                height: 32px;
            }

            .collapse-btn {
                margin-left: 0;
                padding: 6px;
            }
        }

        .nav-item {
            justify-content: center;
            margin: 0 0.25rem;
            padding: 0.75rem 1rem;

            i {
                margin: 0;
            }
        }
    }

    @media (width <= 768px) {
        position: relative;
        width: 100%;
        height: auto;

        &.collapsed {
            width: 100%;
        }
    }
}

.sidebar-header {
    position: relative;
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    transition: all 0.3s ease;

    .logo {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .app-name {
        margin: 0;
        overflow: hidden;
        color: $primary;
        font-weight: 700;
        font-size: 1.2rem;
        white-space: nowrap;
        transition: opacity 0.3s ease;
    }

    .collapse-btn {
        flex-shrink: 0;
        margin-left: auto;
        padding: 8px;
        color: $secondary;
        background: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            color: $primary;
            background: $primary-50;
        }

        i {
            font-size: 1.2rem;
        }
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
    margin: 0 0 0.75rem;
    padding: 0 1.5rem;
    color: $secondary-light;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.nav-item {
    position: relative;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin: 0 0.5rem;
    padding: 0.75rem 1.5rem;
    color: $secondary;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
        color: $primary;
        background: $primary-50;
    }

    &.active {
        color: $primary;
        font-weight: 600;
        background: $primary-100;

        &::before {
            position: absolute;
            top: 50%;
            left: 0;
            width: 3px;
            height: 20px;
            background: $primary;
            border-radius: 0 2px 2px 0;
            transform: translateY(-50%);
            content: "";
        }
    }

    &.disabled {
        cursor: not-allowed;
        opacity: 0.5;

        &:hover {
            color: $secondary;
            background: transparent;
        }

        small {
            margin-left: auto;
            color: $secondary-light;
            font-size: 0.75rem;
        }
    }

    i {
        flex-shrink: 0;
        min-width: 1.25rem;
        font-size: 1.25rem;
    }

    span {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        transition: opacity 0.3s ease;
    }

    small {
        overflow: hidden;
        white-space: nowrap;
        transition: opacity 0.3s ease;
    }

    .external-icon {
        margin-left: auto;
        font-size: 0.875rem;
        opacity: 0.7;
    }
}

.admin-main {
    flex: 1;
    min-height: 100vh;
    margin-left: 280px;
    transition: margin-left 0.3s ease;

    &.collapsed {
        margin-left: 80px;
    }

    @media (width <= 768px) {
        margin-left: 0;

        &.collapsed {
            margin-left: 0;
        }
    }
}

// 响应式调整
@media (width <= 768px) {
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

// 应用后台布局暗色模式支持
@include admin-layout-dark-theme;
</style>
