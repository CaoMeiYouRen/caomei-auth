import type { GenericOAuthConfig } from 'better-auth/plugins'
import { getTempEmail } from '@/server/utils/auth-generators'
import { generateRandomString } from '@/utils/shared/random'
import {
    WEIBO_CLIENT_ID,
    WEIBO_CLIENT_SECRET,
    WEIBO_SCOPES,
    WECHAT_CLIENT_ID,
    WECHAT_CLIENT_SECRET,
    QQ_CLIENT_ID,
    QQ_CLIENT_SECRET,
    QQ_USE_UNIONID,
    DOUYIN_CLIENT_ID,
    DOUYIN_CLIENT_SECRET,
} from '@/utils/shared/env'

/**
 * genericOAuth 提供商配置（微博 / 微信 / QQ / 抖音）。
 *
 * 从 `lib/auth.ts` 拆出以控制单文件规模；配置本身不依赖 better-auth 实例。
 */
export const GENERIC_OAUTH_CONFIG: GenericOAuthConfig[] = [
    {
        providerId: 'weibo',
        clientId: WEIBO_CLIENT_ID!,
        clientSecret: WEIBO_CLIENT_SECRET!,
        authorizationUrl: 'https://api.weibo.com/oauth2/authorize',
        tokenUrl: 'https://api.weibo.com/oauth2/access_token',
        userInfoUrl: 'https://api.weibo.com/2/users/show.json',
        // 由于微博获取邮箱的接口需要单独申请，故此处不默认申请 email
        scopes: ['follow_app_official_microblog', ...WEIBO_SCOPES].filter(Boolean),
        pkce: false,
        // 自定义获取用户信息逻辑
        getUserInfo: async (tokens) => {
            // 先获取用户 UID
            const uidResponse = await fetch(`https://api.weibo.com/2/account/get_uid.json?access_token=${tokens.accessToken}`, {
                method: 'GET',
            })
            const uidData = await uidResponse.json()
            const uid = uidData.uid

            if (!uid) {
                throw new Error('Failed to get user UID from Weibo')
            }

            const response = await fetch(`https://api.weibo.com/2/users/show.json?access_token=${tokens.accessToken}&uid=${uid}`, {
                method: 'GET',
            })
            const userInfo = await response.json()
            return {
                id: userInfo.idstr,
                // 微博接口未返回 email，默认设为临时邮箱
                email: userInfo.email || getTempEmail(),
                name: userInfo.screen_name || `微博用户-${generateRandomString(8)}`,
                // 使用大图头像地址
                image: userInfo.avatar_large || null,
                // 由于微博接口未返回邮箱验证状态，默认设为 false，若有 email 则假设已验证
                emailVerified: !!userInfo.email,
                // 使用用户注册时间作为 createdAt
                createdAt: new Date(userInfo.created_at),
                // 由于微博接口未提供用户更新时间，设为当前时间
                updatedAt: new Date(),

            }
        },
    },
    {
        providerId: 'wechat',
        clientId: WECHAT_CLIENT_ID!,
        clientSecret: WECHAT_CLIENT_SECRET!,
        authorizationUrl: 'https://open.weixin.qq.com/connect/qrconnect',
        tokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
        userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo',
        scopes: ['snsapi_login'],
        pkce: false,
        tokenUrlParams: {
            grant_type: 'authorization_code',
        },
        authorizationUrlParams: {
            response_type: 'code',
            // 微信登录页面语言设置，cn为中文简体，en为英文
            lang: 'cn',
        },
        // 自定义获取用户信息逻辑
        getUserInfo: async (tokens) => {
            // 微信的token响应包含额外的openid字段，需要从原始响应中获取
            // 微信token响应格式：
            // {
            //   "access_token": "ACCESS_TOKEN",
            //   "expires_in": 7200,
            //   "refresh_token": "REFRESH_TOKEN",
            //   "openid": "OPENID",
            //   "scope": "SCOPE",
            //   "unionid": "UNIONID"
            // }

            const openid = tokens?.raw?.openid

            if (!openid) {
                throw new Error('Failed to get WeChat openid')
            }

            // 检查 access_token 是否有效
            const authResponse = await fetch(
                `https://api.weixin.qq.com/sns/auth?access_token=${tokens.accessToken}&openid=${openid}`,
            )
            const authData = await authResponse.json()

            if (authData.errcode && authData.errcode !== 0) {
                throw new Error(`WeChat auth check failed: ${authData.errmsg}`)
            }

            // 获取用户基本信息
            const userInfoResponse = await fetch(
                `https://api.weixin.qq.com/sns/userinfo?access_token=${tokens.accessToken}&openid=${openid}&lang=zh_CN`,
            )
            const userInfo = await userInfoResponse.json()

            if (userInfo.errcode && userInfo.errcode !== 0) {
                throw new Error(`Failed to get WeChat user info: ${userInfo.errmsg}`)
            }

            return {
                // 优先使用 unionid，如果没有则使用 openid
                id: userInfo.unionid || openid,
                // 微信不提供邮箱，使用临时邮箱
                email: getTempEmail(),
                name: userInfo.nickname || `微信用户-${generateRandomString(8)}`,
                // 用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像）
                image: userInfo.headimgurl || null,
                // 微信未返回邮箱，设为未验证
                emailVerified: false,
                // 微信不提供注册时间，设为当前时间
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        },
    },
    {
        providerId: 'qq',
        clientId: QQ_CLIENT_ID!,
        clientSecret: QQ_CLIENT_SECRET!,
        authorizationUrl: 'https://graph.qq.com/oauth2.0/authorize',
        tokenUrl: 'https://graph.qq.com/oauth2.0/token',
        userInfoUrl: 'https://graph.qq.com/user/get_user_info',
        scopes: ['get_user_info'],
        responseType: 'code',
        pkce: false,
        tokenUrlParams: {
            fmt: 'json', // 需要指定 fmt 才能返回 json 格式
        },
        getUserInfo: async (tokens) => {
            // console.log(tokens)
            // 是否获取 unionid。需要获取 getUnionId 接口权限
            const $unionid = QQ_USE_UNIONID ? '1' : ''
            // 获取 openid
            const openidResponse = await fetch(
                `https://graph.qq.com/oauth2.0/me?access_token=${tokens.accessToken}&unionid=${$unionid}&fmt=json`,
            )
            const openidJson = await openidResponse.json()
            // console.log(openidJson)
            const openid = openidJson?.openid || ''
            const unionid = openidJson?.unionid || ''

            if (!openid) {
                throw new Error('Failed to get openid')
            }
            // 获取用户信息
            const userInfoResponse = await fetch(
                `https://graph.qq.com/user/get_user_info?access_token=${tokens.accessToken}&oauth_consumer_key=${QQ_CLIENT_ID}&openid=${openid}`,
            )
            const userInfo = await userInfoResponse.json()

            return {
                id: unionid || openid, // 如果有 unionid 则使用 unionid，否则使用 openid
                // QQ 不返回 email ，设为临时邮箱
                email: getTempEmail(),
                // 用户在QQ空间的昵称。
                name: userInfo.nickname || `QQ用户-${generateRandomString(8)}`,
                // 大小为100×100像素的QQ头像URL 或 大小为40×40像素的QQ头像URL
                image: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1,
                // 由于 QQ 接口未返回邮箱验证状态，默认设为 false
                emailVerified: false,
                // 由于 QQ 接口未提供用户注册时间，设为当前时间
                createdAt: new Date(),
                // 由于 QQ 接口未提供用户更新时间，设为当前时间
                updatedAt: new Date(),
            }
        },
    },
    {
        providerId: 'douyin',
        clientId: DOUYIN_CLIENT_ID!,
        clientSecret: DOUYIN_CLIENT_SECRET!,
        authorizationUrl: 'https://open.douyin.com/platform/oauth/connect',
        tokenUrl: 'https://open.douyin.com/oauth/access_token/',
        userInfoUrl: 'https://open.douyin.com/oauth/userinfo/',
        scopes: ['user_info'],
        responseType: 'code',
        pkce: false,
        authorizationUrlParams: {
            response_type: 'code',
            // 授权时使用 client_key
            client_key: DOUYIN_CLIENT_ID!,
        },
        tokenUrlParams: {
            grant_type: 'authorization_code',
            // token 获取时使用 client_key 和 client_secret
            client_key: DOUYIN_CLIENT_ID!,
            client_secret: DOUYIN_CLIENT_SECRET!,
        },
        getUserInfo: async (tokens) => {
            // 抖音的 token 响应格式：
            // {
            //   "access_token": "act.xxxxx",
            //   "open_id": "xxxxx",
            //   "scope": "user_info",
            //   "expires_in": 86400,
            //   "refresh_token": "rft.xxxxx",
            //   "refresh_expires_in": 86400
            // }

            // 从 tokens 中获取 open_id
            // better-auth 应该会将完整的 token 响应传递给 getUserInfo
            const openId = tokens?.raw?.open_id

            if (!openId) {
                throw new Error('Failed to get open_id from token response')
            }

            // 调用抖音用户信息接口
            const userResponse = await fetch(
                'https://open.douyin.com/oauth/userinfo/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        access_token: tokens.accessToken,
                        open_id: openId,
                    }),
                },
            )

            if (!userResponse.ok) {
                throw new Error(`抖音用户信息获取失败: ${userResponse.status} ${userResponse.statusText}`)
            }

            const userData = await userResponse.json()

            // 检查响应错误码
            if (userData.err_no !== 0) {
                throw new Error(`抖音用户信息 API 错误: ${userData.err_msg} (错误码: ${userData.err_no})`)
            }

            const userInfo = userData.data

            return {
                // 优先使用 union_id，如果没有则使用 open_id
                id: userInfo.union_id || userInfo.open_id,
                // 抖音不提供邮箱信息，使用临时邮箱
                email: getTempEmail(),
                name: userInfo.nickname || `抖音用户-${generateRandomString(8)}`,
                image: userInfo.avatar || null,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        },
    },
]
