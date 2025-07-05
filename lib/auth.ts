import { betterAuth, type SecondaryStorage } from 'better-auth'
import {
    username,
    anonymous,
    magicLink,
    emailOTP,
    openAPI,
    phoneNumber as $phoneNumber,
    admin,
} from 'better-auth/plugins'
import Redis from 'ioredis'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { sendEmail } from '@/server/utils/email'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { usernameValidator, isPhone } from '@/utils/validate'
import { sendPhoneOtp } from '@/server/utils/phone'

// Redis 二级存储配置（仅当有配置时启用）
let secondaryStorage: SecondaryStorage | null = null
if (process.env.REDIS_URL) {
    const redis = new Redis(process.env.REDIS_URL)
    secondaryStorage = {
        get: async (key: string) => {
            const value = await redis.get(key)
            return value ?? null
        },
        set: async (key: string, value: string, ttl?: number) => {
            if (ttl) {
                await redis.set(key, value, 'EX', ttl)
            } else {
                await redis.set(key, value)
            }
        },
        delete: async (key: string) => {
            await redis.del(key)
        },
    }
}

export const auth = betterAuth({
    // 数据库适配器
    // 使用 TypeORM 适配器连接到 PostgreSQL 数据库
    database: typeormAdapter(dataSource),
    advanced: {
        database: {
            // 自定义 ID 生成逻辑
            // 通过雪花算法 生成一个 16 进制的 ID
            generateId: (options) => snowflake.generateId(),
        },
    },
    rateLimit: {
        window: 60, // time window in seconds
        max: 100, // max requests in the window
        storage: secondaryStorage ? 'secondary-storage' : 'memory', // 如果配置了 Redis，则使用二级存储；否则使用内存存储
        customRules: {
            // 合并 /sign-in/* 路径，除 /sign-in/username 外
            '/sign-in/username': { window: 60, max: 5 },
            '/sign-in/*': (req) => {
                // username 已单独处理
                if (req.url?.endsWith('/sign-in/username')) {
                    return { window: 60, max: 5 }
                }
                return { window: 60, max: 3 }
            },
            // 合并 /email-otp/* 路径
            '/email-otp/*': { window: 60, max: 3 },
            '/sign-up/email': { window: 60, max: 3 },
            '/forget-password': { window: 60, max: 3 },
            '/request-password-reset': { window: 60, max: 3 },
            '/reset-password': { window: 60, max: 3 },
            '/send-verification-email': { window: 60, max: 3 },
            '/change-email': { window: 60, max: 3 },
            '/delete-user': { window: 60, max: 2 },
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
        sendOnSignUp: process.env.NODE_ENV === 'production', // 注册时发送验证邮件
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
                    text: `点击链接以批准更改：${url}`,
                })
            },
        },
    },
    plugins: [
        username({
            minUsernameLength: 2, // 最小用户名长度
            maxUsernameLength: 36, // 最大用户名长度
            usernameValidator,
        }), // 支持用户名登录
        anonymous({
            // 支持匿名登录
            emailDomainName:
                process.env.ANONYMOUS_EMAIL_DOMAIN_NAME || 'anonymous.com', // 匿名用户的默认电子邮件域名
            onLinkAccount: async ({ anonymousUser, newUser }) => {
                // 执行操作，如将购物车项目从匿名用户移动到新用户
                // console.log('Linking anonymous user to new user:', anonymousUser, newUser)
                // 手动将匿名用户的数据关联到新用户
            },
        }),
        magicLink({
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
            // 支持电子邮件 OTP 登录
            async sendVerificationOTP({ email, otp, type }) {
                await sendEmail({
                    to: email,
                    subject: '您的一次性验证码',
                    text: `您的验证码是：${otp}`,
                })
            },
        }),
        $phoneNumber({
            otpLength: 6, // OTP 验证码长度
            expiresIn: 300, // OTP 验证码有效期（秒）
            allowedAttempts: 3, // 允许的 OTP 验证尝试次数
            // requireVerification: true, // 是否要求手机号码验证，启用后，用户在验证手机号码之前无法使用手机号码登录。
            sendOTP: async ({ phoneNumber, code }, request) => {
                await sendPhoneOtp(phoneNumber, code)
            },
            callbackOnVerification: async ({ phoneNumber, user }, request) => {
                // 实现手机号码验证后的回调
            },
            // 验证手机号码格式
            phoneNumberValidator: (phoneNumber) => isPhone(phoneNumber),
            signUpOnVerification: {
                // 使用雪花算法生成临时电子邮件地址
                // 生成的电子邮件地址格式为：<snowflake_id>@example.com
                getTempEmail: (phoneNumber) => `${snowflake.generateId()}@${process.env.TEMP_EMAIL_DOMAIN_NAME || 'example.com'}`,
                getTempName: (phoneNumber) => `user-${snowflake.generateId()}`, // 使用雪花算法生成临时用户名
            },
        }),
        admin({
            defaultRole: 'user', // 默认角色为用户
            adminRoles: ['admin', 'root'], // 管理员角色列表
            adminUserIds: (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean), // 管理员用户 ID 列表
        }), // 支持管理员插件
        openAPI({
            disableDefaultReference: process.env.NODE_ENV !== 'development', // 开发环境启用 OpenAPI 插件
        }),
    ], // 过滤掉未定义的插件
    ...secondaryStorage ? { secondaryStorage } : {},
})
