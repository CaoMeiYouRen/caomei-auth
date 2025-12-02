<template>
    <Dialog
        v-model:visible="visible"
        modal
        header="确认解绑"
        :closable="true"
        :style="{width: '450px'}"
    >
        <p>确定要解绑 {{ providerName }} 平台，ID 为 {{ accountId }} 的账号吗？</p>
        <template #footer>
            <Button
                v-tooltip.top="'点击取消解绑操作'"
                label="取消"
                class="btn btn-secondary"
                severity="secondary"
                @click="visible = false"
            />
            <Button
                v-tooltip.top="'点击确认解绑操作'"
                label="确认"
                class="btn btn-primary"
                @click="confirm"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
    providerName: string
    accountId: string
}>()

const emit = defineEmits<{
    (e: 'confirm'): void
}>()

const visible = defineModel<boolean>('visible')

function confirm() {
    emit('confirm')
}
</script>
