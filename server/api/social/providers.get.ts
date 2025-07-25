import { SocialProvider } from '@/types/social'
import {
    ANONYMOUS_LOGIN_ENABLED,
    GITHUB_CLIENT_ID,
    GOOGLE_CLIENT_ID,
    MICROSOFT_CLIENT_ID,
    DISCORD_CLIENT_ID,
    APPLE_CLIENT_ID,
    TWITTER_CLIENT_ID,
    WEIBO_CLIENT_ID,
    QQ_CLIENT_ID,
    WECHAT_CLIENT_ID,
    DOUYIN_CLIENT_ID,
} from '@/utils/env'

// 所有第三方登录的元数据
const allProviders: SocialProvider[] = [
    {
        provider: 'anonymous',
        name: '匿名',
        icon: 'mdi mdi-lock',
        color: '#718096',
        anonymous: true, // 匿名登录
        label: '一键匿名登录',
        tooltip: '匿名登录无需填写用户名、密码、邮箱即可直接登录',
        enabled: !!ANONYMOUS_LOGIN_ENABLED,
    },
    {
        name: 'Github',
        provider: 'github',
        color: '#24292e',
        social: true, // 使用内置的第三方社交登录
        enabled: !!GITHUB_CLIENT_ID,
    },
    {
        name: 'Google',
        provider: 'google',
        color: '#4285f4',
        social: true,
        enabled: !!GOOGLE_CLIENT_ID,
    },
    {
        name: 'Microsoft',
        provider: 'microsoft',
        color: '#0078d4',
        social: true,
        enabled: !!MICROSOFT_CLIENT_ID,
    },
    {
        name: 'Apple',
        provider: 'apple',
        color: '#000000',
        social: true,
        icon: 'mdi mdi-apple',
        enabled: !!APPLE_CLIENT_ID,
    },
    {
        name: 'Twitter(X)',
        provider: 'twitter',
        color: '#1da1f2',
        social: true,
        icon: 'mdi mdi-twitter',
        enabled: !!TWITTER_CLIENT_ID,
    },
    {
        name: 'Discord',
        provider: 'discord',
        color: '#7289da',
        social: true,
        icon: 'iconfont icon-discord-simple',
        enabled: !!DISCORD_CLIENT_ID,
    },
    {
        name: '微信',
        provider: 'wechat',
        color: '#07c160',
        icon: 'mdi mdi-wechat',
        oauth2: true,
        enabled: !!WECHAT_CLIENT_ID,
    },
    {
        name: 'QQ',
        provider: 'qq',
        color: '#ea1b26',
        icon: 'mdi mdi-qqchat',
        oauth2: true,
        enabled: !!QQ_CLIENT_ID,
    },
    {
        name: '抖音',
        provider: 'douyin',
        color: '#fe2c55',
        icon: 'iconfont icon-douyin',
        oauth2: true,
        tooltip: '这里的抖音是抖音国内版，不是TikTok(抖音国际版)',
        enabled: !!DOUYIN_CLIENT_ID,
    },
    {
        name: '微博',
        provider: 'weibo',
        color: '#fbad27',
        icon: 'mdi mdi-sina-weibo',
        oauth2: true, // 使用自定义第三方 OAuth2 登录
        enabled: !!WEIBO_CLIENT_ID,
    },
]

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    const includeDisabled = url.searchParams.get('includeDisabled') === 'true'

    return {
        status: 200,
        success: true,
        providers: includeDisabled ? allProviders : allProviders.filter((provider) => provider.enabled),
    }
})
