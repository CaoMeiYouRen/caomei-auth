/**
 * 社交平台品牌色统一定义
 *
 * 这个文件包含所有社交平台的官方品牌色定义，
 * 确保在前端和后端代码中使用一致的颜色值。
 *
 * 颜色值来源于各平台官方品牌指南。
 */

export interface SocialColor {
    /** 平台标识 */
    provider: string
    /** 平台名称 */
    name: string
    /** 品牌主色 */
    color: string
    /** 品牌色（暗色主题） */
    darkColor?: string
    /** 品牌色来源/更新日期 */
    source?: string
}

/**
 * 社交平台品牌色定义
 * 按字母顺序排列，便于维护
 */
export const socialColors: Record<string, SocialColor> = {
    anonymous: {
        provider: 'anonymous',
        name: '匿名',
        color: '#718096', // 使用默认色
    },
    apple: {
        provider: 'apple',
        name: 'Apple',
        color: '#000000',
        darkColor: '#ffffff',
        source: 'Apple Brand Guidelines 2024',
    },
    discord: {
        provider: 'discord',
        name: 'Discord',
        color: '#5865f2', // Discord 官方新品牌色（2021年更新）
        source: 'Discord Brand Guidelines 2024',
    },
    douyin: {
        provider: 'douyin',
        name: '抖音',
        color: '#fe2c55',
        source: '抖音开放平台品牌指南',
    },
    facebook: {
        provider: 'facebook',
        name: 'Facebook',
        color: '#1877f2',
        darkColor: '#ffffff',
        source: 'Meta Brand Guidelines 2024',
    },
    github: {
        provider: 'github',
        name: 'GitHub',
        color: '#24292e',
        darkColor: '#ffffff',
        source: 'GitHub Brand Guidelines 2024',
    },
    google: {
        provider: 'google',
        name: 'Google',
        color: '#4285f4',
        source: 'Google Identity Guidelines 2024',
    },
    microsoft: {
        provider: 'microsoft',
        name: 'Microsoft',
        color: '#0078d4',
        source: 'Microsoft Brand Guidelines 2024',
    },
    qq: {
        provider: 'qq',
        name: 'QQ',
        color: '#ea1c26',
        source: 'QQ 互联平台品牌指南',
    },
    twitter: {
        provider: 'twitter',
        name: 'Twitter(X)',
        color: '#1da1f2', // 保留 Twitter 蓝色（用于向后兼容）
        source: 'Twitter Brand Guidelines（历史版本）',
    },
    wechat: {
        provider: 'wechat',
        name: '微信',
        color: '#07c160',
        source: '微信开放平台设计指南',
    },
    weibo: {
        provider: 'weibo',
        name: '微博',
        color: '#ff8140', // 微博官方橙色（更新为最新版本）
        source: '微博开放平台品牌指南',
    },
}

/**
 * 获取社交平台品牌色
 * @param provider 平台标识
 * @param theme 主题模式（light/dark）
 * @returns 品牌色值
 */
export function getSocialColor(provider: string, theme: 'light' | 'dark' = 'light'): string {
    const colorData = socialColors[provider]
    if (!colorData) {
        return '#718096' // 默认色
    }

    if (theme === 'dark' && colorData.darkColor) {
        return colorData.darkColor
    }

    return colorData.color
}

/**
 * 获取所有社交平台颜色的 CSS 变量映射
 * @returns CSS 变量对象
 */
export function getSocialColorCSSVars(): Record<string, string> {
    const vars: Record<string, string> = {}

    Object.values(socialColors).forEach(({ provider, color, darkColor }) => {
        vars[`--color-${provider}`] = color
        if (darkColor) {
            vars[`--color-${provider}-dark`] = darkColor
        }
    })

    return vars
}

/**
 * 获取社交平台品牌色的 SCSS 变量字符串
 * @returns SCSS 变量定义
 */
export function getSocialColorSCSS(): string {
    const lines: string[] = ['// 社交平台品牌色（自动生成，请勿手动修改）']

    Object.values(socialColors).forEach(({ provider, name, color, darkColor, source }) => {
        lines.push(`$color-${provider}: ${color}; // ${name}${source ? ` - ${source}` : ''}`)
        if (darkColor) {
            lines.push(`$color-${provider}-dark: ${darkColor}; // ${name} (Dark Theme)`)
        }
    })

    return lines.join('\n')
}

/**
 * 验证颜色值是否为有效的十六进制颜色
 * @param color 颜色值
 * @returns 是否有效
 */
export function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * 默认社交平台颜色（用于未定义的平台）
 */
export const DEFAULT_SOCIAL_COLOR = '#718096'
