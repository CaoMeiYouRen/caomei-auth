/**
 * 隐私保护工具函数
 * 用于在日志输出中对敏感信息进行脱敏处理
 */

/**
 * 判断是否为开发环境
 */
const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * 脱敏邮箱地址
 * 开发环境显示完整邮箱，生产环境对用户名部分进行脱敏
 * 例如：test@example.com -> t***@example.com
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return email
    }

    // 开发环境显示完整邮箱
    if (isDevelopment()) {
        return email
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
    const maskedUsername = `${username[0]}***${username[username.length - 1]}`
    return `${maskedUsername}@${domain}`
}

/**
 * 脱敏手机号码
 * 开发环境显示完整手机号，生产环境对中间部分进行脱敏
 * 支持E164格式（+86138****5678）和普通格式（138****5678）
 */
export function maskPhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
        return phone
    }

    // 开发环境显示完整手机号
    if (isDevelopment()) {
        return phone
    }

    // 处理E164格式（以+开头）
    if (phone.startsWith('+')) {
        // 提取国家码和号码部分
        const match = phone.match(/^(\+\d{1,4})(\d+)$/)
        if (match) {
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
}/**
 * 脱敏用户ID
 * 开发环境显示完整ID，生产环境只显示前4位和后4位
 * 例如：1234567890abcdef -> 1234****cdef
 */
export function maskUserId(userId: string): string {
    if (!userId || typeof userId !== 'string') {
        return userId
    }

    // 开发环境显示完整ID
    if (isDevelopment()) {
        return userId
    }

    // 如果长度小于等于8，只显示前2位和后2位
    if (userId.length <= 8) {
        return `${userId.slice(0, 2)}***${userId.slice(-2)}`
    }

    // 显示前4位和后4位，中间用*代替
    return `${userId.slice(0, 4)}****${userId.slice(-4)}`
}

/**
 * 脱敏IP地址
 * 开发环境显示完整IP，生产环境对最后一段进行脱敏
 * 例如：192.168.1.100 -> 192.168.1.***
 */
export function maskIP(ip: string): string {
    if (!ip || typeof ip !== 'string') {
        return ip
    }

    // 开发环境显示完整IP
    if (isDevelopment()) {
        return ip
    }

    // IPv4 地址
    if (ip.includes('.')) {
        const parts = ip.split('.')
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.***`
        }
    }

    // IPv6 地址
    if (ip.includes(':')) {
        const parts = ip.split(':')
        if (parts.length >= 4) {
            return `${parts.slice(0, -2).join(':')}:***:***`
        }
    }

    return ip
}

/**
 * 脱敏通用字符串
 * 开发环境显示完整字符串，生产环境对中间部分进行脱敏
 */
export function maskString(str: string, showStart = 2, showEnd = 2): string {
    if (!str || typeof str !== 'string') {
        return str
    }

    // 开发环境显示完整字符串
    if (isDevelopment()) {
        return str
    }

    if (str.length <= showStart + showEnd) {
        return '*'.repeat(str.length)
    }

    return `${str.slice(0, showStart)}***${str.slice(-showEnd)}`
}

/**
 * 创建安全的日志对象，自动脱敏敏感字段
 */
export function createSafeLogData(data: Record<string, any>): Record<string, any> {
    const safeData: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            safeData[key] = value
            continue
        }

        const lowerKey = key.toLowerCase()

        // 邮箱字段
        if (lowerKey.includes('email') || lowerKey === 'mail') {
            safeData[key] = maskEmail(String(value))
        } else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
            // 手机号字段
            safeData[key] = maskPhone(String(value))
        } else if (lowerKey.includes('userid') || lowerKey === 'uid' || lowerKey === 'id') {
            // 用户ID字段
            safeData[key] = maskUserId(String(value))
        } else if (lowerKey.includes('ip') || lowerKey.includes('addr')) {
            // IP地址字段
            safeData[key] = maskIP(String(value))
        } else if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('key')) {
            // 密码、token等敏感字段完全隐藏
            safeData[key] = '[REDACTED]'
        } else {
            // 其他字段直接赋值
            safeData[key] = value
        }
    }

    return safeData
}
