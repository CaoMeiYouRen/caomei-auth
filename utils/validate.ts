import $isEmail from 'validator/es/lib/isEmail'
import isMobilePhone from 'validator/es/lib/isMobilePhone'

export function validateEmail(email: string): boolean {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
}

export function validatePhone(phone: string): boolean {
    return /^\d{11}$/.test(phone)
}

export function validateUrl(url: string): boolean {
    try {
        const u = new URL(url)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
        return false
    }
}

// 判断是否为合法的用户名
// 用户名只能包含字母、数字、下划线和连字符，长度在 2 到 36 个字符之间
export function isUsername(str: string): boolean {
    return /^[a-zA-Z0-9_-]{2,36}$/.test(str)
}

// 判断是否为邮箱。
// 使用严格模式，要求邮箱格式正确
export function isEmail(str: string): boolean {
    return $isEmail(str, {
        allow_utf8_local_part: true, // 允许本地部分使用 UTF-8 字符
        require_tld: true, // 要求顶级域名
        ignore_max_length: false, // 不忽略最大长度限制
        allow_ip_domain: false, // 不允许 IP 地址作为域名
        domain_specific_validation: false, // 不启用特定域名的额外验证
        allow_underscores: false, // 不允许下划线
    })
}

// 判断是否为手机号。
// 这里使用 'any' 作为语言选项，允许所有国家的手机号格式
// 如果需要特定国家的手机号格式，可以替换 'any' 为具体的国家
// 例如 'zh-CN' 表示中国手机号格式
export function isPhone(str: string): boolean {
    return isMobilePhone(str, 'any', {
        strictMode: false, // 不使用严格模式
    })
}

// 用户名验证函数
// 返回 true 表示用户名符合规范，false 表示不符合规范
// 规范：只能包含字母、数字、下划线和连字符，长度在 3 到 36 个字符之间
// 禁止使用邮箱格式和手机号格式
export function usernameValidator(name: string): boolean {
    if (!isUsername(name)) {
        // 用户名不符合规范
        return false
    }
    if (isEmail(name)) {
        // 禁止邮箱格式
        return false
    }
    if (isPhone(name)) {
        // 禁止手机号格式
        return false
    }
    return true
}
