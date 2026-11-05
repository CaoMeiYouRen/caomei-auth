<template>
    <div class="layout-default">
        <main class="layout-default__main">
            <!-- Demo模式横幅 -->
            <DemoModeBanner />
            <NuxtPage />
        </main>
        <!-- 页脚 -->
        <AppFooter />
        <!-- 右上角操作区 -->
        <div
            class="layout-default__actions"
            :class="{'layout-default__actions--demo': demoMode}"
        >
            <BaseLanguageSwitcher />
        </div>
        <!-- GitHub 右上角链接 -->
        <GithubCorner v-if="demoMode" />
        <!-- 反馈按钮 -->
        <FeedbackButton />
        <!-- 主题切换按钮 -->
        <ThemeToggle />
    </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const demoMode = computed(() => config.public.demoMode)
</script>

<style scoped lang="scss">

.layout-default {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.layout-default__main {
    flex: 1 1 auto;
}

.layout-default__actions {
    position: fixed;
    top: 16px;
    right: 20px;
    z-index: 1100;
    display: flex;
    align-items: center;
    gap: 8px;

    // Demo 模式的 GitHub 角标占据右上角，下移避免遮挡
    &--demo {
        top: 104px;
    }
}

@media (width <= 768px) {
    .layout-default__actions {
        top: 12px;
        right: 12px;
    }
}
</style>
