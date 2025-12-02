<template>
    <Dialog
        v-model:visible="visible"
        header="确认删除"
        :modal="true"
        class="delete-dialog"
    >
        <p>确定要删除应用 "{{ application?.name }}" 吗？此操作无法撤销。</p>
        <template #footer>
            <Button
                label="取消"
                class="p-button-text"
                @click="visible = false"
            />
            <Button
                label="删除"
                severity="danger"
                :loading="deleting"
                @click="confirmDelete"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
    visible: boolean
    application: any
}>()

const emit = defineEmits(['update:visible', 'deleted'])

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const toast = useToast()
const deleting = ref(false)

async function confirmDelete() {
    if (!props.application) return

    try {
        deleting.value = true
        await $fetch(`/api/admin/oauth/applications/${props.application.id}`, {
            method: 'DELETE',
        })

        toast.add({
            severity: 'success',
            summary: '删除成功',
            detail: '应用已删除',
            life: 3000,
        })
        visible.value = false
        emit('deleted')
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '删除失败',
            detail: error.message || '删除失败',
            life: 3000,
        })
    } finally {
        deleting.value = false
    }
}
</script>
