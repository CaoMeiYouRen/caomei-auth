/**
 * 通用隐私保护工具函数
 * 前后端共用的脱敏处理逻辑
 */

import { phoneUtil, getRegionCodeForPhoneNumber } from './phone'

/**
 * 脱敏邮箱地址
 * 例如：test@example.com -> t***t@example.com
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
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
    const maskedUsername = `${username[0]}${'*'.repeat(Math.min(username.length - 2, 4))}${username[username.length - 1]}`
    return `${maskedUsername}@${domain}`
}

/**
 * 脱敏手机号码
 * 使用 google-libphonenumber 正确解析手机号格式
 * 支持E164格式（+86138****5678）和普通格式（138****5678）
 */
export function maskPhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
        return phone
    }

    try {
        // 获取手机号所属区域
        const region = getRegionCodeForPhoneNumber(phone)

        // 解析手机号
        const phoneNumber = phoneUtil.parse(phone, region)

        // 检查是否为有效的手机号
        if (!phoneUtil.isValidNumber(phoneNumber)) {
            return phone
        }

        // 获取国家码和国家号码
        const countryCode = phoneNumber.getCountryCode()
        const nationalNumberValue = phoneNumber.getNationalNumber()

        if (!nationalNumberValue) {
            return phone
        }

        const nationalNumber = nationalNumberValue.toString()

        // 如果号码长度不够，直接返回原格式
        if (nationalNumber.length < 7) {
            return phone
        }

        // 根据号码长度选择脱敏策略
        let maskedNationalNumber: string

        if (nationalNumber.length >= 10) {
            // 长号码：显示前3位和后4位 (例如：138****5678)
            maskedNationalNumber = `${nationalNumber.slice(0, 3)} **** ${nationalNumber.slice(-4)}`
        } else if (nationalNumber.length >= 7) {
            // 中等长度：显示前2位和后2位 (例如：12***45)
            maskedNationalNumber = `${nationalNumber.slice(0, 2)} *** ${nationalNumber.slice(-2)}`
        } else {
            // 短号码：显示第1位和最后1位
            maskedNationalNumber = `${nationalNumber[0]} *** ${nationalNumber[nationalNumber.length - 1]}`
        }

        // 返回带国家码的脱敏号码
        return `+${countryCode} ${maskedNationalNumber}`

    } catch (error) {
        // 如果解析失败，使用简单的字符串脱敏逻辑作为后备方案
        console.warn('Failed to parse phone number:', phone, error)

        // 处理简单的数字字符串
        const cleanPhone = phone.replace(/\D/g, '')

        if (cleanPhone.length < 7) {
            return phone
        }

        if (cleanPhone.length >= 10) {
            return `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-4)}`
        }

        return `${cleanPhone.slice(0, 2)}***${cleanPhone.slice(-2)}`
    }
}

/**
 * 脱敏用户ID
 * 例如：1234567890abcdef -> 1234****cdef
 */
export function maskUserId(userId: string): string {
    if (!userId || typeof userId !== 'string') {
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
 * 脱敏用户名
 * 例如：testuser -> te***er
 */
export function maskUsername(username: string): string {
    if (!username || typeof username !== 'string') {
        return username
    }

    // 长度 ≤ 2：不脱敏
    if (username.length <= 2) {
        return username
    }

    // 长度 ≤ 4：显示首尾字符，中间用 ***
    if (username.length <= 4) {
        return `${username[0]}***${username[username.length - 1]}`
    }

    // 长度 > 4：显示前2位和后2位，中间用 ***
    return `${username.slice(0, 2)}***${username.slice(-2)}`
}

/**
 * 脱敏IP地址
 * 例如：192.168.1.100 -> 192.168.1.***
 */
export function maskIP(ip: string): string {
    if (!ip || typeof ip !== 'string') {
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
 */
export function maskString(str: string, showStart = 2, showEnd = 2): string {
    if (!str || typeof str !== 'string') {
        return str
    }

    if (str.length <= showStart + showEnd) {
        return '*'.repeat(str.length)
    }

    return `${str.slice(0, showStart)}***${str.slice(-showEnd)}`
}
