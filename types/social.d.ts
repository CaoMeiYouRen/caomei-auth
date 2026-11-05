export interface SocialProvider {
    name: string
    provider: string
    social?: boolean
    oauth2?: boolean
    icon?: string
    color?: string
    /** 暗色主题下的品牌色（用于 SSR 安全的 CSS 变量切换） */
    colorDark?: string
    anonymous?: boolean
    label?: string
    tooltip?: string
    enabled?: boolean
}
