<template>
    <Tag
        :value="config.label"
        :severity="config.severity"
        :class="['status-badge', `status-${variant}`]"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined

interface StatusConfig {
    label: string
    severity: Severity
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

const presets: Record<string, (val: any) => StatusConfig> = {
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
        const map: Record<string, StatusConfig> = {
            admin: { label: '管理员', severity: 'danger' },
            user: { label: '用户', severity: 'info' },
        }
        return map[val] || { label: val, severity: 'secondary' }
    },
}

const config = computed<StatusConfig>(() => {
    // 1. 优先使用 Preset
    const presetHandler = presets[props.variant]
    if (presetHandler) {
        const result = presetHandler(props.status)

        // 2. 允许 Props 覆盖 (仅针对布尔值类型的 Preset)
        if (typeof props.status === 'boolean') {
            if (props.status) {
                return {
                    label: props.trueLabel ?? result.label,
                    severity: props.trueSeverity ?? result.severity,
                }
            } else {
                return {
                    label: props.falseLabel ?? result.label,
                    severity: props.falseSeverity ?? result.severity,
                }
            }
        }
        return result
    }

    // 默认回退
    return {
        label: String(props.status),
        severity: 'secondary',
    }
})
</script>

<style lang="scss" scoped>
.status-badge {
    font-weight: 500;
}
</style>
