import { betterAuth, type SecondaryStorage } from 'better-auth'
import {
    username,
    anonymous,
    magicLink,
    emailOTP,
    openAPI,
    phoneNumber as $phoneNumber,
    admin,
    captcha,
    genericOAuth,
    twoFactor,
    oidcProvider,
} from 'better-auth/plugins'
import ms from 'ms'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { sendEmail } from '@/server/utils/email'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { usernameValidator, validatePhone } from '@/utils/validate'
import { sendPhoneOtp } from '@/server/utils/phone'
import { secondaryStorage } from '@/server/database/storage'
import {
    EMAIL_EXPIRES_IN,
    PHONE_EXPIRES_IN,
    ANONYMOUS_EMAIL_DOMAIN_NAME,
    AUTH_SECRET,
    ADMIN_USER_IDS as ENV_ADMIN_USER_IDS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET,
    APPLE_APP_BUNDLE_IDENTIFIER,
    TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET,
    WEIBO_CLIENT_ID,
    WEIBO_CLIENT_SECRET,
    WEIBO_SCOPES,
    QQ_CLIENT_ID,
    QQ_CLIENT_SECRET,
    QQ_USE_UNIONID,
    WECHAT_APP_ID,
    WECHAT_APP_SECRET,
    DOUYIN_CLIENT_KEY,
    DOUYIN_CLIENT_SECRET,
    AUTH_BASE_URL,
    APP_NAME,
} from '@/utils/env'
import type { User } from '@/server/entities/user'
import { generateRandomString } from '@/server/utils/random'
import { getTempEmail, getTempName, generateClientId, generateClientSecret } from '@/server/utils/auth-generators'

const ADMIN_USER_IDS = ENV_ADMIN_USER_IDS

