<template>
    <div class="period-stats">
        <div class="section-header">
            <h2 class="section-title">
                时间段统计
            </h2>
        </div>
        <div class="period-cards">
            <div class="period-card">
                <div class="period-label">
                    今日登录
                </div>
                <div class="period-value">
                    {{ stats?.periods?.today || 0 }}
                </div>
            </div>
            <div class="period-card">
                <div class="period-label">
                    昨日登录
                </div>
                <div class="period-value">
                    {{ stats?.periods?.yesterday || 0 }}
                </div>
            </div>
            <div class="period-card">
                <div class="period-label">
                    本周登录
                </div>
                <div class="period-value">
                    {{ stats?.periods?.week || 0 }}
                </div>
            </div>
            <div class="period-card">
                <div class="period-label">
                    本月登录
                </div>
                <div class="period-value">
                    {{ stats?.periods?.month || 0 }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    stats: any
}>()
</script>

<style lang="scss" scoped>
.period-stats {
    background: $background-light;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.section-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid $border-color;
    background: linear-gradient(135deg, $background 0%, $background-light 100%);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary;
    margin: 0;
}

.period-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
    padding: 0;
}

.period-card {
    padding: 2rem;
    text-align: center;
    border-right: 1px solid $border-color;
    transition: background-color 0.2s ease;

    &:last-child {
        border-right: none;
    }

    &:hover {
        background: $background;
    }

    .period-label {
        color: $secondary-light;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
    }

    .period-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: $blue-dark;
        line-height: 1;
    }
}

@media (width <= 768px) {
    .period-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .period-card {
        border-right: none;
        border-bottom: 1px solid $border-color;

        &:nth-child(odd) {
            border-right: 1px solid $border-color;
        }

        &:last-child,
        &:nth-last-child(2) {
            border-bottom: none;
        }
    }
}

@media (width <= 480px) {
    .period-cards {
        grid-template-columns: 1fr;
    }

    .period-card {
        border-right: none;

        &:not(:last-child) {
            border-bottom: 1px solid $border-color;
        }
    }
}
</style>
