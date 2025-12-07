import { emailSchema, phoneSchema } from '@/utils/shared/validators'
import { formatPhoneNumber } from '@/utils/shared/phone'

export type InputType = 'email' | 'phone' | 'unknown'

export interface InputSuggestion {
    type: InputType
    suggestion: string
    needConfirm: boolean
    confidence: number // 0-1 置信度
}

export interface RegionOption {
    label: string
    value: string
    countryCode: number
    flag: string
}

export interface PossibleRegion {
    region: string
    countryCode: number
    probability: number
}

/**
 * 基于用户地理位置或浏览器语言获取默认区域
 */
export function getDefaultRegionByLocation(): string {
    if (typeof window === 'undefined') {
        return 'CN'
    }

    // 优先使用用户保存的偏好
    const userPreference = localStorage.getItem('caomei-auth-preferred-region')
    if (userPreference) {
        return userPreference
    }

    // 基于浏览器语言映射
    const browserLanguage = navigator.language
    const regionMap: Record<string, string> = {
        'zh-CN': 'CN',
        'zh-TW': 'TW',
        'zh-HK': 'HK',
        'en-US': 'US',
        'en-GB': 'GB',
        'ja-JP': 'JP',
        'ko-KR': 'KR',
        'fr-FR': 'FR',
        'de-DE': 'DE',
        'es-ES': 'ES',
        'it-IT': 'IT',
        'ru-RU': 'RU',
        'pt-BR': 'BR',
        'ar-SA': 'SA',
        'hi-IN': 'IN',
        'th-TH': 'TH',
        'vi-VN': 'VN',
        'ms-MY': 'MY',
        'id-ID': 'ID',
    }

    return regionMap[browserLanguage] || 'CN'
}

/**
 * 保存用户的区域偏好
 */
export function saveRegionPreference(region: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('caomei-auth-preferred-region', region)
    }
}

/**
 * 检测可能的手机号区域
 */
export function detectPossibleRegions(phoneNumber: string): PossibleRegion[] {
    const possibleRegions: PossibleRegion[] = []

    // 去除所有非数字字符
    const cleanNumber = phoneNumber.replace(/\D/g, '')

    // 中国大陆手机号：1[3-9]xxxxxxxxx (11位)
    if (/^1[3-9]\d{9}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'CN', countryCode: 86, probability: 0.95 })
    }

    // 美国/加拿大：1xxxxxxxxxx (11位，首位是1)
    if (/^1[2-9]\d{9}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'US', countryCode: 1, probability: 0.8 })
        possibleRegions.push({ region: 'CA', countryCode: 1, probability: 0.7 })
    }

    // 英国：7xxxxxxxxx 或 20xxxxxxxx 等 (10-11位)
    if (/^[27]\d{9,10}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'GB', countryCode: 44, probability: 0.7 })
    }

    // 日本：[789]0xxxxxxxx (11位)
    if (/^[789]0\d{8}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'JP', countryCode: 81, probability: 0.8 })
    }

    // 韩国：10xxxxxxxx (11位)
    if (/^10\d{8}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'KR', countryCode: 82, probability: 0.8 })
    }

    // 新加坡：[689]xxxxxxx (8位)
    if (/^[689]\d{7}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'SG', countryCode: 65, probability: 0.7 })
    }

    // 台湾：9xxxxxxxx (9位)
    if (/^9\d{8}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'TW', countryCode: 886, probability: 0.8 })
    }

    // 香港：[569]xxxxxxx (8位)
    if (/^[569]\d{7}$/.test(cleanNumber)) {
        possibleRegions.push({ region: 'HK', countryCode: 852, probability: 0.8 })
    }

    return possibleRegions.sort((a, b) => b.probability - a.probability)
}

/**
 * 智能检测输入类型
 */
export function detectInputType(input: string): InputType {
    if (!input || !input.trim()) {
        return 'unknown'
    }

    // 去除首尾空格
    const cleanInput = input.trim()

    // 1. 明确的邮箱格式（包含@符号）
    if (cleanInput.includes('@')) {
        return emailSchema.safeParse(cleanInput).success ? 'email' : 'unknown'
    }

    // 2. 明确的国际手机号格式（+开头）
    if (cleanInput.startsWith('+')) {
        return phoneSchema.safeParse(cleanInput).success ? 'phone' : 'unknown'
    }

    // 3. 纯数字，可能是本地手机号
    const numberOnly = cleanInput.replace(/[\s\-()]/g, '') // 允许常见分隔符
    if (/^\d{7,15}$/.test(numberOnly)) {
        // 尝试检测可能的区域
        const possibleRegions = detectPossibleRegions(numberOnly)
        if (possibleRegions.length > 0 && possibleRegions[0] && possibleRegions[0].probability > 0.6) {
            return 'phone'
        }
    }

    return 'unknown'
}

