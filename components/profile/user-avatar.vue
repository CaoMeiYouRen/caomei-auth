<template>
    <div class="avatar-block">
        <CaomeiImage
            class="avatar-image"
            :src="showAvatar"
            alt="avatar"
            preview
            fit="cover"
            ratio="1"
        />
        <input
            ref="fileinput"
            type="file"
            accept="image/*"
            hidden
            @change="onFileSelect"
        >
        <CaomeiButton
            class="avatar-btn"
            variant="secondary"
            size="sm"
            icon-only
            rounded
            label="上传头像"
            title="点击上传新的头像"
            @click="onSelectAvatar"
        >
            <template #icon>
                <i class="mdi mdi-camera" />
            </template>
        </CaomeiButton>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'caomei-ui'

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

const fileinput = ref<HTMLInputElement>()
const tempAvatar = ref<string>()

const showAvatar = computed(() => tempAvatar.value || props.user.avatar || '/logo.png')

function onSelectAvatar() {
    fileinput.value?.click()
}

async function onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // 允许再次选择同一个文件
    input.value = ''
    if (!file) {
        return
    }

    if (!file.type.startsWith('image/')) {
        toast.danger({ title: '请选择图片文件', duration: 5000 })
        return
    }

    if (file.size > MAX_AVATAR_SIZE) {
        toast.danger({ title: `文件大小不能超过 ${MAX_UPLOAD_SIZE_TEXT}`, duration: 5000 })
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

            toast.success({ title: '头像上传成功', duration: 2000 })

            emit('refresh')
            tempAvatar.value = ''
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '头像上传失败'
            toast.danger({ title: errorMessage, duration: 2000 })
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

    .avatar-image {
        width: 96px;
        height: 96px;
        overflow: hidden;
        border-radius: 50%;
    }

    .avatar-btn {
        position: absolute;
        bottom: -13px;
        left: 38px;
    }
}
</style>
