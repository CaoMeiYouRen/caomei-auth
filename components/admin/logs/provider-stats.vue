<template>
    <div class="provider-stats">
        <div class="section-header">
            <h2 class="section-title">
                登录方式统计
            </h2>
        </div>
        <div class="provider-chart">
            <CaomeiDataTable
                :data="providerStats"
                :columns="columns"
                row-key="provider"
                striped
                empty-text="暂无登录方式数据"
            >
                <template #cell-provider="{row}">
                    <div class="provider-cell">
                        <i
                            :class="getProviderIcon(row.provider)"
                            :style="{color: getProviderColor(row.provider)}"
                            aria-hidden="true"
                        />
                        <span>{{ getProviderName(row.provider) }}</span>
                    </div>
                </template>

                <template #cell-count="{row}">
                    <div class="count-cell">
                        <span class="count-value">{{ row.count }}</span>
                        <div class="count-bar">
                            <div
                                class="count-progress"
                                :style="{width: `${(row.count / maxProviderCount) * 100}%`}"
                            />
                        </div>
                    </div>
                </template>
            </CaomeiDataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataTableColumn } from 'caomei-ui'
import { getProviderIcon, getProviderColor, getProviderName } from '@/utils/web/social-provider-helpers'
import type { AdminLogProviderStat } from '@/types/admin'

const props = defineProps<{
    providerStats: AdminLogProviderStat[]
}>()

const maxProviderCount = computed(() => Math.max(...(props.providerStats || []).map((item) => item.count), 1))
const totalProviderCount = computed(() => (props.providerStats || []).reduce((sum, item) => sum + item.count, 0))

const columns: DataTableColumn<AdminLogProviderStat>[] = [
    { key: 'provider', header: '登录方式' },
    { key: 'count', header: '登录次数' },
    {
        key: 'percentage',
        header: '占比',
        width: '120px',
        accessor: (row) => `${((row.count / (totalProviderCount.value || 1)) * 100).toFixed(1)}%`,
    },
]
</script>

<style lang="scss" scoped>
.provider-stats {
    /* 表格表面改用 Admin 语义 token，暗色下与卡片保持一致 */
    --caomei-color-text: var(--admin-text);
    --caomei-data-table-head-bg: var(--admin-surface-muted);
    --caomei-data-table-border: var(--admin-border);

    margin-bottom: 2rem;
    overflow: hidden;
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
}

.section-header {
    padding: 1.5rem 2rem;
    background: var(--admin-surface-muted);
    border-bottom: 1px solid var(--admin-border);
}

.section-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary);
}

.provider-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;

    i {
        font-size: 1.25rem;
    }
}

.count-cell {
    display: flex;
    align-items: center;
    gap: 1rem;

    .count-value {
        min-width: 3rem;
        font-weight: 600;
        color: var(--admin-text);
    }

    .count-bar {
        flex: 1;
        min-width: 100px;
        height: 8px;
        overflow: hidden;
        background: var(--admin-border);
        border-radius: 4px;

        .count-progress {
            height: 100%;
            background: linear-gradient(90deg, var(--color-blue) 0%, var(--color-blue-light) 100%);
            transition: width 0.3s ease;
        }
    }
}
</style>
