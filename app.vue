<template>
    <div>
        <Toast />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig().public
const baiduAnalyticsId = config.baiduAnalyticsId
useHead({
    script: [baiduAnalyticsId ? { src: `https://hm.baidu.com/hm.js?${baiduAnalyticsId}` } : null].filter(Boolean),
})
</script>
