<template>
    <div class="layout-default">
        <main class="layout-default__main">
            <NuxtPage />
        </main>
        <!-- 页脚 -->
        <AppFooter />
    </div>
</template>

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
</style>
