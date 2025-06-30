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
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <InputText
                            id="username"
                            v-model="username"
                            placeholder="请输入用户名"
                        />
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <Password
                            id="password"
                            v-model="password"
                            toggle-mask
                            placeholder="请输入密码"
                        />
                    </div>
                    <Button
                        label="登录"
                        icon="mdi mdi-login"
                        class="p-mt-2"
                        @click="onLogin"
                    />
                </template>
            </Card>
            <Card class="demo-card">
                <template #title>
                    风格按钮
                </template>
                <template #content>
                    <div class="button-group">
                        <Button label="主按钮" icon="mdi mdi-check" />
                        <Button
                            label="次按钮"
                            icon="mdi mdi-information"
                            severity="secondary"
                        />
                        <Button
                            label="成功"
                            icon="mdi mdi-thumb-up"
                            severity="success"
                        />
                        <Button
                            label="警告"
                            icon="mdi mdi-alert"
                            severity="warning"
                        />
                        <Button
                            label="危险"
                            icon="mdi mdi-close"
                            severity="danger"
                        />
                    </div>
                </template>
            </Card>
            <Card class="demo-card">
                <template #title>
                    通知与提示
                </template>
                <template #content>
                    <Button
                        label="显示通知"
                        icon="mdi mdi-bell"
                        @click="showToast"
                    />
                    <Toast />
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Toast from 'primevue/toast'

const username = ref('')
const password = ref('')
const toast = useToast()

function onLogin() {
    toast.add({
        severity: 'info',
        summary: '登录演示',
        detail: `用户名：${username.value}，密码：${password.value}`,
        life: 2000,
    })
}

function showToast() {
    toast.add({
        severity: 'success',
        summary: '通知',
        detail: 'PrimeVue 风格通知演示',
        life: 2000,
    })
}
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
