import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin((app) => {
    const config = useRuntimeConfig()
    const sentryDsn = config.public.sentryDsn as string
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            sendDefaultPii: true,
        })
    }
})

