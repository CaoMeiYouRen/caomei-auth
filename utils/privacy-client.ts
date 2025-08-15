/**
 * 前端隐私保护工具函数
 * 用于在前端界面中对敏感信息进行脱敏处理
 */

/**
 * 脱敏邮箱地址
 * 例如：test@example.com -> t***@example.com
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return '未绑定'
    }

    const [username, domain] = email.split('@')
    if (!username || !domain) {
        return email
    }

    // 如果用户名长度小于等于3，只显示第一个字符
    if (username.length <= 3) {
        return `${username[0]}***@${domain}`
    }

    // 显示前1个字符和后1个字符，中间用*代替
    const maskedUsername = `${username[0]}${'*'.repeat(Math.min(username.length - 2, 4))}${username[username.length - 1]}`
    return `${maskedUsername}@${domain}`
}

/**
 * 脱敏手机号码
 * 支持E164格式（+86138****5678）和普通格式（138****5678）
 */
export function maskPhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
        return '未绑定'
    }

    // 处理E164格式（以+开头）
    if (phone.startsWith('+')) {
        // 提取国家码和号码部分
        const match = phone.match(/^(\+\d{1,4})(\d+)$/)
        if (match && match[2]) {
            const [, countryCode, number] = match

            // 如果号码长度不够，直接返回原格式
            if (number.length < 7) {
                return phone
            }

            // 脱敏号码部分
            if (number.length >= 10) {
                // 长号码：显示前3位和后4位
                return `${countryCode}${number.slice(0, 3)}****${number.slice(-4)}`
            }
            if (number.length >= 7) {
                // 中等长度：显示前2位和后2位
                return `${countryCode}${number.slice(0, 2)}***${number.slice(-2)}`
            }
        }
        return phone
    }

    // 处理普通格式（无国家码）
    const cleanPhone = phone.replace(/\D/g, '')

    // 如果长度不够，直接返回
    if (cleanPhone.length < 7) {
        return phone
    }

    // 中国手机号格式（11位）
    if (cleanPhone.length === 11) {
        return `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-4)}`
    }

    // 其他格式手机号，显示前3位和后4位
    if (cleanPhone.length > 7) {
        return `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-4)}`
    }

    // 短号码，显示前2位和后2位
    return `${cleanPhone.slice(0, 2)}***${cleanPhone.slice(-2)}`
}
