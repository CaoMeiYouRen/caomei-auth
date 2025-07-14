import isEmail from 'validator/es/lib/isEmail'
import isMobilePhone from 'validator/es/lib/isMobilePhone'
import isStrongPassword from 'validator/es/lib/isStrongPassword'

// 判断是否为邮箱。
export function validateEmail(email: string): boolean {
    return isEmail(email, {
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
export function validatePhone(phone: string, locale: 'any' | validator.MobilePhoneLocale | validator.MobilePhoneLocale[] = 'any'): boolean {
    return isMobilePhone(phone, locale, {
        strictMode: true, // 使用严格模式。开头必须有 + 号
    })
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
export function validateUsername(str: string): boolean {
    return /^[a-zA-Z0-9_-]{2,36}$/.test(str)
}

// 用户名验证函数
// 返回 true 表示用户名符合规范，false 表示不符合规范
// 规范：只能包含字母、数字、下划线和连字符，长度在 2 到 36 个字符之间
// 禁止使用邮箱格式和手机号格式
export function usernameValidator(name: string): boolean {
    if (!validateUsername(name)) {
        // 用户名不符合规范
        return false
    }
    if (validateEmail(name)) {
        // 禁止邮箱格式
        return false
    }
    if (validatePhone(name)) {
        // 禁止手机号格式
        return false
    }
    return true
}

/**
 * 验证密码强度
 *
 * @author CaoMeiYouRen
 * @date 2025-07-14
 * @export
 * @param password
 */
export function passwordValidator(password: string): boolean {
    return isStrongPassword(password, {
        minLength: 8, // 密码最小长度
        minLowercase: 1, // 密码必须包含小写字母
        minUppercase: 1, // 密码必须包含大写字母
        minNumbers: 1, // 密码必须包含数字
        minSymbols: 1, // 密码必须包含特殊字符
    })
}

// 昵称验证函数
// 长度 2-36 个字符，仅对特殊字符做限制
// 限制的特殊字符有：零宽字符、字符方向控制符、有可能引起页面排版错误的字符、有可能引起数据库存储错误的字符
export function nicknameValidator(nickname: string): boolean {
    /**
    * 正则表达式解释：
    * ^ ：匹配字符串的开始位置。
    * [^\u0000-\u001F\u0020\u007F-\u009F\u00A0-\u00FF] ：
    *     这是一个否定字符类，表示匹配不在指定范围内的任意字符。
    *     \u0000-\u001F ：控制字符范围，包含 ASCII 码 0 - 31 的字符，如换行符、制表符等。
    *     \u0020 ：空格字符，ASCII 码为 32。
    *     \u007F-\u009F ：包含删除字符（ASCII 码 127）以及一些控制字符。
    *     \u00A0-\u00FF ：包含非断行空格（ASCII 码 160）以及一些拉丁字母扩展字符。
    * {2,36} ：限定前面字符类匹配的次数，最少 2 次，最多 36 次。
    * $ ：匹配字符串的结束位置。
    * 综合起来，该正则表达式要求字符串长度在 2 到 36 个字符之间，且不包含指定的特殊字符。
    */
    // eslint-disable-next-line no-control-regex
    return /^[^\u0000-\u001F\u0020\u007F-\u009F\u00A0-\u00FF]{2,36}$/.test(nickname)
}
