/**
 * 社交平台提供商辅助工具函数
 * 用于统一处理社交平台的显示名称、图标、颜色等信息
 */

import { getSocialColor, socialColors } from './social-colors'

/**
 * 社交平台提供商信息映射
 */
const providerInfoMap = {
    // 登录方式
    email: {
        name: '邮箱登录',
        icon: 'mdi mdi-email',
        color: 'var(--color-default)',
    },
    credential: {
        name: '密码登录',
        icon: 'mdi mdi-key',
        color: 'var(--color-default)',
    },
    username: {
        name: '用户名登录',
        icon: 'mdi mdi-account',
        color: 'var(--color-default)',
    },
    phone: {
        name: '手机登录',
        icon: 'mdi mdi-phone',
        color: 'var(--color-default)',
    },
    // 社交平台（基于 socialColors 动态生成）
    ...Object.fromEntries(
        Object.entries(socialColors).map(([key, value]) => [
            key,
            {
                name: value.name,
                icon: getDefaultIcon(key),
                color: `var(--color-${key})`,
            },
        ]),
    ),
} as const

/**
 * 获取默认图标映射
 */
function getDefaultIcon(provider: string): string {
    const iconMap: Record<string, string> = {
        github: 'mdi mdi-github',
        google: 'mdi mdi-google',
        microsoft: 'mdi mdi-microsoft',
        apple: 'mdi mdi-apple',
        twitter: 'mdi mdi-twitter',
        discord: 'iconfont icon-discord-simple',
        facebook: 'mdi mdi-facebook',
        wechat: 'mdi mdi-wechat',
        qq: 'mdi mdi-qqchat',
        douyin: 'iconfont icon-douyin',
        weibo: 'mdi mdi-sina-weibo',
        anonymous: 'mdi mdi-incognito',
    }
    return iconMap[provider] || 'mdi mdi-account'
}

/**
 * 获取提供商显示名称
 * @param provider 提供商标识
 * @returns 显示名称
 */
export function getProviderName(provider: string): string {
    return (providerInfoMap as any)[provider]?.name || provider
}

/**
 * 获取提供商图标
 * @param provider 提供商标识
 * @returns 图标类名
 */
export function getProviderIcon(provider: string): string {
    return (providerInfoMap as any)[provider]?.icon || 'mdi mdi-account'
}

/**
 * 获取提供商颜色（CSS 变量形式）
 * @param provider 提供商标识
 * @returns CSS 变量字符串
 */
export function getProviderColor(provider: string): string {
    return (providerInfoMap as any)[provider]?.color || 'var(--color-default)'
}

/**
 * 获取提供商的完整信息
 * @param provider 提供商标识
 * @returns 提供商信息对象
 */
export function getProviderInfo(provider: string) {
    const info = (providerInfoMap as any)[provider]
    return info || {
        name: provider,
        icon: 'mdi mdi-account',
        color: 'var(--color-default)',
    }
}

/**
 * 检查是否为社交登录提供商
 * @param provider 提供商标识
 * @returns 是否为社交登录
 */
export function isSocialProvider(provider: string): boolean {
    return provider in socialColors
}

/**
 * 获取所有支持的提供商列表
 * @returns 提供商标识数组
 */
export function getAllProviders(): string[] {
    return Object.keys(providerInfoMap)
}
