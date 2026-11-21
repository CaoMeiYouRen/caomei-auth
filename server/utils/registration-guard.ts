import { APIError } from 'better-auth/api'
import { evaluateRegistration, type RegistrationInput } from './registration-policy'
import zhErrors from '@/i18n/locales/zh-CN/errors.json'
import enErrors from '@/i18n/locales/en-US/errors.json'

/** 注册准入校验：拒绝时抛出统一错误码，避免暴露命中的名单类型 */
export async function assertRegistrationAllowed(
    input: RegistrationInput,
    context: unknown,
): Promise<void> {
    const decision = await evaluateRegistration(input)
    if (decision.allowed) {
        return
    }
    const acceptLanguage = (context as { headers?: Headers } | undefined)?.headers?.get?.('accept-language') ?? ''
    const locale = acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'zh'
    const messages = locale === 'en' ? enErrors.errors.registration : zhErrors.errors.registration
    throw new APIError('BAD_REQUEST', {
        message: messages.notAllowed,
        code: 'REGISTRATION_NOT_ALLOWED',
    })
}
