import { ReCaptchaInstance } from 'recaptcha-v3'

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $recaptcha: (action: string) => Promise<string>
        $recaptchaLoaded: () => Promise<boolean>
        $recaptchaInstance: ReCaptchaInstance
    }
}
