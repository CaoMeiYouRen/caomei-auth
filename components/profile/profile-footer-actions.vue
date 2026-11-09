<template>
    <div class="form-group profile-actions">
        <CaomeiButton
            class="btn btn-primary"
            :loading="saving"
            title="点击保存修改后的个人信息"
            @click="emit('save')"
        >
            保存修改
        </CaomeiButton>
        <CaomeiButton
            variant="ghost"
            title="点击跳转到修改密码页面"
            @click="emit('changePassword')"
        >
            修改密码
        </CaomeiButton>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    saving: boolean
}>()

const emit = defineEmits<{
    (e: 'save'): void
    (e: 'changePassword'): void
}>()
</script>

<style scoped lang="scss">
.profile-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.btn-link {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    margin-left: 0.6rem;
}
</style>
