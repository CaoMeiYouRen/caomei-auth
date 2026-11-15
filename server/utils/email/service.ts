import logger from '../logger'
import { emailTemplateEngine } from './templates'
import { getEmailTranslator } from './i18n'
import { backfillUserLocale, resolveEmailLocaleWithBackfill } from './user-locale'
import { sendEmail } from './index'
import { APP_NAME } from '@/utils/shared/env'
import type { LocaleCode } from '@/i18n/config/locale-registry'

interface EmailLocaleOptions {
    /** 请求上下文（better-auth 回调的 `ctx.request`），用于同步邮件优先取请求语言 */
    request?: Request | null
    /** 已解析的用户偏好语言；缺省时按默认语言 */
    locale?: LocaleCode | string | null
}

/** 解析本次邮件的语言：请求语言 > 用户库内偏好 > 默认（显式 `locale` 为调用方覆盖）；旧用户按请求语言回填 */
async function resolveLocale(email: string, options?: EmailLocaleOptions): Promise<LocaleCode> {
    const { locale, shouldBackfill } = await resolveEmailLocaleWithBackfill(email, options)
    if (shouldBackfill) {
        /* 不阻塞邮件发送：回填失败只记录告警 */
        void backfillUserLocale(email, locale)
    }
    return locale
}

/**
 * 邮件验证服务
 */
export const emailService = {
    /**
     * 发送邮箱验证邮件（使用新的模板系统）
     */
    async sendVerificationEmail(email: string, verificationUrl: string, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '🔐',
                    message: t('email.verification.message', { appName: APP_NAME }),
                    buttonText: t('email.verification.buttonText'),
                    actionUrl: verificationUrl,
                    reminderContent: t('email.verification.reminder', { appName: APP_NAME }),
                    securityTip: t('email.verification.securityTip', { appName: APP_NAME }),
                },
                {
                    title: t('email.verification.title', { appName: APP_NAME }),
                    preheader: t('email.verification.preheader', { appName: APP_NAME }),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.verification.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'verification', email })
        } catch (error) {
            logger.email.failed({
                type: 'verification',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送登录验证码邮件
     */
    async sendLoginOTP(email: string, otp: string, expiresInMinutes: number = 5, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: '🔓',
                    message: t('email.loginOtp.message', { appName: APP_NAME }),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: t('email.loginOtp.securityTip'),
                },
                {
                    title: t('email.loginOtp.title', { appName: APP_NAME }),
                    preheader: t('email.loginOtp.preheader', { code: otp }),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.loginOtp.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'login-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'login-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送邮箱验证码邮件
     */
    async sendEmailVerificationOTP(email: string, otp: string, expiresInMinutes: number = 5, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: '🔐',
                    message: t('email.emailVerificationOtp.message', { appName: APP_NAME }),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: t('email.emailVerificationOtp.securityTip'),
                },
                {
                    title: t('email.emailVerificationOtp.title', { appName: APP_NAME }),
                    preheader: t('email.emailVerificationOtp.preheader', { code: otp }),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.emailVerificationOtp.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'email-verification-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'email-verification-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送密码重置验证码邮件
     */
    async sendPasswordResetOTP(email: string, otp: string, expiresInMinutes: number = 5, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: '🔑',
                    message: t('email.passwordResetOtp.message', { appName: APP_NAME }),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: t('email.passwordResetOtp.securityTip'),
                },
                {
                    title: t('email.passwordResetOtp.title', { appName: APP_NAME }),
                    preheader: t('email.passwordResetOtp.preheader', { code: otp }),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.passwordResetOtp.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'password-reset-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'password-reset-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送Magic Link邮件
     */
    async sendMagicLink(email: string, magicUrl: string, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '✨',
                    message: t('email.magicLink.message', { appName: APP_NAME }),
                    buttonText: t('email.magicLink.buttonText'),
                    actionUrl: magicUrl,
                    reminderContent: t('email.magicLink.reminder'),
                    securityTip: t('email.magicLink.securityTip'),
                },
                {
                    title: t('email.magicLink.title', { appName: APP_NAME }),
                    preheader: t('email.magicLink.preheader'),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.magicLink.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'magic-link', email })
        } catch (error) {
            logger.email.failed({
                type: 'magic-link',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送邮箱更改验证邮件
     */
    async sendEmailChangeVerification(currentEmail: string, newEmail: string, changeUrl: string, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(currentEmail, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '📧',
                    message: t('email.emailChange.message', { newEmail }),
                    buttonText: t('email.emailChange.buttonText'),
                    actionUrl: changeUrl,
                    reminderContent: t('email.emailChange.reminder'),
                    securityTip: t('email.emailChange.securityTip'),
                },
                {
                    title: t('email.emailChange.title', { appName: APP_NAME }),
                    preheader: t('email.emailChange.preheader', { newEmail }),
                },
                locale,
            )

            await sendEmail({
                to: currentEmail,
                subject: t('email.emailChange.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'email-change', email: currentEmail })
        } catch (error) {
            logger.email.failed({
                type: 'email-change',
                email: currentEmail,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送账户安全通知邮件
     */
    async sendSecurityNotification(email: string, action: string, details: string, options?: EmailLocaleOptions): Promise<void> {
        try {
            const locale = await resolveLocale(email, options)
            const t = getEmailTranslator(locale)
            const { html, text } = await emailTemplateEngine.generateSimpleMessageTemplate(
                {
                    headerIcon: '🛡️',
                    message: t('email.securityNotification.message', { appName: APP_NAME, action }),
                    extraInfo: details,
                },
                {
                    title: t('email.securityNotification.title', { appName: APP_NAME }),
                    preheader: t('email.securityNotification.preheader'),
                },
                locale,
            )

            await sendEmail({
                to: email,
                subject: t('email.securityNotification.subject', { appName: APP_NAME }),
                html,
                text,
            })

            logger.email.sent({ type: 'security-notification', email })
        } catch (error) {
            logger.email.failed({
                type: 'security-notification',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },
}
