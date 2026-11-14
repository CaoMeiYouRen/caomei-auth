<template>
    <div class="stats-overview">
        <div class="stat-card">
            <div class="stat-icon">
                <i class="mdi mdi-account-group" aria-hidden="true" />
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
                <i class="mdi mdi-login" aria-hidden="true" />
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
                <i class="mdi mdi-account-check" aria-hidden="true" />
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
                <i class="mdi mdi-account-heart" aria-hidden="true" />
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
import type { AdminLogStats } from '@/types/admin'

defineProps<{
    stats: AdminLogStats | null
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
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
    }

    .stat-icon {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        font-size: 1.75rem;
        color: var(--color-blue);
        background: color-mix(in srgb, var(--color-blue) 14%, transparent);
        border-radius: 12px;
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        margin-bottom: 0.25rem;
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
        color: var(--admin-text);
    }

    .stat-label {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--admin-muted);
    }
}

@media (width <= 768px) {
    .stats-overview {
        grid-template-columns: 1fr;
    }
}
</style>
