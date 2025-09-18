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
        <GithubCorner />
    </div>
</template>

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
