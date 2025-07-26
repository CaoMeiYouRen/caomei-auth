export interface ClarityMethods {
    identify: (customId: string, customSessionId?: string, customPageId?: string, friendlyName?: string) => void
    setTag: (key: string, value: string | string[]) => void
    event: (eventName: string) => void
    consent: (consent?: boolean) => void
    upgrade: (reason: string) => void
}

declare module '#app' {
    interface NuxtApp {
        $clarity?: ClarityMethods
    }
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $clarity?: ClarityMethods
    }
}
