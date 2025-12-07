/**
 * 服务器端隐私保护工具函数
 * 用于在日志输出中对敏感信息进行脱敏处理
 */

import {
    maskEmail as baseMaskEmail,
    maskPhone as baseMaskPhone,
    maskUserId as baseMaskUserId,
    maskIP as baseMaskIP,
    maskString as baseMaskString,
} from '../../utils/shared/privacy'

/**
 * 判断是否为开发环境
 */
const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * 脱敏邮箱地址
 * 开发环境显示完整邮箱，生产环境对用户名部分进行脱敏
 * 例如：test@example.com -> t***t@example.com
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return email
    }

    // 开发环境显示完整邮箱
    if (isDevelopment()) {
        return email
    }

    return baseMaskEmail(email)
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

    return baseMaskPhone(phone)
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

    return baseMaskUserId(userId)
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

    return baseMaskIP(ip)
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

    return baseMaskString(str, showStart, showEnd)
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
