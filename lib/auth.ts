import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
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
    jwt,
} from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { sso } from '@better-auth/sso'
import { ms } from 'ms'
import { z } from 'zod'
import { localization } from 'better-auth-localization'
import { GENERIC_OAUTH_CONFIG } from './auth/generic-oauth'
import { createLazyDataSource } from '@/server/utils/lazy-data-source'
import { ENABLED_LOCALE_CODES, type LocaleCode } from '@/i18n/config/locale-registry'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { usernameValidator, validatePhone } from '@/utils/shared/validate'
import { sendPhoneOtp } from '@/server/utils/sms/index'
import { isUserAdmin } from '@/server/utils/admin-role-sync'
import { secondaryStorage } from '@/server/database/storage'
import {
    EMAIL_EXPIRES_IN,
    PHONE_EXPIRES_IN,
    ANONYMOUS_EMAIL_DOMAIN_NAME,
    AUTH_SECRET,
    ADMIN_USER_IDS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET,
    FACEBOOK_SCOPES,
    FACEBOOK_FIELDS,
    FACEBOOK_CONFIG_ID,
    APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET,
    APPLE_APP_BUNDLE_IDENTIFIER,
    TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET,
    AUTH_BASE_URL,
    APP_NAME,
    EMAIL_REQUIRE_VERIFICATION,
} from '@/utils/shared/env'
import type { User } from '@/server/entities/user'
import { getTempEmail, getTempName } from '@/server/utils/auth-generators'
import { emailService } from '@/server/utils/email/service'
import { getUserLocale } from '@/server/utils/locale'
import { isValidTimeZone } from '@/utils/shared/timezone'
import { getCaptchaConfig } from '@/server/utils/captcha-config'
import { isCaptchaEnabled } from '@/utils/web/captcha'
import { AUTH_DISABLED_PATHS } from '@/utils/shared/auth-disabled-paths'
import {
    auditEmailChangeRequested,
    auditPasswordReset,
    auditPasswordResetRequested,
    auditPhoneBound,
    auditSocialAccountLinked,
} from '@/server/utils/audit-hooks'
import { sendPasswordResetOtp, deliverTwoFactorOtp } from '@/server/utils/recovery-channels'
import { twoFactorCoveragePlugin } from '@/server/utils/two-factor-coverage/plugin'
import { loginEventPlugin } from '@/server/utils/login-events/plugin'
import { assertAdminWriteAllowed, assertPasswordResetCompleted, clearPasswordResetRequirement } from '@/server/utils/recovery-guards'
import { applyChannelChangeBeforeSession } from '@/server/utils/channel-change-apply'
import { assertRegistrationAllowed } from '@/server/utils/registration-guard'

