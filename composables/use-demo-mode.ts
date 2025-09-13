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
 * Demo模式操作拦截
 */
export function useDemoModeGuard() {
    const { isDemoMode } = useDemoMode()
    const showDemoDialog = ref(false)
    const demoMessage = ref('')

    /**
     * 检查操作是否被Demo模式阻止
     * @param message 自定义提示消息
     * @returns 是否被阻止
     */
    const checkDemoMode = (message?: string): boolean => {
        if (isDemoMode.value) {
            demoMessage.value = message || ''
            showDemoDialog.value = true
            return true
        }
        return false
    }

    /**
     * 关闭Demo模式对话框
     */
    const closeDemoDialog = () => {
        showDemoDialog.value = false
        demoMessage.value = ''
    }

    /**
     * 尝试执行操作，如果是Demo模式则阻止
     * @param action 要执行的操作
     * @param message 自定义提示消息
     */
    const tryAction = async (action: () => Promise<void> | void, message?: string) => {
        if (checkDemoMode(message)) {
            return
        }
        await action()
    }

    return {
        isDemoMode,
        showDemoDialog,
        demoMessage,
        checkDemoMode,
        closeDemoDialog,
        tryAction,
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
