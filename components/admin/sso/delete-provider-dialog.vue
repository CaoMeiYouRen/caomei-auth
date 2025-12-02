<template>
    <Dialog
        v-model:visible="visible"
        header="确认删除"
        class="delete-dialog"
        modal
        :style="{width: '450px'}"
    >
        <div v-if="provider">
            <p>确定要删除 SSO 提供商 <strong>{{ provider.name || provider.providerId }}</strong> 吗？</p>
            <p class="text-danger">
                此操作不可撤销，删除后用户将无法通过此提供商进行 SSO 登录。
            </p>
        </div>

        <template #footer>
            <Button
                label="取消"
                severity="secondary"
                @click="visible = false"
            />
            <Button
                label="删除"
                severity="danger"
                :loading="loading"
                @click="confirmDelete"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    visible: boolean
    provider?: any
    loading?: boolean
}>()

const emit = defineEmits(['update:visible', 'confirm'])

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

function confirmDelete() {
    emit('confirm', props.provider)
}
</script>

<style lang="scss" scoped>
.delete-dialog {
    .text-danger {
        color: #e53e3e;
        font-weight: 500;
    }
}
</style>