/**
 * 获取输入建议
 */
export function getInputSuggestion(input: string): InputSuggestion {
    const type = detectInputType(input)

    if (type === 'email') {
        return {
            type: 'email',
            suggestion: '检测到邮箱格式，将通过邮件发送验证码',
            needConfirm: false,
            confidence: 0.9,
        }
    }

    if (type === 'phone') {
        const cleanInput = input.trim()

        // 如果是国际格式
        if (cleanInput.startsWith('+')) {
            return {
                type: 'phone',
                suggestion: '检测到国际手机号格式，将通过短信发送验证码',
                needConfirm: false,
                confidence: 0.95,
            }
        }

        // 如果是本地格式，需要确认区域
        const numberOnly = cleanInput.replace(/[\s\-()]/g, '')
        const possibleRegions = detectPossibleRegions(numberOnly)

        if (possibleRegions.length > 0) {
            const bestMatch = possibleRegions[0]
            if (!bestMatch) {
                return {
                    type: 'unknown',
                    suggestion: '无法识别手机号格式，请检查输入',
                    needConfirm: false,
                    confidence: 0,
                }
            }

            const regionNames: Record<string, string> = {
                CN: '中国大陆',
                US: '美国',
                GB: '英国',
                JP: '日本',
                KR: '韩国',
                SG: '新加坡',
                TW: '台湾',
                HK: '香港',
            }

            return {
                type: 'phone',
                suggestion: `检测到可能是${regionNames[bestMatch.region] || bestMatch.region}手机号，请确认国家/地区`,
                needConfirm: true,
                confidence: bestMatch.probability,
            }
        }
    }

    // 处理未知输入
    const cleanInput = input.trim().replace(/[\s\-()]/g, '')

    if (/^\d+$/.test(cleanInput)) {
        if (cleanInput.length < 7) {
            return {
                type: 'unknown',
                suggestion: '手机号位数不足，请输入完整的手机号',
                needConfirm: false,
                confidence: 0,
            }
        }

        if (cleanInput.length > 15) {
            return {
                type: 'unknown',
                suggestion: '手机号位数过多，请检查输入',
                needConfirm: false,
                confidence: 0,
            }
        }

        return {
            type: 'unknown',
            suggestion: '无法确定手机号归属地，请选择国家/地区或添加国际区号',
            needConfirm: true,
            confidence: 0.3,
        }
    }

    if (cleanInput.includes('.') && !cleanInput.includes('@')) {
        return {
            type: 'unknown',
            suggestion: '输入似乎缺少@符号，请检查邮箱格式',
            needConfirm: false,
            confidence: 0,
        }
    }

    if (cleanInput.includes('@') && cleanInput.split('@').length > 2) {
        return {
            type: 'unknown',
            suggestion: '邮箱格式不正确，请检查@符号使用',
            needConfirm: false,
            confidence: 0,
        }
    }

    return {
        type: 'unknown',
        suggestion: '请输入有效的邮箱地址或手机号',
        needConfirm: false,
        confidence: 0,
    }
}

/**
 * 格式化账号（用于发送验证码）
 */
export function formatAccountForVerification(account: string, region?: string): string {
    const type = detectInputType(account)

    if (type === 'email') {
        return account.trim().toLowerCase()
    }

    if (type === 'phone') {
        const cleanAccount = account.trim()

        // 如果已经是国际格式，直接返回
        if (cleanAccount.startsWith('+')) {
            return cleanAccount
        }

        // 如果是本地格式，添加区域代码
        if (region) {
            try {
                return formatPhoneNumber(cleanAccount, region as any)
            } catch {
                throw new Error('手机号格式化失败，请检查输入或选择正确的国家/地区')
            }
        }

        // 尝试使用默认区域
        const defaultRegion = getDefaultRegionByLocation()
        try {
            return formatPhoneNumber(cleanAccount, defaultRegion as any)
        } catch {
            throw new Error('无法确定手机号格式，请选择国家/地区')
        }
    }

    throw new Error('无法识别的账号格式')
}

/**
 * 验证格式化后的账号
 */
export function validateFormattedAccount(account: string): boolean {
    if (account.includes('@')) {
        return emailSchema.safeParse(account).success
    }

    if (account.startsWith('+')) {
        return phoneSchema.safeParse(account).success
    }

    return false
}
