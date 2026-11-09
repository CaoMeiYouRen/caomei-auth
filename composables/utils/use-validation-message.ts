import { getCurrentInstance } from 'vue'
import { type ValidationTranslator, resolveValidationMessage } from '@/utils/shared/zod-messages'

/**
 * 组件内使用的校验消息解析器。
 *
 * 从 app 全局属性取 `$t`，避免在无 i18n 上下文的单测中调用 `useI18n()` 抛错；
 * 取不到时由 `resolveValidationMessage` 回退到 zh-CN 文案。
 */
export function useValidationMessage() {
    const instance = getCurrentInstance()
    const globalProperties = instance?.appContext.config.globalProperties as Record<string, unknown> | undefined
    const t = typeof globalProperties?.$t === 'function' ? (globalProperties.$t as ValidationTranslator) : undefined

    return (message?: string | null) => resolveValidationMessage(message, t)
}
