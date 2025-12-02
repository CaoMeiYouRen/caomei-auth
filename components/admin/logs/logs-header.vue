<template>
    <div class="logs-header">
        <div class="header-content">
            <h1 class="logs-title">
                登录统计
            </h1>
            <p class="logs-subtitle">
                查看登录日志、活跃用户、异常登录等统计报表
            </p>
        </div>
        <div class="header-actions">
            <Button
                icon="mdi mdi-refresh"
                label="刷新数据"
                severity="secondary"
                outlined
                :loading="loading"
                @click="$emit('refresh')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    loading: boolean
}>()

defineEmits<{
    (e: 'refresh'): void
}>()
</script>

<style lang="scss" scoped>
.logs-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: $background-light;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

    @media (width <= 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .logs-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem;
    }

    .logs-subtitle {
        color: $secondary-light;
        margin: 0;
        font-size: 1.1rem;
    }
}

.header-actions {
    display: flex;
    gap: 1rem;

    @media (width <= 768px) {
        width: 100%;

        :deep(.p-button) {
            flex: 1;
        }
    }
}
</style>
