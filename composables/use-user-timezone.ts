import { computed, onMounted, ref } from 'vue'
import { authClient } from '@/lib/auth-client'
import { getBrowserTimeZone, resolveTimeZone } from '@/utils/shared/timezone'

/**
 * 当前生效时区：用户设置 > 浏览器时区 > UTC。
 * 浏览器时区只在客户端挂载后读取，避免 SSR 用服务端时区渲染造成水合不一致。
 */
export function useUserTimezone() {
    const session = authClient.useSession()
    const browserTimeZone = ref<string | undefined>(undefined)

    onMounted(() => {
        browserTimeZone.value = getBrowserTimeZone()
    })

    const timeZone = computed(() => {
        const user = session.value?.data?.user as { timezone?: string | null } | undefined
        return resolveTimeZone(user?.timezone, browserTimeZone.value)
    })

    return { timeZone }
}
