<template>
    <div class="form-group profile-actions">
        <Button
            v-tooltip.top="'点击保存修改后的个人信息'"
            label="保存修改"
            class="btn btn-primary"
            :loading="saving"
            @click="emit('save')"
        />
        <Button
            v-tooltip.top="'点击跳转到修改密码页面'"
            label="修改密码"
            class="btn btn-link ml-3"
            @click="emit('changePassword')"
        />
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
