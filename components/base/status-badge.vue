<template>
    <CaomeiTag
        :tone="config.tone"
        variant="soft"
        class="status-badge"
    >
        {{ config.label }}
    </CaomeiTag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentTone } from 'caomei-ui'

type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined

interface StatusConfig {
    label: string
    tone: ComponentTone
}

/** PrimeVue severity → caomei tone（迁移期共用同一 StatusBadge API） */
const SEVERITY_TO_TONE: Record<Exclude<Severity, undefined>, ComponentTone> = {
    success: 'success',
    /* caomei 无独立 info 色调；用 neutral 避免与 danger（红）撞色 */
    info: 'neutral',
    warning: 'warning',
    danger: 'danger',
    secondary: 'neutral',
    contrast: 'neutral',
}

const props = withDefaults(defineProps<{
    status: any
    variant?: 'enabled' | 'disabled' | 'banned' | 'session' | 'role' | 'yes-no'
    trueLabel?: string
    falseLabel?: string
    trueSeverity?: Severity
    falseSeverity?: Severity
}>(), {
    variant: 'enabled',
    trueLabel: undefined,
    falseLabel: undefined,
    trueSeverity: undefined,
    falseSeverity: undefined,
})

const presets: Record<string, (val: any) => { label: string, severity: Severity }> = {
    // 启用状态 (true=好, false=坏)
    enabled: (val: boolean) => ({
        label: val ? '已启用' : '已禁用',
        severity: val ? 'success' : 'danger',
    }),
    // 禁用状态 (true=坏, false=好)
    disabled: (val: boolean) => ({
        label: val ? '已禁用' : '已启用',
        severity: val ? 'danger' : 'success',
    }),
    // 封禁状态 (true=坏, false=好)
    banned: (val: boolean) => ({
        label: val ? '已禁用' : '正常',
        severity: val ? 'danger' : 'success',
    }),
    // 会话状态
    session: (val: boolean) => ({
        label: val ? '活跃' : '已过期',
        severity: val ? 'success' : 'secondary',
    }),
    // 简单是非
    'yes-no': (val: boolean) => ({
        label: val ? '是' : '否',
        severity: val ? 'success' : 'secondary',
    }),
    // 角色映射
    role: (val: string) => {
        const map: Record<string, { label: string, severity: Severity }> = {
            admin: { label: '管理员', severity: 'danger' },
            user: { label: '用户', severity: 'info' },
        }
        return map[val] || { label: val, severity: 'secondary' }
    },
}

const config = computed<StatusConfig>(() => {
    const presetHandler = presets[props.variant]

    if (!presetHandler) {
        return { label: String(props.status), tone: 'neutral' }
    }

    const result = presetHandler(props.status)
    let severity = result.severity

    // Props 覆盖仅针对布尔值类型的 Preset
    if (typeof props.status === 'boolean') {
        severity = props.status
            ? props.trueSeverity ?? result.severity
            : props.falseSeverity ?? result.severity
    }

    return {
        label: typeof props.status === 'boolean'
            ? (props.status ? props.trueLabel ?? result.label : props.falseLabel ?? result.label)
            : result.label,
        tone: severity ? SEVERITY_TO_TONE[severity] : 'neutral',
    }
})
</script>

<style lang="scss" scoped>
.status-badge {
    font-weight: 500;
}
</style>
