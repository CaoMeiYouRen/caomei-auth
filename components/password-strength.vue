<template>
    <div v-if="showStrength" class="password-strength">
        <div class="strength-bar">
            <div
                class="strength-progress"
                :style="{
                    width: `${strengthPercentage}%`,
                    backgroundColor: strengthColor
                }"
            />
        </div>
        <div class="strength-info">
            <span
                class="strength-text"
                :style="{color: strengthColor}"
            >
                {{ strengthLabel }}
            </span>
            <span v-if="showScore" class="strength-score">
                ({{ score }}/100)
            </span>
        </div>
        <div v-if="showRequirements && errorMessage" class="strength-requirements">
            <small class="error-text">{{ errorMessage }}</small>
        </div>
        <div v-else-if="showRequirements && !errorMessage && password" class="strength-requirements">
            <small class="success-text">✓ 密码强度达标</small>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import {
    getPasswordStrength,
    getPasswordStrengthText,
    getPasswordStrengthColor,
    getPasswordValidationError,
    getPasswordScore,
    PasswordStrength,
} from '@/utils/password'

interface Props {
    /** 密码值 */
    password: string
    /** 目标密码强度级别 */
    targetStrength?: PasswordStrength
    /** 是否显示强度指示器 */
    showStrength?: boolean
    /** 是否显示分数 */
    showScore?: boolean
    /** 是否显示要求提示 */
    showRequirements?: boolean
    /** 最小长度（用于显示强度条） */
    minLengthForDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
    targetStrength: getDefaultPasswordStrength(), // PasswordStrength.STRONG,
    showStrength: true,
    showScore: false,
    showRequirements: true,
    minLengthForDisplay: 1,
})

// 计算当前密码强度
const currentStrength = computed(() => {
    if (!props.password || props.password.length < props.minLengthForDisplay) {
        return PasswordStrength.WEAK
    }
    return getPasswordStrength(props.password)
})

// 计算密码得分
const score = computed(() => {
    if (!props.password) return 0
    return Math.round(getPasswordScore(props.password))
})

// 计算强度百分比
const strengthPercentage = computed(() => {
    if (!props.password || props.password.length < props.minLengthForDisplay) {
        return 0
    }

    const strengthLevels = {
        [PasswordStrength.WEAK]: 25,
        [PasswordStrength.MEDIUM]: 50,
        [PasswordStrength.STRONG]: 75,
        [PasswordStrength.VERY_STRONG]: 100,
    }

    return strengthLevels[currentStrength.value] || 0
})

// 强度标签
const strengthLabel = computed(() => {
    if (!props.password || props.password.length < props.minLengthForDisplay) {
        return ''
    }
    return `密码强度：${getPasswordStrengthText(currentStrength.value)}`
})

// 强度颜色
const strengthColor = computed(() => {
    if (!props.password || props.password.length < props.minLengthForDisplay) {
        return '#e5e7eb'
    }
    return getPasswordStrengthColor(currentStrength.value)
})

// 验证错误信息
const errorMessage = computed(() => {
    if (!props.password || props.password.length < props.minLengthForDisplay) {
        return null
    }
    return getPasswordValidationError(props.password, props.targetStrength)
})
</script>

<style scoped lang="scss">
.password-strength {
    margin-top: 0.5rem;
}

.strength-bar {
    width: 100%;
    height: 4px;
    background-color: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.strength-progress {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.strength-text {
    font-weight: 500;
    transition: color 0.3s ease;
}

.strength-score {
    color: #6b7280;
    font-size: 0.75rem;
}

.strength-requirements {
    margin-top: 0.25rem;

    .error-text {
        color: $error;
        font-size: 0.8rem;
        line-height: 1.4;
    }

    .success-text {
        color: #22c55e;
        font-size: 0.8rem;
        font-weight: 500;
    }
}
</style>
