<template>
    <div class="stats-overview">
        <div class="stat-card">
            <div class="stat-icon">
                <i class="mdi mdi-account-group" />
            </div>
            <div class="stat-content">
                <div class="stat-value">
                    {{ stats?.overview?.totalUsers || 0 }}
                </div>
                <div class="stat-label">
                    总用户数
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="mdi mdi-login" />
            </div>
            <div class="stat-content">
                <div class="stat-value">
                    {{ stats?.overview?.totalSessions || 0 }}
                </div>
                <div class="stat-label">
                    总登录次数
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="mdi mdi-account-check" />
            </div>
            <div class="stat-content">
                <div class="stat-value">
                    {{ stats?.overview?.activeSessions || 0 }}
                </div>
                <div class="stat-label">
                    活跃会话
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="mdi mdi-account-heart" />
            </div>
            <div class="stat-content">
                <div class="stat-value">
                    {{ stats?.overview?.activeUsers || 0 }}
                </div>
                <div class="stat-label">
                    活跃用户（7天）
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
.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: $background-light;
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
    }

    .stat-icon {
        background: linear-gradient(135deg, $blue-50 0%, $blue-100 100%);
        color: $blue;
        width: 4rem;
        height: 4rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        flex-shrink: 0;
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: $secondary;
        line-height: 1;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        color: $secondary-light;
        font-size: 0.95rem;
        font-weight: 500;
    }
}

@media (width <= 768px) {
    .stats-overview {
        grid-template-columns: 1fr;
    }
}
</style>
