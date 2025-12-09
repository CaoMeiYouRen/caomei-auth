import type { Transporter } from 'nodemailer'
import logger from '../logger'
import { createDefaultMailer, type MailerFactory } from './factory'
import { limiterStorage } from '@/server/database/storage'
import {
    EMAIL_DAILY_LIMIT,
    EMAIL_SINGLE_USER_DAILY_LIMIT,
    EMAIL_LIMIT_WINDOW,
    EMAIL_FROM,
    EMAIL_HOST,
    EMAIL_USER,
} from '@/utils/shared/env'

const EMAIL_LIMIT_KEY = 'email_global_limit'

type LimiterStorage = typeof limiterStorage
type EmailLogger = typeof logger

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

let mailerFactory: MailerFactory = createDefaultMailer
let limiter: LimiterStorage = limiterStorage
let emailLogger: EmailLogger = logger
let cachedTransporter: Transporter | null = null
let transporterVerified = false

export function injectEmailDeps(deps: {
    createMailer?: MailerFactory
    limiter?: LimiterStorage
    logger?: EmailLogger
} = {}) {
    if (deps.createMailer) {
        mailerFactory = deps.createMailer
        cachedTransporter = null
        transporterVerified = false
    }
    if (deps.limiter) {
        limiter = deps.limiter
    }
    if (deps.logger) {
        emailLogger = deps.logger
    }
}

export function resetEmailDeps() {
    mailerFactory = createDefaultMailer
    limiter = limiterStorage
    emailLogger = logger
    cachedTransporter = null
    transporterVerified = false
}

async function getTransporter() {
    if (!cachedTransporter) {
        cachedTransporter = mailerFactory()
        transporterVerified = false
    }

    if (!transporterVerified) {
        const verified = await cachedTransporter.verify()
        if (!verified) {
            emailLogger.error('Email transporter verification failed', {
                host: EMAIL_HOST,
                user: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}***` : undefined,
            })
            throw new Error('Email transporter configuration is invalid')
        }
        transporterVerified = true
    }

    return cachedTransporter
}

async function ensureWithinLimit(options: EmailOptions) {
    const globalCount = await limiter.increment(
        EMAIL_LIMIT_KEY,
        EMAIL_LIMIT_WINDOW,
    )
    if (globalCount > EMAIL_DAILY_LIMIT) {
        emailLogger.email.rateLimited({
            limitType: 'global',
            email: options.to,
            remainingTime: EMAIL_LIMIT_WINDOW,
        })
        throw new Error('今日邮箱发送次数已达全局上限')
    }

    const singleUserLimitKey = `email_single_user_limit:${options.to}`
    const singleUserCount = await limiter.increment(
        singleUserLimitKey,
        EMAIL_LIMIT_WINDOW,
    )
    if (singleUserCount > EMAIL_SINGLE_USER_DAILY_LIMIT) {
        emailLogger.email.rateLimited({
            limitType: 'user',
            email: options.to,
            remainingTime: EMAIL_LIMIT_WINDOW,
        })
        throw new Error('您的邮箱今日发送次数已达上限')
    }
}

export async function sendEmail(options: EmailOptions) {
    try {
        await ensureWithinLimit(options)

        const transporter = await getTransporter()
        const mailOptions = {
            from: options.from || EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        }

        const result = await transporter.sendMail(mailOptions)

        emailLogger.email.sent({
            type: 'general',
            email: options.to,
            success: true,
        })

        return result
    } catch (error) {
        emailLogger.email.failed({
            type: 'general',
            email: options.to,
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    }
}
