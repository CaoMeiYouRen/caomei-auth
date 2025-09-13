# coding=utf-8
<template>
    <Dialog
        :visible="visible"
        :modal="true"
        :dismissable-mask="true"
        :draggable="false"
        :closable="true"
        header="演示模式"
        style="width: 400px"
        @update:visible="$emit('update:visible', $event)"
        @hide="$emit('close')"
    >
        <div class="demo-dialog-content">
            <div class="demo-icon">
                <i class="mdi mdi-information-outline" />
            </div>
            <div class="demo-message">
                <h3>操作已被阻止</h3>
                <p>{{ message || '当前为演示模式，此操作无法在演示环境中执行。' }}</p>
                <p class="demo-hint">
                    如需体验完整功能，请部署您自己的实例。
                </p>
            </div>
        </div>

        <template #footer>
            <Button
                label="我知道了"
                @click="$emit('close')"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
interface Props {
    visible: boolean
    message?: string
}

defineProps<Props>()

defineEmits<{
    close: []
    'update:visible': [value: boolean]
}>()
</script>

<style lang="scss" scoped>
.demo-dialog-content {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem 0;
}

.demo-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: #f59e0b;
    background: #fef3c7;
    border-radius: 50%;

    i {
        font-size: 1.5rem;
    }
}

.demo-message {
    flex: 1;

    h3 {
        margin: 0 0 0.5rem;
        color: $secondary;
        font-weight: 600;
        font-size: 1.1rem;
    }

    p {
        margin: 0 0 0.75rem;
        color: $secondary-light;
        font-size: 0.875rem;
        line-height: 1.5;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .demo-hint {
        color: $secondary-light;
        font-size: 0.8rem;
    }
}
</style>
