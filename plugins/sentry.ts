import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const sentryDsn = config.public.sentryDsn
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            sendDefaultPii: true,
        })
    }
})

