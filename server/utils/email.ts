import nodemailer from 'nodemailer'
import logger from './logger'
import { limiterStorage } from '@/server/database/storage'
import {
    EMAIL_DAILY_LIMIT,
    EMAIL_SINGLE_USER_DAILY_LIMIT,
    EMAIL_LIMIT_WINDOW,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
} from '@/utils/env'

const EMAIL_LIMIT_KEY = 'email_global_limit'

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
    host: EMAIL_HOST, // SMTP 服务器地址
    port: EMAIL_PORT || 587, // SMTP 服务器端口
    secure: EMAIL_SECURE, // 如果使用 SSL/TLS 加密，设置 secure 为 true
    auth: {
        user: EMAIL_USER, // 用户名
        pass: EMAIL_PASS, // 密码
    },
})

export async function sendEmail(options: EmailOptions) {
    try {
        // 验证邮件传输配置
        if (!await transporter.verify()) {
            const error = 'Email transporter configuration is invalid'
            logger.error('Email transporter verification failed', {
                host: EMAIL_HOST,
                port: EMAIL_PORT,
                user: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}***` : undefined,
            })
            throw new Error(error)
        }

        // 检查全局限流
        const globalCount = await limiterStorage.increment(
            EMAIL_LIMIT_KEY,
            EMAIL_LIMIT_WINDOW,
        )
        if (globalCount > EMAIL_DAILY_LIMIT) {
            logger.email.rateLimited({
                limitType: 'global',
                email: options.to,
                remainingTime: EMAIL_LIMIT_WINDOW,
            })
            throw new Error('今日邮箱发送次数已达全局上限')
        }

        // 检查单个邮箱限流
        const singleUserLimitKey = `email_single_user_limit:${options.to}`
        const singleUserCount = await limiterStorage.increment(
            singleUserLimitKey,
            EMAIL_LIMIT_WINDOW,
        )
        if (singleUserCount > EMAIL_SINGLE_USER_DAILY_LIMIT) {
            logger.email.rateLimited({
                limitType: 'user',
                email: options.to,
                remainingTime: EMAIL_LIMIT_WINDOW,
            })
            throw new Error('您的邮箱今日发送次数已达上限')
        }

        // 发送邮件
        const mailOptions = {
            from: options.from || EMAIL_FROM, // 发件人
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        }

        const result = await transporter.sendMail(mailOptions)

        // 记录发送成功
        logger.email.sent({
            type: 'general',
            email: options.to,
            success: true,
        })

        return result
    } catch (error) {
        // 记录发送失败
        logger.email.failed({
            type: 'general',
            email: options.to,
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    }
}
