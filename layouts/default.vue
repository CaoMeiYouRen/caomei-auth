<template>
    <div class="layout-default">
        <main class="layout-default__main">
            <!-- Demo模式横幅 -->
            <DemoModeBanner />
            <NuxtPage />
        </main>
        <!-- 页脚 -->
        <AppFooter />
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
</style>
