import nodemailer from 'nodemailer'
import ms from 'ms'
import { limiterStorage } from '@/server/database/storage'

// 定义邮箱验证码的每日发送上限
const EMAIL_DAILY_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT || 100)
// 单个邮箱每日验证码发送上限
const EMAIL_SINGLE_USER_DAILY_LIMIT = Number(process.env.EMAIL_SINGLE_USER_DAILY_LIMIT || 5)

const EMAIL_LIMIT_KEY = 'email_global_limit'
// 限流窗口，单位秒，默认 1 天(86400秒)
const EMAIL_LIMIT_WINDOW = Number(process.env.EMAIL_LIMIT_WINDOW || ms('1d') / 1000)

export interface EmailOptions {
    /**
     * 发件人地址，默认为环境变量 EMAIL_FROM
     */
    from?: string
    /**
     * 收件人地址，必填
     */
    to: string
    /**
     * 邮件主题，必填
     */
    subject: string
    /**
     * 纯文本格式的邮件内容
     * 如果提供了 html，则 text 会被忽略
     */
    text?: string
    /**
     * HTML 格式的邮件内容
     * 如果提供了 html，则 text 会被忽略
     */
    html?: string
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // SMTP 服务器地址
    port: Number(process.env.EMAIL_PORT) || 587, // SMTP 服务器端口
    secure: process.env.EMAIL_SECURE === 'true', // 如果使用 SSL/TLS 加密，设置 secure 为 true
    auth: {
        user: process.env.EMAIL_USER, // 用户名
        pass: process.env.EMAIL_PASS, // 密码
    },
})

export async function sendEmail(options: EmailOptions) {
    if (!await transporter.verify()) {
        throw new Error('Email transporter configuration is invalid')
    }
    // 检查全局限流
    const globalCount = await limiterStorage.increment(
        EMAIL_LIMIT_KEY,
        EMAIL_LIMIT_WINDOW,
    )
    if (globalCount > EMAIL_DAILY_LIMIT) {
        throw new Error('今日邮箱发送次数已达全局上限')
    }

    // 检查单个邮箱限流
    const singleUserLimitKey = `email_single_user_limit:${options.to}`
    const singleUserCount = await limiterStorage.increment(
        singleUserLimitKey,
        EMAIL_LIMIT_WINDOW,
    )
    if (singleUserCount > EMAIL_SINGLE_USER_DAILY_LIMIT) {
        throw new Error('您的邮箱今日发送次数已达上限')
    }

    return transporter.sendMail({
        from: options.from || process.env.EMAIL_FROM, // 发件人
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    })
}
