<template>
    <DataTable
        :value="data"
        :loading="loading"
        :paginator="true"
        :rows="rows"
        :total-records="totalRecords"
        :lazy="true"
        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
        :rows-per-page-options="[10, 25, 50]"
        :sort-field="sortField"
        :sort-order="sortOrder"
        v-bind="$attrs"
        @page="$emit('page', $event)"
        @sort="$emit('sort', $event)"
    >
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>
    </DataTable>
</template>

<script setup lang="ts">
defineProps<{
    data: any[]
    loading: boolean
    totalRecords: number
    rows: number
    sortField?: string
    sortOrder?: number
}>()

defineEmits(['page', 'sort'])
</script>
