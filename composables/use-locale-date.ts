import { computed, type ComputedRef, type Ref } from 'vue'
import { useNuxtApp } from '#app'
import { formatDateLocale, formatDateTimeLocale } from '@/utils/shared/date'
import { useUserTimezone } from '@/composables/use-user-timezone'

/** 当前 UI 语言（响应式）；脱离 Nuxt 上下文时回退 zh-CN。 */
function resolveLocale(): ComputedRef<string> {
    return computed(() => {
        try {
            return String(useNuxtApp().$i18n.locale.value ?? 'zh-CN')
        } catch {
            return 'zh-CN'
        }
    })
}

/**
 * 按当前 UI 语言格式化日期。
 * 统一 Admin 表格 / 详情里的日期口径，避免各处默认 zh-CN。
 */
export function useLocaleDate(localeOverride?: Ref<string>, timeZoneOverride?: Ref<string>) {
    const locale = localeOverride ? computed(() => localeOverride.value) : resolveLocale()
    const { timeZone: resolvedTimeZone } = useUserTimezone()
    const timeZone = timeZoneOverride ?? resolvedTimeZone

    return {
        /** 完整日期时间（含秒），用于详情类展示 */
        formatDateTimeFull: (date: string | number | Date | null | undefined) => formatDateLocale(date, locale.value, timeZone.value),
        /** 短日期时间（不含秒），用于表格列 */
        formatDateTimeShort: (date: string | number | Date | null | undefined) => formatDateTimeLocale(date, locale.value, timeZone.value),
    }
}
