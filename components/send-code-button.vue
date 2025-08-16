<template>
    <Button
        :label="btnLabel"
        :disabled="disabled || remaining > 0 || loading"
        class="btn btn-primary code-btn"
        @click="handleSend"
    />
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useCountdown } from '@vueuse/core'
import Button from 'primevue/button'

const props = defineProps({
    duration: { type: Number, default: 60 },
    onSend: { type: Function, required: true }, // 发送验证码方法，返回Promise
    text: { type: String, default: '获取验证码' },
    resendText: { type: String, default: '重新发送' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
})

const { remaining, start, reset } = useCountdown(props.duration)
reset(0) // 初始为0
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
        reset(props.duration) // 重置倒计时
        start() // 开始倒计时
        hasStarted.value = true // 重置开始状态
        const result = await props.onSend()
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    reset(0) // 初始为0
    hasStarted.value = false // 确保初始状态未开始
})

onUnmounted(() => {
    reset(0) // 组件卸载时重置倒计时
    hasStarted.value = false // 重置开始状态
})

defineExpose({ start, reset })
</script>

<style scoped lang="scss">
@import "@/styles/theme";

.code-btn {
    max-width: 135px;
    margin-top: -1px;
    padding: 0.75rem 0.5rem;
    font-size: 0.95rem;
    line-height: 1.5;
}
</style>