function createAuthInstance() {
    return betterAuth({
        appName: APP_NAME, // 应用名称。它将被用作发行者。
        // 站点根 URL；better-auth 会拼接 basePath（/api/auth）得到实际挂载地址。
        // 显式声明后 OAuth/OIDC 发现文档中的端点才是绝对 URL（1.7 起发现文档不再自动挂载）。
        baseURL: AUTH_BASE_URL,
        // 显式关闭上游管理端点（SSO 提供商 + OAuth 客户端自助管理）。
        // 这些端点只校验登录态，不校验管理员身份；本项目只允许通过 admin API 管理对应资源。
        // 详见 utils/shared/auth-disabled-paths.ts、GHSA-785j-54p4-vxw9 与 GHSA-2r7m-492j-p8xm。
        disabledPaths: AUTH_DISABLED_PATHS,
        // 数据库适配器
        // 使用 TypeORM 适配器
        database: typeormAdapter(createLazyDataSource()),
        // 管理员写操作边界（阶段 9 D8 / D9）：禁止直接改邮箱 / 手机与代设密码
        hooks: {
            before: createAuthMiddleware(async (ctx) => {
                assertAdminWriteAllowed(ctx.path, ctx.body, ctx.request)
            }),
        },
        // 注册控制：邮箱域名 / 手机号国家码规则（阶段 6 M12）
        databaseHooks: {
            user: {
                create: {
                    before: async (user, context) => {
                        await assertRegistrationAllowed({
                            email: user.email,
                            phone: (user as { phoneNumber?: string | null }).phoneNumber,
                        }, context)
                        return { data: user }
                    },
                },
                update: {
                    before: async (data, context) => {
                        const changes = data as { email?: string | null, phoneNumber?: string | null }
                        /* 只在邮箱 / 手机号变更时校验，避免时区、语言等更新被误拦 */
                        if (changes.email === undefined && changes.phoneNumber === undefined) {
                            return { data }
                        }
                        await assertRegistrationAllowed({
                            email: changes.email,
                            phone: changes.phoneNumber,
                        }, context)
                        return { data }
                    },
                },
            },
            account: {
                create: {
                    /* 社交账号绑定成功后记录结构化审计（阶段 9 M1） */
                    after: async (account, context) => {
                        auditSocialAccountLinked(account, context)
                    },
                },
            },
            session: {
                create: {
                    /* 强制重置密码期间拒绝任何新会话（阶段 9 M11） */
                    before: async (session, context) => {
                        /* 冷静期到期即生效：旧邮箱不得再拿到新会话（阶段 10 M3.1） */
                        if (typeof session.userId === 'string') {
                            await applyChannelChangeBeforeSession(session.userId)
                        }
                        await assertPasswordResetCompleted(session, context?.request)
                        return { data: session }
                    },
                },
            },
        },
        // 可信来源列表。
        trustedOrigins: [AUTH_BASE_URL],
        // 用于加密、签名和哈希的秘密。
        secret: AUTH_SECRET,
        advanced: {
            database: {
                // 自定义 ID 生成逻辑
                // 通过雪花算法 生成一个 16 进制的 ID
                generateId: () => snowflake.generateId(),
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
                '/send-verification-email': { window: 60, max: 3 },
                '/change-email': { window: 60, max: 3 },
                // 链接重置通道已下线，端点仍存在（无 token 可签发），保留限流作为纵深防御
                '/reset-password': { window: 60, max: 3 },
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
            requireEmailVerification: EMAIL_REQUIRE_VERIFICATION, // 是否要求邮箱验证。若启用，则用户必须在登录前验证他们的邮箱。仅在使用邮箱密码登录时生效。
            // 重置密码后撤销全部会话（阶段 9 C2 / M11）
            revokeSessionsOnPasswordReset: true,
            // 重置成功后写审计并清除强制重置标记（M11）；会话撤销由 revokeSessionsOnPasswordReset 负责
            onPasswordReset: async ({ user }, request) => {
                auditPasswordReset({ user }, request)
                try {
                    await clearPasswordResetRequirement(user.id)
                } catch (error) {
                // 清标记失败不能阻断密码重置本身；下次登录仍会被拦截，需运维介入
                    console.error('Failed to clear mustResetPassword flag', error)
                }
            },
        // 不配置 sendResetPassword：邮件链接重置通道已下线（统一走邮箱 / 短信验证码）。
        // better-auth 在缺失该回调时会让 POST /api/auth/request-password-reset 返回 400 RESET_PASSWORD_DISABLED。
        },
        emailVerification: {
            sendOnSignUp: true, // 注册时发送验证邮件
            autoSignInAfterVerification: true, // 验证后自动登录
            // 发送验证邮件
            sendVerificationEmail: async ({ user, url }, request) => {
                await emailService.sendVerificationEmail(user.email, url, { request })
            },
        },
        user: {
            additionalFields: {
            /* 界面语言偏好：只在登录用户主动切换语言时写入，不参与鉴权 */
                locale: {
                    type: 'string',
                    required: false,
                    defaultValue: null,
                    input: true,
                    validator: {
                        input: z.enum(ENABLED_LOCALE_CODES as [LocaleCode, ...LocaleCode[]]),
                    },
                },
                /* 用户时区偏好：IANA 名称或空串（跟随浏览器），仅用于展示时间，不参与鉴权 */
                timezone: {
                    type: 'string',
                    required: false,
                    defaultValue: null,
                    input: true,
                    validator: {
                        input: z.string().max(64).refine((value) => value === '' || isValidTimeZone(value), 'invalid time zone'),
                    },
                },
            },
            changeEmail: {
                enabled: true, // 启用更改邮箱功能
                // 发送更改邮箱验证邮件（1.7 起由 sendChangeEmailVerification 更名）
                sendChangeEmailConfirmation: async ({ user, newEmail, url }, request) => {
                    auditEmailChangeRequested({ user, newEmail }, request)
                    await emailService.sendEmailChangeVerification(user.email, newEmail, url, { request })
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
                clientId: GITHUB_CLIENT_ID!,
                clientSecret: GITHUB_CLIENT_SECRET!,
            },
            google: { // 支持 Google 登录
                clientId: GOOGLE_CLIENT_ID!,
                clientSecret: GOOGLE_CLIENT_SECRET!,
            },
            microsoft: { // 支持 Microsoft 登录
                clientId: MICROSOFT_CLIENT_ID!,
                clientSecret: MICROSOFT_CLIENT_SECRET!,
                // 可选配置
                tenantId: 'common',
            },
            discord: { // 支持 Discord 登录
                clientId: DISCORD_CLIENT_ID!,
                clientSecret: DISCORD_CLIENT_SECRET!,
            },
            facebook: { // 支持 Facebook 登录
                clientId: FACEBOOK_CLIENT_ID!,
                clientSecret: FACEBOOK_CLIENT_SECRET!,
                scopes: ['email', 'public_profile', ...FACEBOOK_SCOPES],
                fields: ['id', 'name', 'email', 'picture', ...FACEBOOK_FIELDS],
                configId: FACEBOOK_CONFIG_ID,
            },
            apple: { // 支持 Apple 登录
                clientId: APPLE_CLIENT_ID!,
                clientSecret: APPLE_CLIENT_SECRET!,
                appBundleIdentifier: APPLE_APP_BUNDLE_IDENTIFIER!,
            },
            twitter: { // 支持 Twitter 登录
                clientId: TWITTER_CLIENT_ID!,
                clientSecret: TWITTER_CLIENT_SECRET!,
                scopes: ['user.email', 'users.read'], // users.email 用于获取邮箱，users.read 用于获取基本用户信息
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
                // displayUsernameValidator: usernameValidator,
                usernameNormalization: (name) => name.toLowerCase().trim(), // 用户名规范化函数
                // displayUsernameNormalization: (name) => name.trim(), // 用户名规范化函数
                validationOrder: {
                    username: 'pre-normalization',
                },
            }), // 支持用户名登录
            anonymous({
            // 支持匿名登录
                emailDomainName: ANONYMOUS_EMAIL_DOMAIN_NAME, // 匿名用户的默认电子邮件域名
                onLinkAccount: async () => {
                // 执行操作，如将购物车项目从匿名用户移动到新用户
                // console.log('Linking anonymous user to new user:', anonymousUser, newUser)
                // 手动将匿名用户的数据关联到新用户
                },
            }),
            magicLink({
                expiresIn: EMAIL_EXPIRES_IN, // 链接有效期（秒）
                disableSignUp: false, // 当用户未注册时是否阻止自动注册
                // 支持一次性链接登录
                sendMagicLink: async ({ email, url }, ctx) => {
                    await emailService.sendMagicLink(email, url, { request: ctx?.request })
                },
            }),
            emailOTP({
                disableSignUp: false, // 当用户未注册时是否阻止自动注册
                otpLength: 6, // OTP 验证码长度
                expiresIn: EMAIL_EXPIRES_IN, // OTP 验证码有效期（秒）
                allowedAttempts: 3, // 允许的 OTP 验证尝试次数
                sendVerificationOnSignUp: false, // 用户注册时是否发送 OTP。因为已经发送验证邮件，所以不需要再发送 OTP。
                // 支持电子邮件 OTP 登录
                async sendVerificationOTP({ email, otp, type }, ctx) {
                    const expiresInMinutes = Math.floor(EMAIL_EXPIRES_IN / 60)

                    if (type === 'sign-in') {
                    // 发送登录用的OTP
                        await emailService.sendLoginOTP(email, otp, expiresInMinutes, { request: ctx?.request })
                        return
                    }
                    if (type === 'email-verification') {
                    // 发送电子邮件验证用的OTP
                        await emailService.sendEmailVerificationOTP(email, otp, expiresInMinutes, { request: ctx?.request })
                        return
                    }
                    if (type === 'forget-password') {
                        // 发送密码重置用的OTP
                        try {
                            await emailService.sendPasswordResetOTP(email, otp, expiresInMinutes, { request: ctx?.request })
                            auditPasswordResetRequested({ email, type }, ctx)
                        } catch (error) {
                            auditPasswordResetRequested({ email, type, result: 'failure', reason: error instanceof Error ? error.message : String(error) }, ctx)
                            throw error
                        }
                        return
                    }
                    // 默认情况使用登录OTP
                    await emailService.sendLoginOTP(email, otp, expiresInMinutes, { request: ctx?.request })
                },
            }),
            $phoneNumber({
                otpLength: 6, // OTP 验证码长度
                expiresIn: PHONE_EXPIRES_IN, // OTP 验证码有效期（秒）
                allowedAttempts: 3, // 允许的 OTP 验证尝试次数
                requireVerification: true, // 是否要求手机号码验证，启用后，用户在验证手机号码之前无法使用手机号码登录。
                sendOTP: async ({ phoneNumber, code }) => {
                    await sendPhoneOtp(phoneNumber, code)
                },
                // 短信重置密码通道（阶段 9 M4）：未配置短信时返回明确错误码，不再静默成功
                sendPasswordResetOTP: async ({ phoneNumber, code }, ctx) => {
                    try {
                        await sendPasswordResetOtp(phoneNumber, code, ctx?.request)
                        auditPasswordResetRequested({ phoneNumber, type: 'forget-password' }, ctx)
                    } catch (error) {
                        auditPasswordResetRequested({ phoneNumber, type: 'forget-password', result: 'failure', reason: error instanceof Error ? error.message : String(error) }, ctx)
                        throw error
                    }
                },
                callbackOnVerification: async ({ phoneNumber, user }) => {
                    auditPhoneBound({ phoneNumber, user })
                },
                // 验证手机号码格式
                phoneNumberValidator: (phoneNumber) => validatePhone(phoneNumber),
                signUpOnVerification: {
                    // 使用随机算法生成临时电子邮件地址
                    // 生成的电子邮件地址格式为：<random_id>@example.com
                    getTempEmail: () => getTempEmail(),
                    getTempName: () => getTempName(), // 使用随机算法生成临时用户名
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
                    async sendOTP(data, ctx) {
                        const { otp } = data
                        const user = data.user as User
                        // 邮件优先、失败回落到已验证手机；投递结果供前端提示（阶段 9 M6）
                        await deliverTwoFactorOtp(user, otp, ctx?.request)
                    },
                },
                backupCodeOptions: {
                    length: 10, // 备份码长度
                    amount: 10, // 备份码数量
                },
            }),
            twoFactorCoveragePlugin(),
            loginEventPlugin(),
            genericOAuth({ config: GENERIC_OAUTH_CONFIG }),
            oauthProvider({
                loginPage: '/login', // 登录页面的路径
                consentPage: '/oauth/consent', // 同意页面的路径
                // 动态客户端注册（RFC 7591）仅限管理员，但上游 `/oauth2/register` 只校验登录态，
                // 因此直接关闭该端点；应用统一由管理后台 `/api/admin/oauth/applications` 创建。
                // 关闭后 `registration_endpoint` 不再出现在 Discovery 元数据中。
                // 纵深防御见 server/middleware/2-auth.ts 与 utils/shared/auth-paths.ts（GHSA-2r7m-492j-p8xm）。
                allowDynamicClientRegistration: false,
                // 纵深防御：即使 disabledPaths 被误删，客户端管理也只允许管理员操作。
                // 上游默认在未配置该回调时放行任意登录会话（含匿名会话）。
                clientPrivileges: ({ user }) => Boolean(user && isUserAdmin(user as { role?: string | null }, user.id)),
                // 添加自定义作用域支持
                scopes: [
                    'openid',
                    'profile',
                    'email',
                    'offline_access',
                    'phone',
                ],
                // 自定义 userinfo 端点返回的声明。sub 等协议必填声明由服务端生成，不能在此覆盖。
                customUserInfoClaims: ({ user: _user, scopes }) => {
                    const user = _user as unknown as User
                    const claims: Record<string, any> = {}

                    // 根据请求的作用域添加声明
                    if (scopes.includes('openid')) {
                        claims.openid = user.id
                    }
                    if (scopes.includes('profile')) {
                        claims.name = user.name
                        claims.nickname = user.name
                        claims.picture = user.image
                        claims.username = user.username
                    }

                    if (scopes.includes('email')) {
                        claims.email = user.email
                        claims.email_verified = user.emailVerified
                    }
                    // OIDC 支持返回手机号
                    if (scopes.includes('phone')) {
                        claims.phone_number = user.phoneNumber
                        claims.phone_number_verified = user.phoneNumberVerified
                    }

                    return claims
                },
            }),
            jwt({
            // 1.7 的 oauth-provider 以 jwt.issuer 作为 OIDC issuer，未显式设置时会退回 ctx.baseURL；
            // 这里保持与 1.6 `oidcProvider.metadata.issuer` 一致，避免已接入客户端的 iss 校验失效。
                jwt: {
                    issuer: AUTH_BASE_URL,
                },
                jwks: {
                // 用于生成密钥对的算法
                    keyPairConfig: {
                        alg: 'EdDSA',
                        crv: 'Ed25519',
                    },
                },
            }), // 支持 JWT 认证
            sso({
            // 用户自动注册函数，当用户通过 SSO 提供商登录时运行
                provisionUser: async ({ user, provider }) => {
                // 记录 SSO 登录日志
                    console.log(`用户 ${user.email} 通过 SSO 提供商 ${provider.providerId} 登录`)

                    // 可以在这里添加用户同步逻辑，如：
                    // - 更新用户资料信息
                    // - 同步外部系统数据
                    // - 创建用户特定资源
                    // - 记录登录审计日志

                // 示例：更新用户最后登录时间
                // await updateUserLastLogin(user.id, provider.providerId)
                },
                // 组织自动配置选项
                organizationProvisioning: {
                    disabled: false, // 启用组织自动配置
                    defaultRole: 'member', // 新成员的默认角色
                    // 根据 SSO 属性动态分配角色
                    getRole: async ({ userInfo }) => {
                    // 可以根据 SSO 提供商返回的用户信息分配不同角色
                    // 例如：根据部门、职位等信息分配管理员角色
                        const department = userInfo.attributes?.department
                        const jobTitle = userInfo.attributes?.jobTitle

                        // 管理员角色分配逻辑
                        if (jobTitle?.toLowerCase().includes('manager')
                            || jobTitle?.toLowerCase().includes('director')
                            || jobTitle?.toLowerCase().includes('admin')) {
                            return 'admin'
                        }

                        // IT 部门自动获得管理员权限
                        if (department?.toLowerCase() === 'it'
                            || department?.toLowerCase() === '信息技术部') {
                            return 'admin'
                        }

                        // 默认为普通成员
                        return 'member'
                    },
                },
                // 默认覆盖用户信息：使用 SSO 提供商的信息更新本地用户信息
                defaultOverrideUserInfo: false,
                // 隐式注册：false 表示允许 SSO 首次登录时自动创建本地用户
                disableImplicitSignUp: false,
                // 禁止用户自助注册 SSO 提供商（0 表示关闭，双保险：disabledPaths 已关闭该端点）
                // 提供商只能由管理员通过 /api/admin/sso/providers 维护
                providersLimit: 0,
                // 信任邮箱验证状态：信任 SSO 提供商返回的 email_verified。
                // 该选项仅在上游端点不可自助注册时成立（见 disabledPaths 与本文件注释）；
                // 若未来要重新开放 /sso/register，必须同时改为 false 或启用 domainVerification。
                trustEmailVerified: true,
            }),
            localization({
                defaultLocale: 'zh-Hans', // 默认为简体中文
                fallbackLocale: 'default', // 回退到默认语言
                getLocale: (request) => {
                    try {
                        const userLocale = (request ? getUserLocale(request) : undefined)
                        if (!userLocale) {
                            return 'default'
                        }
                        return userLocale
                    } catch (error) {
                        console.warn('Error detecting locale:', error)
                        return 'default' // 安全回退
                    }
                },
            }),
            // 动态验证码配置，根据环境变量启用相应的验证码提供商
            ...(isCaptchaEnabled() ? [captcha(getCaptchaConfig()!)] : []),
        ], // 动态插件配置
        ...secondaryStorage ? { secondaryStorage } : {},
    })
}

type AuthInstance = ReturnType<typeof createAuthInstance>

let authInstance: AuthInstance | null = null

/** 延迟创建 better-auth 实例：首次访问时才读取 `dataSource`，避免 Nitro 产物顶层求值顺序问题 */
export function getAuthInstance(): AuthInstance {
    if (!authInstance) {
        authInstance = createAuthInstance()
    }
    return authInstance
}

/**
 * 延迟初始化的 better-auth 代理。
 *
 * `server/database` 通过顶层 `await` 导出 `dataSource`；Rollup 将模块拼进同一 chunk 后，
 * `betterAuth()` 可能排在 `const dataSource = await ...` 之前求值，直接访问会触发 TDZ。
 * 代理把实例创建推迟到首次调用（请求期），此时数据库已初始化完成。
 */
export const auth = new Proxy({} as AuthInstance, {
    get(_target, property) {
        const instance = getAuthInstance()
        const value = Reflect.get(instance, property)
        return typeof value === 'function' ? value.bind(instance) : value
    },
})
