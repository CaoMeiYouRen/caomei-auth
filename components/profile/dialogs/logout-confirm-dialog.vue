<template>
    <Dialog
        v-model:visible="visible"
        modal
        header="确认退出"
        :closable="true"
        :style="{width: '450px'}"
    >
        <p>确定要退出登录吗？退出后需要重新登录才能访问您的账户。</p>
        <template #footer>
            <Button
                v-tooltip.top="'取消退出登录'"
                label="取消"
                class="btn btn-secondary"
                severity="secondary"
                @click="visible = false"
            />
            <Button
                v-tooltip.top="'确认退出登录'"
                label="确认退出"
                class="btn btn-primary"
                :loading="loading"
                @click="confirm"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
defineProps<{
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm'): void
}>()

const visible = defineModel<boolean>('visible')

function confirm() {
    emit('confirm')
}
</script>
