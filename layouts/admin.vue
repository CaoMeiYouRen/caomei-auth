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
                        to="/admin/oauth/clients"
                        class="nav-item"
                        active-class="active"
                    >
                        <i class="mdi mdi-application" />
                        <span v-show="!isCollapsed">应用管理</span>
                    </NuxtLink>
                    <a
                        v-tooltip.right="isCollapsed ? '权限管理' : ''"
                        href="#"
                        class="disabled nav-item"
                    >
                        <i class="mdi mdi-shield-account" />
                        <span v-show="!isCollapsed">权限管理</span>
                        <small v-show="!isCollapsed">即将上线</small>
                    </a>
                    <a
                        v-tooltip.right="isCollapsed ? '登录统计' : ''"
                        href="#"
                        class="disabled nav-item"
                    >
                        <i class="mdi mdi-chart-line" />
                        <span v-show="!isCollapsed">登录统计</span>
                        <small v-show="!isCollapsed">即将上线</small>
                    </a>
                    <a
                        v-tooltip.right="isCollapsed ? '系统设置' : ''"
                        href="#"
                        class="disabled nav-item"
                    >
                        <i class="mdi mdi-cog" />
                        <span v-show="!isCollapsed">系统设置</span>
                        <small v-show="!isCollapsed">即将上线</small>
                    </a>
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
            <slot />
            <AppFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
// 侧边栏收缩状态管理
const isCollapsed = ref(false)

// 切换侧边栏状态
const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
}

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
    transition: width 0.3s ease;

    &.collapsed {
        width: 80px;

        .sidebar-header {
            padding: 1rem;
            flex-direction: column;
            gap: 0.5rem;

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
            padding: 0.75rem 1rem;
            margin: 0 0.25rem;
            justify-content: center;

            i {
                margin: 0;
            }
        }
    }

    @media (max-width: 768px) {
        width: 100%;
        position: relative;
        height: auto;

        &.collapsed {
            width: 100%;
        }
    }
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    transition: all 0.3s ease;

    .logo {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    .app-name {
        margin: 0;
        color: $primary;
        font-size: 1.2rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        transition: opacity 0.3s ease;
    }

    .collapse-btn {
        background: none;
        border: none;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        color: $secondary;
        transition: all 0.2s ease;
        margin-left: auto;
        flex-shrink: 0;

        &:hover {
            background: $primary-50;
            color: $primary;
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
        flex-shrink: 0;
    }

    span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        transition: opacity 0.3s ease;
    }

    small {
        white-space: nowrap;
        overflow: hidden;
        transition: opacity 0.3s ease;
    }
}

.admin-main {
    flex: 1;
    margin-left: 280px;
    min-height: 100vh;
    transition: margin-left 0.3s ease;

    &.collapsed {
        margin-left: 80px;
    }

    @media (max-width: 768px) {
        margin-left: 0;

        &.collapsed {
            margin-left: 0;
        }
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
