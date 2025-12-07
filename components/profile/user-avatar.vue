<template>
    <div class="avatar-block">
        <Image
            v-tooltip.top="'点击查看头像大图'"
            alt="Image"
            preview
            :pt="{
                previewMask: {
                    style: {
                        borderRadius: '50%'
                    }
                }
            }"
        >
            <template #previewicon>
                <i class="mdi mdi-magnify" />
            </template>
            <template #image>
                <Avatar
                    v-tooltip.top="'当前显示的头像'"
                    :image="showAvatar"
                    alt="avatar"
                    preview
                    size="xlarge"
                    shape="circle"
                />
            </template>
            <template #preview="slotProps">
                <img
                    :src="showAvatar"
                    alt="preview"
                    :style="slotProps.style"
                    @click="slotProps.previewCallback"
                >
            </template>
        </Image>
        <FileUpload
            v-show="false"
            ref="fileupload"
            mode="basic"
            custom-upload
            auto
            severity="secondary"
            class="p-button-outlined"
            accept="image/*"
            :max-file-size="MAX_AVATAR_SIZE"
            @select="onFileSelect"
        />
        <Button
            v-tooltip.top="'点击上传新的头像'"
            label=""
            class="avatar-btn"
            icon="mdi mdi-camera"
            severity="contrast"
            variant="text"
            size="small"
            rounded
            aria-label="Camera"
            name="file"
            @click="onSelectAvatar"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'

import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_TEXT } from '@/utils/shared/env'

const props = defineProps<{
    user: {
        avatar: string
    }
}>()

const emit = defineEmits<{
    (e: 'update:user', user: any): void
    (e: 'refresh'): void
}>()

const toast = useToast()
const MAX_AVATAR_SIZE = MAX_UPLOAD_SIZE

const fileupload = ref<any>()
const tempAvatar = ref<string>()

const showAvatar = computed(() => tempAvatar.value || props.user.avatar || '/logo.png')

function onSelectAvatar() {
    fileupload.value?.choose()
}

async function onFileSelect(event: FileUploadSelectEvent) {
    const file = event.files[0] as File
    if (!file) {
        return
    }

    if (!file?.type?.startsWith('image/')) {
        toast.add({ severity: 'error', summary: '请选择图片文件', life: 5000 })
        return
    }

    if (file?.size > MAX_AVATAR_SIZE) {
        toast.add({ severity: 'error', summary: `文件大小不能超过 ${MAX_UPLOAD_SIZE_TEXT}`, life: 5000 })
        return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            tempAvatar.value = e.target?.result as string

            const form = new FormData()
            form.append('file', file)

            const { data, error } = await useFetch('/api/file/upload', {
                method: 'POST',
                body: form,
            })
            if (error.value) {
                throw new Error(error.value.message || '头像上传失败')
            }

            emit('update:user', {
                ...props.user,
                avatar: data.value?.url || '',
            })

            toast.add({ severity: 'success', summary: '头像上传成功', life: 2000 })

            emit('refresh')
            tempAvatar.value = ''
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '头像上传失败'
            toast.add({ severity: 'error', summary: errorMessage, life: 2000 })
        }
    }
    reader.readAsDataURL(file)
}
</script>

<style scoped lang="scss">
.avatar-block {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;

    .avatar-btn {
        position: absolute;
        bottom: -13px;
        left: 38px;
    }
}
</style>
