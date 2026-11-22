<template>
    <section
        class="login-event-heatmap"
        :aria-label="t('admin.logs.heatmap.groupLabel')"
    >
        <div class="heatmap-header">
            <div>
                <h3 class="heatmap-title">
                    {{ t('admin.logs.heatmap.title') }}
                </h3>
                <p class="heatmap-description">
                    {{ t('admin.logs.heatmap.description') }}
                </p>
            </div>
            <div class="heatmap-tabs">
                <CaomeiButton
                    size="sm"
                    :variant="days === 7 ? 'primary' : 'secondary'"
                    :aria-pressed="days === 7"
                    @click="days = 7"
                >
                    {{ t('admin.logs.heatmap.days7') }}
                </CaomeiButton>
                <CaomeiButton
                    size="sm"
                    :variant="days === 30 ? 'primary' : 'secondary'"
                    :aria-pressed="days === 30"
                    @click="days = 30"
                >
                    {{ t('admin.logs.heatmap.days30') }}
                </CaomeiButton>
            </div>
        </div>

        <div
            v-if="errorMessage"
            class="heatmap-error"
            role="alert"
        >
            <i class="mdi mdi-alert-circle-outline" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
            <CaomeiButton
                size="sm"
                variant="secondary"
                @click="reload"
            >
                {{ t('admin.logs.heatmap.retry') }}
            </CaomeiButton>
        </div>

        <p
            v-else-if="loading && !data"
            class="heatmap-state"
        >
            {{ t('admin.logs.heatmap.loading') }}
        </p>

        <p
            v-else-if="!data || max === 0"
            class="heatmap-state"
        >
            {{ t('admin.logs.heatmap.empty') }}
        </p>

        <div
            v-else
            class="heatmap-body"
            :class="{'heatmap-body--loading': loading}"
        >
            <div class="heatmap-scroll">
                <div
                    class="heatmap-grid"
                    role="table"
                    :aria-label="t('admin.logs.heatmap.groupLabel')"
                >
                    <div
                        v-for="row in data.rows"
                        :key="row.type"
                        class="heatmap-row"
                        role="row"
                    >
                        <span
                            class="heatmap-row__label"
                            role="rowheader"
                        >
                            {{ typeLabel(row.type) }}
                        </span>
                        <span
                            v-for="(value, index) in row.values"
                            :key="`${row.type}-${index}`"
                            class="heatmap-cell"
                            role="cell"
                            :style="cellStyle(value)"
                            :title="cellTitle(row.type, index, value)"
                            :aria-label="cellTitle(row.type, index, value)"
                        />
                    </div>
                </div>
            </div>

            <div class="heatmap-footer">
                <span class="heatmap-range">
                    {{ t('admin.logs.heatmap.range', {start: data.buckets[0], end: data.buckets[data.buckets.length - 1]}) }}
                </span>
                <span class="heatmap-legend">
                    <span>{{ t('admin.logs.heatmap.legendLow') }}</span>
                    <i
                        v-for="level in LEGEND_LEVELS"
                        :key="level"
                        class="heatmap-legend__swatch"
                        :style="cellStyle(Math.round((max * level) / 100), true)"
                        aria-hidden="true"
                    />
                    <span>{{ t('admin.logs.heatmap.legendHigh') }}</span>
                </span>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import { useLoginEventHeatmap } from '@/composables/admin/use-login-event-heatmap'
import type { LoginEventType } from '@/utils/shared/login-events'
import { loginEventTypeLabelKey } from '@/utils/web/login-event-labels'

const { t } = useI18n()
const { days, loading, data, errorMessage, reload } = useLoginEventHeatmap()

const LEGEND_LEVELS = [25, 50, 75, 100] as const

const max = computed(() => data.value?.max ?? 0)

function typeLabel(type: LoginEventType) {
    return t(loginEventTypeLabelKey(type))
}

function cellTitle(type: LoginEventType, index: number, value: number) {
    return t('admin.logs.heatmap.cellLabel', {
        type: typeLabel(type),
        bucket: data.value?.buckets[index] ?? '',
        count: value,
    })
}

/** 色阶：0 为透明，其余用 Admin accent 混合表面色；图例传固定值，不受 max 影响 */
function cellStyle(value: number, forLegend = false): CSSProperties {
    if (!value || (!forLegend && max.value === 0)) {
        return {}
    }
    const ratio = forLegend ? value / 100 : value / max.value
    const percent = Math.max(12, Math.round(ratio * 100))
    return {
        backgroundColor: `color-mix(in srgb, var(--color-primary) ${percent}%, var(--admin-surface-muted))`,
    }
}
</script>

<style lang="scss" scoped>
.login-event-heatmap {
    border-bottom: 1px solid var(--admin-border);
    padding: 1.25rem 2rem 1rem;
}

.heatmap-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 0.75rem;
}

.heatmap-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--admin-text);
}

.heatmap-description {
    margin: 0.25rem 0 0;
    color: var(--admin-muted);
    font-size: 0.85rem;
}

.heatmap-tabs {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.heatmap-state {
    margin: 0.5rem 0;
    color: var(--admin-muted);
    font-size: 0.9rem;
}

.heatmap-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    color: var(--admin-text);
    background: var(--admin-surface-muted);
}

.heatmap-body--loading {
    opacity: 0.6;
}

.heatmap-scroll {
    max-width: 100%;
    overflow-x: auto;
    padding-bottom: 0.25rem;
}

.heatmap-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 520px;
}

.heatmap-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.heatmap-row__label {
    flex: 0 0 8.5rem;
    overflow: hidden;
    color: var(--admin-muted);
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.heatmap-cell {
    flex: 1 1 0;
    min-width: 2px;
    height: 14px;
    border-radius: 2px;
    background: var(--admin-surface-muted);
}

.heatmap-footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-top: 0.75rem;
    color: var(--admin-muted);
    font-size: 0.8rem;
}

.heatmap-legend {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &__swatch {
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }
}

@media (width <= 768px) {
    .login-event-heatmap {
        padding: 1rem;
    }

    .heatmap-header {
        flex-direction: column;
    }

    .heatmap-footer {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
