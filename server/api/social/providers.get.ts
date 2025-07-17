import { SocialProvider } from '@/types/social'

export default defineEventHandler(async (event) => ({
    status: 200,
    success: true,
    providers: [
        process.env.ANONYMOUS_LOGIN_ENABLED === 'true' && {
            provider: 'anonymous',
            name: '匿名',
            icon: 'mdi mdi-lock',
            anonymous: true, // 匿名登录
            label: '一键匿名登录',
            tooltip: '匿名登录无需填写用户名、密码、邮箱即可直接登录',
        } as SocialProvider,
        process.env.GITHUB_CLIENT_ID && {
            name: 'Github',
            provider: 'github',
            social: true, // 使用内置的第三方社交登录
        } as SocialProvider,
        process.env.GOOGLE_CLIENT_ID && {
            name: 'Google',
            provider: 'google',
            social: true,
        } as SocialProvider,
        process.env.MICROSOFT_CLIENT_ID && {
            name: 'Microsoft',
            provider: 'microsoft',
            social: true,
        } as SocialProvider,
        process.env.DISCORD_CLIENT_ID && {
            name: 'Discord',
            provider: 'discord',
            social: true,
        } as SocialProvider,
        process.env.WEIBO_CLIENT_ID && {
            name: '微博',
            provider: 'weibo',
            icon: 'mdi mdi-sina-weibo',
            oauth2: true, // 使用自定义第三方 OAuth2 登录
        } as SocialProvider,
        process.env.QQ_CLIENT_ID && {
            name: 'QQ',
            provider: 'qq',
            icon: 'mdi mdi-qqchat',
            oauth2: true,
        } as SocialProvider,
    ].filter(Boolean) as SocialProvider[],
}))
