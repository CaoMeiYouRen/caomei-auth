<template>
    <div class="logs-header">
        <div class="header-content">
            <h1 class="logs-title">
                {{ t('admin.logs.page.title') }}
            </h1>
            <p class="logs-subtitle">
                {{ t('admin.logs.page.subtitle') }}
            </p>
        </div>
        <div class="header-actions">
            <CaomeiButton
                variant="secondary"
                :loading="loading"
                @click="$emit('refresh')"
            >
                <template #icon>
                    <i class="mdi mdi-refresh" aria-hidden="true" />
                </template>
                {{ t('admin.logs.page.refresh') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    loading: boolean
}>()

const { t } = useI18n()

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
    background: var(--admin-surface);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--admin-shadow);

    @media (width <= 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .logs-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-primary);
        margin: 0 0 0.5rem;
    }

    .logs-subtitle {
        color: var(--admin-muted);
        margin: 0;
        font-size: 1.1rem;
    }
}

.header-actions {
    display: flex;
    gap: 1rem;

    @media (width <= 768px) {
        width: 100%;
    }
}
</style>
