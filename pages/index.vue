<template>
    <div class="demo-container">
        <h1 class="title">
            草梅 Auth 统一登录平台
        </h1>
        <p class="subtitle">
            PrimeVue 风格演示页
        </p>
        <div class="demo-grid">
            <Card class="demo-card">
                <template #title>
                    登录演示
                </template>
                <template #content>
                    <Button
                        label="前往登录页"
                        icon="mdi mdi-login"
                        class="p-mt-2"
                        @click="toLogin"
                    />
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

function toLogin() {
     navigateTo('/login')
}

onMounted(() => {
    // setTimeout(() => {
    //     navigateTo('/login')
    // }, 500)
})

</script>

<style scoped lang="scss">
.demo-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.title {
    text-align: center;
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    text-align: center;
    color: #888;
    margin-bottom: 2rem;
}

.demo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
}

.demo-card {
    min-width: 280px;
    max-width: 320px;
    flex: 1 1 300px;
}

.form-group {
    margin-bottom: 1.2rem;

    label {
        display: block;
        margin-bottom: 0.4rem;
        color: #666;
    }
    // input{
    //     width: 100%;
    //     border: 1px solid #ccc;
    //     border-radius: 4px;
    // }
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
}
</style>
