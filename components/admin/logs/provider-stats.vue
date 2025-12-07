<template>
    <div class="provider-stats">
        <div class="section-header">
            <h2 class="section-title">
                登录方式统计
            </h2>
        </div>
        <div class="provider-chart">
            <DataTable
                :value="providerStats"
                :rows="10"
                striped-rows
                responsive-layout="scroll"
            >
                <Column field="provider" header="登录方式">
                    <template #body="{data}">
                        <div class="provider-cell">
                            <i
                                :class="getProviderIcon(data.provider)"
                                :style="{color: getProviderColor(data.provider)}"
                            />
                            <span>{{ getProviderName(data.provider) }}</span>
                        </div>
                    </template>
                </Column>
                <Column field="count" header="登录次数">
                    <template #body="{data}">
                        <div class="count-cell">
                            <span class="count-value">{{ data.count }}</span>
                            <div class="count-bar">
                                <div
                                    class="count-progress"
                                    :style="{width: `${(data.count / maxProviderCount) * 100}%`}"
                                />
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="percentage" header="占比">
                    <template #body="{data}">
                        {{ ((data.count / totalProviderCount) * 100).toFixed(1) }}%
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getProviderIcon, getProviderColor, getProviderName } from '@/utils/web/social-provider-helpers'

const props = defineProps<{
    providerStats: any[]
}>()

const maxProviderCount = computed(() => Math.max(...(props.providerStats || []).map((item: any) => item.count), 1))
const totalProviderCount = computed(() => (props.providerStats || []).reduce((sum: number, item: any) => sum + item.count, 0))
</script>

<style lang="scss" scoped>
.provider-stats {
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

.provider-chart {
    padding: 0;

    :deep(.p-datatable) {
        border: none;
        border-radius: 0;
    }

    :deep(.p-datatable-header) {
        background: transparent;
        border: none;
        padding: 1.5rem 2rem;
    }

    :deep(.p-datatable-tbody > tr > td) {
        padding: 1rem 2rem;
        border-color: $border-color;
    }

    :deep(.p-datatable-thead > tr > th) {
        background: $background;
        color: $secondary;
        font-weight: 600;
        padding: 1rem 2rem;
        border-color: $border-color;
    }
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
        font-weight: 600;
        color: $secondary;
        min-width: 3rem;
    }

    .count-bar {
        flex: 1;
        height: 8px;
        background: $border-color;
        border-radius: 4px;
        overflow: hidden;
        min-width: 100px;

        .count-progress {
            height: 100%;
            background: linear-gradient(90deg, $blue 0%, $blue-light 100%);
            transition: width 0.3s ease;
        }
    }
}
</style>
