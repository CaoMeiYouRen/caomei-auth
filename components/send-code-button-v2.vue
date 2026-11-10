<template>
    <CaomeiButton
        :disabled="disabled || remaining > 0 || loading"
        :loading="loading"
        class="code-btn"
        @click="handleSend"
    >
        {{ btnLabel }}
    </CaomeiButton>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCountdown } from '@vueuse/core'

const props = withDefaults(defineProps<{
    duration?: number
    onSend: () => Promise<unknown>
    text?: string
    resendText?: string
    disabled?: boolean
    loading?: boolean
}>(), {
    duration: 60,
    text: '获取验证码',
    resendText: '重新发送',
    disabled: false,
    loading: false,
})

const { remaining, start, reset } = useCountdown(props.duration)
reset(0)
const hasStarted = ref(false)

const btnLabel = computed(() => {
    if (hasStarted.value && remaining.value > 0) {
        return `${props.resendText}(${remaining.value}s)`
    }
    return props.text
})

async function handleSend() {
    if (props.disabled || props.loading || remaining.value > 0) {
        return
    }
    try {
        const result = await props.onSend()
        if (!result) {
            reset(0)
            hasStarted.value = false
            return
        }
        start()
        hasStarted.value = true
    } catch (error) {
        reset(0)
        hasStarted.value = false
        console.error(error)
    }
}

onMounted(() => {
    reset(0)
    hasStarted.value = false
})

onUnmounted(() => {
    reset(0)
    hasStarted.value = false
})

defineExpose({ start, reset })
</script>

<style scoped lang="scss">
.code-btn {
    flex-shrink: 0;
    max-width: 135px;
    padding: 0 0.75rem;
    white-space: nowrap;
}
</style>
