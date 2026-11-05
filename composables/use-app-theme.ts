import { computed } from 'vue'
import { useColorMode, usePreferredDark } from '@vueuse/core'

/**
 * 应用主题状态（唯一事实源）。
 *
 * - `mode` 为用户选择：`auto` / `light` / `dark`，持久化在 `vueuse-color-scheme`；
 * - `isDark` 为最终生效状态：显式 dark，或 auto 且系统为 dark；
 * - `toggle` 在明暗之间切换，并写入显式选择（不再被系统偏好覆盖）。
 */
export function useAppTheme() {
    const mode = useColorMode({ emitAuto: true })
    const preferredDark = usePreferredDark()

    const isDark = computed(() => mode.value === 'dark' || (mode.value === 'auto' && preferredDark.value))

    const toggle = () => {
        mode.value = isDark.value ? 'light' : 'dark'
    }

    return { mode, isDark, toggle }
}
