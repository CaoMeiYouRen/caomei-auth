<template>
    <CaomeiDialog
        :open="visible"
        :title="title"
        :size="size"
        :breakpoints="breakpoints"
        :closable="closable"
        :close-on-esc="closeOnEsc"
        :close-on-overlay="closeOnOverlay"
        @update:open="$emit('update:visible', $event)"
        @hide="$emit('hide')"
    >
        <slot />
        <div v-if="$slots.footer" class="dialog-footer">
            <slot name="footer" />
        </div>
    </CaomeiDialog>
</template>

<script setup lang="ts">
/**
 * caomei-ui 版对话框封装（迁移批次专用）。
 *
 * 共享对话框封装的唯一实现（PrimeVue 版 `base-dialog.vue` 已在阶段 4 P5 删除，见 docs/design/governance/2026-11-14-p4-closure.md）。
 */
import type { DialogSize } from 'caomei-ui'

withDefaults(defineProps<{
    visible: boolean
    title?: string
    /** 宽度档位（sm 360 / md 480 / lg 640），按内容密度选择 */
    size?: DialogSize
    /** 按视口宽度上限覆盖面板宽度（命中多个时最窄档生效）；用于表格类弹窗放宽桌面宽度 */
    breakpoints?: Record<string, string>
    /** 是否显示右上角关闭按钮（撤销 / 提交中由调用方置为 false） */
    closable?: boolean
    /** Esc 是否关闭 */
    closeOnEsc?: boolean
    /** 点击遮罩是否关闭 */
    closeOnOverlay?: boolean
}>(), {
    title: '',
    size: 'md',
    breakpoints: undefined,
    closable: true,
    closeOnEsc: true,
    closeOnOverlay: true,
})

defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'hide'): void
}>()
</script>

<style scoped lang="scss">
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
}
</style>
