<template>
    <Dialog
        :visible="visible"
        modal
        :header="title"
        :style="dialogStyle"
        :breakpoints="{'960px': '75vw', '640px': '90vw'}"
        class="base-dialog"
        @update:visible="$emit('update:visible', $event)"
    >
        <slot />

        <template #footer>
            <slot name="footer">
                <div v-if="showFooter" class="dialog-footer">
                    <Button
                        :label="cancelText"
                        severity="secondary"
                        text
                        @click="onCancel"
                    />
                    <Button
                        :label="confirmText"
                        :severity="confirmSeverity"
                        :loading="loading"
                        @click="onConfirm"
                    />
                </div>
            </slot>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    visible: boolean
    title?: string
    loading?: boolean
    width?: string
    confirmText?: string
    cancelText?: string
    confirmSeverity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast'
    showFooter?: boolean
}>(), {
    title: '',
    loading: false,
    width: '500px',
    confirmText: '确认',
    cancelText: '取消',
    confirmSeverity: 'primary',
    showFooter: true,
})

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

const dialogStyle = computed(() => ({
    width: props.width,
}))

function onCancel() {
    emit('update:visible', false)
    emit('cancel')
}

function onConfirm() {
    emit('confirm')
}
</script>

<style lang="scss" scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
</style>
