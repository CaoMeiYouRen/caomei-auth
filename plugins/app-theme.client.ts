import { useAppTheme } from '@/composables/use-app-theme'

/**
 * 主题初始化：把 `vueuse-color-scheme` 同步成 `<html class="dark|light">`。
 *
 * 必须在应用级初始化，而不仅是在 `ThemeToggle` 里：错误页（`error.vue`）不经过布局，
 * 没有切换按钮实例，主题类名不会被设置，暗色用户会看到浅色错误页（视觉矩阵
 * `error-404 默认态（dark）` 即为此缺陷的回归守卫）。
 */
export default defineNuxtPlugin(() => {
    useAppTheme()
})
