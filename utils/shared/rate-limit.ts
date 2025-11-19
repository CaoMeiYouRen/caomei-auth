export const RATE_LIMIT_KEYS = {
    GLOBAL_PHONE: 'phone_global_limit',
    SINGLE_PHONE: (phone: string) => `phone_single_user_limit:${phone}`,
    GLOBAL_EMAIL: 'email_global_limit',
    SINGLE_EMAIL: (email: string) => `email_single_user_limit:${email}`,
}

export function getRateLimitError(type: 'global' | 'user', medium: 'phone' | 'email'): string {
    if (type === 'global') {
        return `今日${medium === 'phone' ? '短信验证码' : '邮箱'}发送次数已达全局上限`
    }
    return `您的${medium === 'phone' ? '手机号' : '邮箱'}今日${medium === 'phone' ? '验证码' : ''}发送次数已达上限`
}
