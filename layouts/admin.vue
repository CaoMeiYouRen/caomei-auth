# coding=utf-8
<template>
    <div class="admin-layout">
        <div
            class="admin-sidebar"
            :class="{'collapsed': isCollapsed, 'mobile-expanded': mobileExpanded}"
        >
            <div class="sidebar-header">
                <img
                    src="/logo.png"
                    alt="Logo"
                    class="logo"
                >
                <h2 class="app-name">
                    草梅 Auth
                </h2>
                <BaseTooltip :content="navCollapsed ? t('app.admin.nav.expand') : t('app.admin.nav.collapse')">
                    <button
                        class="collapse-btn"
                        :aria-label="navCollapsed ? t('app.admin.nav.expand') : t('app.admin.nav.collapse')"
                        :aria-expanded="!navCollapsed"
                        @click="toggleSidebar"
                    >
                        <i class="collapse-icon collapse-icon--collapsed mdi mdi-menu" />
                        <i class="collapse-icon collapse-icon--expanded mdi mdi-menu-open" />
                    </button>
                </BaseTooltip>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <h3 class="nav-title">
                        {{ t('app.admin.nav.title') }}
                    </h3>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.users') : ''">
                        <NuxtLink
                            to="/admin/users"
                            class="nav-item"
                            active-class="active"
                            :aria-label="t('app.admin.nav.users')"
                        >
                            <i class="mdi mdi-account-multiple" />
                            <span class="nav-label">{{ t('app.admin.nav.users') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.applications') : ''">
                        <NuxtLink
                            to="/admin/oauth/applications"
                            class="nav-item"
                            active-class="active"
                            :aria-label="t('app.admin.nav.applications')"
                        >
                            <i class="mdi mdi-application" />
                            <span class="nav-label">{{ t('app.admin.nav.applications') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.sso') : ''">
                        <NuxtLink
                            to="/admin/sso/providers"
                            class="nav-item"
                            active-class="active"
                            :aria-label="t('app.admin.nav.sso')"
                        >
                            <i class="mdi mdi-account-network" />
                            <span class="nav-label">{{ t('app.admin.nav.sso') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.registration') : ''">
                        <NuxtLink
                            to="/admin/registration"
                            class="nav-item"
                            active-class="active"
                            :aria-label="t('app.admin.nav.registration')"
                        >
                            <i class="mdi mdi-shield-lock" />
                            <span class="nav-label">{{ t('app.admin.nav.registration') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.logs') : ''">
                        <NuxtLink
                            to="/admin/logs"
                            class="nav-item"
                            active-class="active"
                            :aria-label="t('app.admin.nav.logs')"
                        >
                            <i class="mdi mdi-chart-line" />
                            <span class="nav-label">{{ t('app.admin.nav.logs') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                </div>

                <div class="nav-section">
                    <h3 class="nav-title">
                        {{ t('app.admin.nav.quickAccess') }}
                    </h3>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.profile') : ''">
                        <NuxtLink
                            to="/profile"
                            class="nav-item"
                            :aria-label="t('app.admin.nav.profile')"
                        >
                            <i class="mdi mdi-account-circle" />
                            <span class="nav-label">{{ t('app.admin.nav.profile') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.myApps') : ''">
                        <NuxtLink
                            to="/oauth/clients"
                            class="nav-item"
                            :aria-label="t('app.admin.nav.myApps')"
                        >
                            <i class="mdi mdi-key-variant" />
                            <span class="nav-label">{{ t('app.admin.nav.myApps') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.docs') : ''">
                        <NuxtLink
                            to="https://auth-docs.cmyr.dev/"
                            external
                            target="_blank"
                            class="nav-item"
                            :aria-label="t('app.admin.nav.docs')"
                        >
                            <i class="mdi mdi-book-open-variant" />
                            <span class="nav-label">{{ t('app.admin.nav.docs') }}</span>
                            <i class="external-icon mdi mdi-open-in-new" />
                        </NuxtLink>
                    </BaseTooltip>
                    <BaseTooltip side="right" :content="navCollapsed ? t('app.admin.nav.home') : ''">
                        <NuxtLink
                            to="/"
                            class="nav-item"
                            :aria-label="t('app.admin.nav.home')"
                        >
                            <i class="mdi mdi-home" />
                            <span class="nav-label">{{ t('app.admin.nav.home') }}</span>
                        </NuxtLink>
                    </BaseTooltip>
                </div>
            </nav>
            <div class="sidebar-footer">
                <BaseLanguageSwitcher :compact="navCollapsed" />
            </div>
        </div>

        <div
            class="admin-main"
            :class="{'collapsed': isCollapsed}"
        >
            <!-- Demo模式横幅 -->
            <DemoModeBanner />
            <!-- 反馈入口 -->
            <FeedbackButton />
            <!-- 主题切换按钮 -->
            <ThemeToggle />
            <slot />
            <AppFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useNoIndex } from '@/composables/utils/use-no-index'

const { t } = useI18n()
useNoIndex()

// 侧边栏收缩状态管理
/* 桌面：手动收起（`collapsed` 类）；移动端：CSS-first 默认收起，`mobile-expanded` 表示手动展开。
 * 显示状态不依赖 JS 初始化——SSR 首帧就按媒体查询渲染为收起态，hydration 不再跳变（阶段 16 D56）。 */
const isCollapsed = ref(false)
const mobileExpanded = ref(false)

/* 仅用于点击分流与 tooltip / aria 文案，不参与任何显示控制，因此不会造成首帧跳变 */
const isNarrow = ref(false)

const navCollapsed = computed(() => (isNarrow.value ? !mobileExpanded.value : isCollapsed.value))

onMounted(() => {
    const query = window.matchMedia('(width <= 768px)')
    isNarrow.value = query.matches
    query.addEventListener('change', (event) => {
        isNarrow.value = event.matches
    })
})

// Demo模式横幅管理
const { showBanner, closeBanner } = useDemoBanner()

// 切换侧边栏状态
const toggleSidebar = () => {
    if (isNarrow.value) {
        mobileExpanded.value = !mobileExpanded.value
        /* 从「桌面已收起」缩到移动端后手动展开，必须先解掉桌面收起态，否则标签仍被隐藏 */
        if (mobileExpanded.value) {
            isCollapsed.value = false
        }
        return
    }
    isCollapsed.value = !isCollapsed.value
}

</script>

<style lang="scss" scoped>

/**
 * 收起态外观（桌面手动收起与移动端 CSS-first 默认收起共用）。
 *
 * 只控制「显示」，不含定位 / 宽度：移动端侧栏是全宽横条，桌面收起是 80px 竖栏。
 * 标签用 CSS 隐藏而不是 `v-show`，这样 SSR 首帧就能按媒体查询决定外观。
 */
@mixin sidebar-collapsed-appearance {
    .sidebar-header {
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;

        .logo {
            width: 32px;
            height: 32px;
        }

        .app-name {
            display: none;
        }

        .collapse-btn {
            margin-left: 0;
            padding: 6px;
        }
    }

    .nav-title {
        display: none;
    }

    .nav-item {
        justify-content: center;
        margin: 0 0.25rem;
        padding: 0.75rem 1rem;

        i {
            margin: 0;
        }

        .nav-label,
        .external-icon {
            display: none;
        }
    }

    .sidebar-footer {
        justify-content: center;
        padding: 0.75rem 0.5rem;
    }

    .collapse-btn {
        .collapse-icon--collapsed {
            display: inline-block;
        }

        .collapse-icon--expanded {
            display: none;
        }
    }
}

.admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--admin-bg);
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
    background: var(--admin-surface);
    border-right: 1px solid var(--admin-border);
    box-shadow: 2px 0 8px rgb(0 0 0 / 0.1);
    transition: width 0.3s ease;

    &.collapsed {
        width: 80px;

        @include sidebar-collapsed-appearance;
    }

    @media (width <= 768px) {
        position: relative;
        width: 100%;
        height: auto;

        /* CSS-first：默认就是收起态，只有显式 `mobile-expanded` 才展开 */
        &:not(.mobile-expanded) {
            @include sidebar-collapsed-appearance;
        }

        &.collapsed {
            width: 100%;
        }
    }
}

.sidebar-footer {
    padding: 0.75rem 1rem;
    margin-top: auto;
    border-top: 1px solid var(--admin-border);
    display: flex;
    justify-content: flex-start;

    @include dark-mode {
        border-top-color: $dark-border-color;

        :deep(.language-switcher__trigger) {
            background: $dark-background-light;
            color: $dark-secondary;
            border-color: $dark-border-color;
        }

        :deep(.language-switcher__menu) {
            background: $dark-background-light;
            border-color: $dark-border-color;
        }

        :deep(.language-switcher__option) {
            color: $dark-secondary;

            &:hover {
                background: rgb(255 255 255 / 0.08);
            }
        }
    }
}

/* 收起态侧栏页脚对齐由 `.sidebar-collapsed-appearance` 统一提供 */

.sidebar-header {
    position: relative;
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--admin-border);
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
        color: var(--admin-muted);
        background: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            color: $primary;
            background: var(--admin-primary-soft);
        }

        i {
            font-size: 1.2rem;
        }

        /* 收起态图标由 `.sidebar-collapsed-appearance` 翻转，默认显示「收起」图标 */
        .collapse-icon--collapsed {
            display: none;
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
    color: var(--admin-muted);
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
    color: var(--admin-text);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
        color: $primary;
        background: var(--admin-primary-soft);
    }

    &.active {
        color: $primary;
        font-weight: 600;
        background: var(--admin-primary-soft-strong);

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
            color: var(--admin-text);
            background: transparent;
        }

        small {
            margin-left: auto;
            color: var(--admin-muted);
            font-size: 0.75rem;
        }
    }

    i {
        flex-shrink: 0;
        min-width: 1.25rem;
        font-size: 1.25rem;
    }

    .nav-label {
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

    /* 桌面宽度下允许主区收缩：宽表格 / 热力图各自在容器内滚动，不把页面撑宽 */
    @media (width >= 769px) {
        min-width: 0;
    }

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
        border-bottom: 1px solid var(--admin-border);
    }

    .admin-main {
        margin-left: 0;
    }

    /* iOS 聚焦 <16px 输入会整页放大；桌面保持 14px */
    .admin-main :deep(.caomei-field) {
        --caomei-field-font-size: 16px;
    }

    .admin-main :deep(input),
    .admin-main :deep(select),
    .admin-main :deep(textarea) {
        font-size: 16px;
    }
}

// 应用后台布局暗色模式支持
@include admin-layout-dark-theme;
</style>
