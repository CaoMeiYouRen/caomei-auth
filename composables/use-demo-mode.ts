/**
 * Demo模式相关的组合式函数
 */

/**
 * 检查是否为Demo模式
 */
export function useDemoMode() {
    const config = useRuntimeConfig()
    const isDemoMode = computed(() => config.public.demoMode)

    return {
        isDemoMode,
    }
}

/**
 * Demo模式提示横幅
 */
export function useDemoBanner() {
    const { isDemoMode } = useDemoMode()
    const showBanner = ref(true)

    const closeBanner = () => {
        showBanner.value = false
    }

    const shouldShowBanner = computed(() => isDemoMode.value && showBanner.value)

    return {
        isDemoMode,
        showBanner: shouldShowBanner,
        closeBanner,
    }
}
