<template>
    <CaomeiDialog
        :open="visible"
        :title="title"
        size="md"
        @update:open="$emit('update:visible', $event)"
    >
        <slot />
    </CaomeiDialog>
</template>

<script setup lang="ts">
/**
 * caomei-ui 版对话框封装（迁移批次专用）。
 *
 * 与 `base-dialog.vue`（PrimeVue）并存：共享封装按消费者路由建 V2，避免未迁移页面被动换库。
 */
withDefaults(defineProps<{
    visible: boolean
    title?: string
}>(), {
    title: '',
})

defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()
</script>