// TODO 增加注册验证码
export const auth = betterAuth({
    appName: APP_NAME, // 应用名称。它将被用作发行者。
    // 数据库适配器
    // 使用 TypeORM 适配器
    database: typeormAdapter(dataSource),
    // 可信来源列表。
    trustedOrigins: [AUTH_BASE_URL],
    // 用于加密、签名和哈希的秘密。
    secret: AUTH_SECRET,
    advanced: {
        database: {
            // 自定义 ID 生成逻辑
            // 通过雪花算法 生成一个 16 进制的 ID
            generateId: (options) => snowflake.generateId(),
        },
    },
    rateLimit: {
        window: 60, // time window in seconds
        max: 60, // max requests in the window
        storage: secondaryStorage ? 'secondary-storage' : 'memory', // 如果配置了 Redis，则使用二级存储；否则使用内存存储
        customRules: {
            '/sign-in/*': { window: 60, max: 3 },
            '/email-otp/*': { window: 60, max: 3 },
            '/phone-number/*': { window: 60, max: 3 },
            '/sign-up/*': { window: 60, max: 3 },
            '/sign-out': { window: 60, max: 3 },
            '/magic-link': { window: 60, max: 3 },
            '/forget-password': { window: 60, max: 3 },
            '/forget-password/*': { window: 60, max: 3 },
            '/request-password-reset': { window: 60, max: 3 },
            '/reset-password': { window: 60, max: 3 },
            '/send-verification-email': { window: 60, max: 3 },
            '/change-email': { window: 60, max: 3 },
            '/delete-user': { window: 60, max: 2 },
            '/get-session': { window: 60, max: 10 },
            '/admin/*': { window: 60, max: 10 },
            '/two-factor/*': { window: 60, max: 3 },
            '/oauth2/*': { window: 60, max: 3 },
            // '/*': (req) => { // 基础限流
            //     return { window: 60, max: 10 }
            // },
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        maxPasswordLength: 64,
        sendResetPassword: async ({ user, url, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: '重置您的密码',
                text: `点击链接重置您的密码：${url}`,
            })
        },
    },
    emailVerification: {
        sendOnSignUp: true, // 注册时发送验证邮件
        autoSignInAfterVerification: true, // 验证后自动登录
        // 发送验证邮件
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: '验证你的邮箱地址',
                text: `点击链接验证你的邮箱：${url}`,
            })
        },
    },
    user: {
        changeEmail: {
            enabled: true, // 启用更改邮箱功能
            // 发送更改邮箱验证邮件
            sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
                await sendEmail({
                    to: user.email, // 验证邮件必须发送到当前用户邮箱以批准更改
                    subject: '批准邮箱更改',
                    text: `您即将修改为新邮箱地址是 ${newEmail}，请点击链接以批准更改：${url}`,
                })
            },
        },
    },
    account: {
        accountLinking: {
            enabled: true, // 启用账户关联
            allowDifferentEmails: true, // 允许用户绑定不同邮箱地址的账号；允许不返回邮箱地址的第三方登录（微博、抖音等）
        },
    },
    socialProviders: {
        github: { // 支持 GitHub 登录
            clientId: GITHUB_CLIENT_ID as string,
            clientSecret: GITHUB_CLIENT_SECRET as string,
        },
        google: { // 支持 Google 登录
            clientId: GOOGLE_CLIENT_ID as string,
            clientSecret: GOOGLE_CLIENT_SECRET as string,
        },
        microsoft: { // 支持 Microsoft 登录
            clientId: MICROSOFT_CLIENT_ID as string,
            clientSecret: MICROSOFT_CLIENT_SECRET as string,
            // 可选配置
            tenantId: 'common',
            requireSelectAccount: true,
        },
        discord: { // 支持 Discord 登录
            clientId: DISCORD_CLIENT_ID as string,
            clientSecret: DISCORD_CLIENT_SECRET as string,
        },
        apple: { // 支持 Apple 登录
            clientId: APPLE_CLIENT_ID as string,
            clientSecret: APPLE_CLIENT_SECRET as string,
            appBundleIdentifier: APPLE_APP_BUNDLE_IDENTIFIER as string,
        },
        twitter: { // 支持 Twitter 登录
            clientId: TWITTER_CLIENT_ID as string,
            clientSecret: TWITTER_CLIENT_SECRET as string,
        },
    },
    session: {
        expiresIn: ms('30d') / 1000, // 30 天
        updateAge: ms('1d') / 1000, // 1 天（每 1 天更新会话过期时间）
        freshAge: ms('1d') / 1000, // 会话新鲜度
        // 当 cookie 的值太大时，会使缓存报错，故暂时禁用
        // cookieCache: {
        //     enabled: true,
        //     maxAge: 300, // 缓存持续时间（秒）
        // },
        storeSessionInDatabase: true, // 当提供辅助存储时，是否在数据库中存储会话
        preserveSessionInDatabase: false, // 当从辅助存储中删除时，是否保留数据库中的会话记录
    },
    plugins: [
        username({
            minUsernameLength: 2, // 最小用户名长度
            maxUsernameLength: 36, // 最大用户名长度
            usernameValidator,
        }), // 支持用户名登录
        anonymous({
            // 支持匿名登录
            emailDomainName: ANONYMOUS_EMAIL_DOMAIN_NAME, // 匿名用户的默认电子邮件域名
            onLinkAccount: async ({ anonymousUser, newUser }) => {
                // 执行操作，如将购物车项目从匿名用户移动到新用户
                // console.log('Linking anonymous user to new user:', anonymousUser, newUser)
                // 手动将匿名用户的数据关联到新用户
            },
        }),
        magicLink({
            expiresIn: EMAIL_EXPIRES_IN, // 链接有效期（秒）
            disableSignUp: false, // 当用户未注册时是否阻止自动注册
            // 支持一次性链接登录
            sendMagicLink: async ({ email, token, url }, request) => {
                await sendEmail({
                    to: email,
                    subject: '您的登录链接',
                    text: `点击此链接登录：${url}`,
                })
            },
        }),
        emailOTP({
            disableSignUp: false, // 当用户未注册时是否阻止自动注册
            otpLength: 6, // OTP 验证码长度
            expiresIn: EMAIL_EXPIRES_IN, // OTP 验证码有效期（秒）
            allowedAttempts: 3, // 允许的 OTP 验证尝试次数
            sendVerificationOnSignUp: false, // 用户注册时是否发送 OTP。因为已经发送验证邮件，所以不需要再发送 OTP。
            // 支持电子邮件 OTP 登录
            async sendVerificationOTP({ email, otp, type }) {
                if (type === 'sign-in') {
                    // 发送登录用的OTP
                    await sendEmail({
                        to: email,
                        subject: '您的登录验证码',
                        text: `您的验证码是：${otp}`,
                    })
                    return
                }
                if (type === 'email-verification') {
                    // 发送电子邮件验证用的OTP
                    await sendEmail({
                        to: email,
                        subject: '验证您的电子邮件地址',
                        text: `您的验证码是：${otp}`,
                    })
                    return
                }
                if (type === 'forget-password') {
                    // 发送密码重置用的OTP
                    await sendEmail({
                        to: email,
                        subject: '重置您的密码',
                        text: `您的验证码是：${otp}`,
                    })
                    return
                }
                await sendEmail({
                    to: email,
                    subject: '您的一次性验证码',
                    text: `您的验证码是：${otp}`,
                })
            },
        }),
        $phoneNumber({
            otpLength: 6, // OTP 验证码长度
            expiresIn: PHONE_EXPIRES_IN, // OTP 验证码有效期（秒）
            allowedAttempts: 3, // 允许的 OTP 验证尝试次数
            requireVerification: true, // 是否要求手机号码验证，启用后，用户在验证手机号码之前无法使用手机号码登录。
            sendOTP: async ({ phoneNumber, code }, request) => {
                await sendPhoneOtp(phoneNumber, code)
            },
            callbackOnVerification: async ({ phoneNumber, user }, request) => {
                // 实现手机号码验证后的回调
            },
            // 验证手机号码格式
            phoneNumberValidator: (phoneNumber) => validatePhone(phoneNumber),
            signUpOnVerification: {
                // 使用雪花算法生成临时电子邮件地址
                // 生成的电子邮件地址格式为：<snowflake_id>@example.com
                getTempEmail: (_phoneNumber) => getTempEmail(),
                getTempName: (_phoneNumber) => getTempName(), // 使用雪花算法生成临时用户名
            },
        }),
        admin({
            defaultRole: 'user', // 默认角色为用户
            adminRoles: ['admin'], // 管理员角色列表 'root'
            adminUserIds: ADMIN_USER_IDS, // 管理员用户 ID 列表
        }), // 支持管理员插件
        openAPI({
            disableDefaultReference: process.env.NODE_ENV !== 'development', // 开发环境启用 OpenAPI 插件
        }),
        twoFactor({
            issuer: APP_NAME, // 发行者是应用程序的名称。它用于生成 TOTP 代码。它将显示在认证器应用程序中。
            // skipVerificationOnEnable: false, // 在为用户启用两因素之前跳过验证过程
            totpOptions: {
                digits: 6, // 验证码位数
                period: 30, // 验证码有效期（秒）。采用默认值以兼容部分不支持设置有效期的认证器应用程序
            },
            otpOptions: {
                period: 60, // 验证码有效期（秒）
                async sendOTP(data, request) {
                    const { otp } = data
                    const user = data.user as User
                    // 向用户发送 otp
                    if (user.emailVerified) {
                        sendEmail({
                            to: user.email,
                            subject: '您的一次性验证码',
                            text: `您的验证码是：${otp}。1分钟内有效。如果您没有请求此验证码，请忽略此邮件。`,
                        })
                        return
                    }
                    if ((user as User).phoneNumberVerified) {
                        await sendPhoneOtp(user.phoneNumber, otp, 60)
                        return
                    }
                    throw new Error('用户未验证邮箱或手机号，无法发送一次性验证码')
                },
            },
            backupCodeOptions: {
                length: 10, // 备份码长度
                amount: 10, // 备份码数量
            },
        }),
        genericOAuth({
            config: [
                {
                    providerId: 'weibo',
                    clientId: WEIBO_CLIENT_ID as string,
                    clientSecret: WEIBO_CLIENT_SECRET as string,
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
                    clientId: WECHAT_APP_ID as string,
                    clientSecret: WECHAT_APP_SECRET as string,
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
                        // TODO 修复 微信登录缺少 openid 的问题
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

                        const openid = ''
                        const unionid = ''

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
                            id: userInfo.unionid || unionid || userInfo.openid || openid,
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
                    clientId: QQ_CLIENT_ID as string,
                    clientSecret: QQ_CLIENT_SECRET as string,
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
                    clientId: DOUYIN_CLIENT_KEY as string,
                    clientSecret: DOUYIN_CLIENT_SECRET as string,
                    authorizationUrl: 'https://open.douyin.com/platform/oauth/connect',
                    tokenUrl: 'https://open.douyin.com/oauth/access_token/',
                    userInfoUrl: 'https://open.douyin.com/oauth/userinfo/',
                    scopes: ['user_info'],
                    responseType: 'code',
                    pkce: false,
                    authorizationUrlParams: {
                        response_type: 'code',
                        // 授权时使用 client_key
                        client_key: DOUYIN_CLIENT_KEY as string,
                    },
                    tokenUrlParams: {
                        grant_type: 'authorization_code',
                        // token 获取时使用 client_key 和 client_secret
                        client_key: DOUYIN_CLIENT_KEY as string,
                        client_secret: DOUYIN_CLIENT_SECRET as string,
                    },
                    getUserInfo: async (tokens) => {
                        // TODO 修复 抖音登录缺少 openid 的问题
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
                        const openId = (tokens as any).open_id || (tokens as any).openId

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
            ],
        }),
        oidcProvider({
            metadata: {
                issuer: AUTH_BASE_URL,
            },
            loginPage: '/login', // 登录页面的路径
            consentPage: '/oauth/consent', // 同意页面的路径
            allowDynamicClientRegistration: true, // 允许动态客户端注册
            generateClientId, // 动态生成客户端 ID
            generateClientSecret, // 动态生成客户端密钥
            getAdditionalUserInfoClaim: (user, scopes) => {
                const claims: Record<string, any> = {}

                // 根据请求的作用域添加声明
                if (scopes.includes('profile')) {
                    claims.name = user.name
                    claims.picture = user.image
                    claims.given_name = user.name
                    claims.family_name = ''
                }

                if (scopes.includes('email')) {
                    claims.email = user.email
                    claims.email_verified = user.emailVerified
                }

                // if (scopes.includes('phone')) {
                //     claims.phone_number = user.phoneNumber
                //     claims.phone_number_verified = user.phoneNumberVerified
                // }

                return claims
            },
            // 受信任的客户端
            // 受信任的客户端可以绕过数据库查询以获得更好的性能，并且可以选择跳过同意屏幕以改善用户体验
            trustedClients: [],
        }),
    ], // 过滤掉未定义的插件
    ...secondaryStorage ? { secondaryStorage } : {},
})

