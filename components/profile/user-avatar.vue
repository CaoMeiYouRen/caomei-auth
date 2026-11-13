<template>
    <div class="avatar-block">
        <div class="avatar-block__media">
            <CaomeiImage
                class="avatar-block__image"
                :src="showAvatar"
                alt="avatar"
                preview
                fit="cover"
                ratio="1"
            />
            <BaseTooltip content="点击上传新的头像">
                <CaomeiButton
                    class="avatar-block__upload"
                    variant="secondary"
                    size="sm"
                    icon-only
                    rounded
                    label="上传头像"
                    @click="onSelectAvatar"
                >
                    <template #icon>
                        <i class="mdi mdi-camera" />
                    </template>
                </CaomeiButton>
            </BaseTooltip>
        </div>
        <input
            ref="fileinput"
            type="file"
            accept="image/*"
            hidden
            @change="onFileSelect"
        >
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
    margin-bottom: 1.5rem;

    &__media {
        position: relative;
        width: 96px;
        height: 96px;
        flex: none;
    }

    &__image {
        width: 96px;
        height: 96px;
        overflow: hidden;
        border-radius: 50%;
    }

    &__upload {
        position: absolute;
        right: 0;
        bottom: 0;

        /* 从 28px 档位再收一档，避免遮挡头像；描边与卡片底色一致 */
        width: 24px;
        height: 24px;
        padding: 0;
        box-shadow: 0 0 0 2px var(--background-light);

        /* 视觉保持 24px，用伪元素把命中区扩到 32px（WCAG 2.5.8 下限）；
         * 副作用：头像右下 4px 环从「预览」变为「上传」，与可见按钮边界一致 */
        &::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
        }

        :deep(.mdi) {
            font-size: 0.875rem;
            line-height: 1;
        }
    }
}
</style>
