import { authClient } from '@/lib/auth-client'

export async function sendEmailOtpService(email: string, type: 'forget-password' | 'sign-in' | 'email-verification', token?: string) {
    const headers: HeadersInit = token ? { 'x-captcha-response': token } : {}
    return await authClient.emailOtp.sendVerificationOtp({
        email,
        type,
        fetchOptions: { headers },
    })
}

export async function sendPhoneOtpService(phone: string, type: 'forget-password' | 'sign-in' | 'phone-verification', token?: string) {
    const headers: HeadersInit = token ? { 'x-captcha-response': token } : {}
    if (type === 'forget-password') {
        return authClient.phoneNumber.requestPasswordReset({ phoneNumber: phone, fetchOptions: { headers } })
    }
    return authClient.phoneNumber.sendOtp({ phoneNumber: phone, fetchOptions: { headers } })
}
