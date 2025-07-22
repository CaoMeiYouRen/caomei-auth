import { SocialProvider } from '@/types/social'
import {
    ANONYMOUS_LOGIN_ENABLED,
    GITHUB_CLIENT_ID,
    GOOGLE_CLIENT_ID,
    MICROSOFT_CLIENT_ID,
    DISCORD_CLIENT_ID,
    WEIBO_CLIENT_ID,
    QQ_CLIENT_ID,
} from '@/utils/env'

export default defineEventHandler(async (event) => ({
    status: 200,
    success: true,
    providers: [
        ANONYMOUS_LOGIN_ENABLED && {
            provider: 'anonymous',
            name: '匿名',
            icon: 'mdi mdi-lock',
            color: '#718096',
            anonymous: true, // 匿名登录
            label: '一键匿名登录',
            tooltip: '匿名登录无需填写用户名、密码、邮箱即可直接登录',
        } as SocialProvider,
        GITHUB_CLIENT_ID && {
            name: 'Github',
            provider: 'github',
            color: '#24292e',
            social: true, // 使用内置的第三方社交登录
        } as SocialProvider,
        GOOGLE_CLIENT_ID && {
            name: 'Google',
            provider: 'google',
            color: '#4285f4',
            social: true,
        } as SocialProvider,
        MICROSOFT_CLIENT_ID && {
            name: 'Microsoft',
            provider: 'microsoft',
            color: '#0078d4',
            social: true,
        } as SocialProvider,
        DISCORD_CLIENT_ID && {
            name: 'Discord',
            provider: 'discord',
            color: '#7289da',
            social: true,
            icon: 'iconfont icon-discord-simple',
        } as SocialProvider,
        WEIBO_CLIENT_ID && {
            name: '微博',
            provider: 'weibo',
            color: '#fbad27',
            icon: 'mdi mdi-sina-weibo',
            oauth2: true, // 使用自定义第三方 OAuth2 登录
        } as SocialProvider,
        QQ_CLIENT_ID && {
            name: 'QQ',
            provider: 'qq',
            color: '#ea1b26',
            icon: 'mdi mdi-qqchat',
            oauth2: true,
        } as SocialProvider,
    ].filter(Boolean) as SocialProvider[],
}))
