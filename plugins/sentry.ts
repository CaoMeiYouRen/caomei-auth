import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const sentryDsn = config.public.sentryDsn
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            // v11 移除 sendDefaultPii：默认 dataCollection 已等价于 v10 的 sendDefaultPii: true
        })
    }
})

