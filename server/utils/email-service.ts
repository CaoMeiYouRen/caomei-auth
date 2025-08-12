import { sendEmail } from './email'
import { emailTemplateEngine } from './email-template'
import { APP_NAME } from '@/utils/env'

/**
 * 邮件验证服务
 */
export const emailService = {
    /**
     * 发送邮箱验证邮件（使用新的模板系统）
     */
    async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '🔐',
                    message: `感谢您注册 <strong>${APP_NAME}</strong>！为了确保您的账户安全，请点击下方按钮验证您的邮箱地址。`,
                    buttonText: '验证邮箱地址',
                    actionUrl: verificationUrl,
                    reminderContent: `• 此验证链接将在 <strong>24 小时</strong>后过期<br/>• 如果您没有注册 ${APP_NAME} 账户，请忽略此邮件<br/>• 请勿将此链接分享给他人，以保护您的账户安全`,
                    securityTip: `${APP_NAME} 永远不会通过邮件要求您提供密码、验证码或其他敏感信息。`,
                },
                {
                    title: `验证您的 ${APP_NAME} 邮箱地址`,
                    preheader: `欢迎注册 ${APP_NAME}！请验证您的邮箱地址以完成注册。`,
                },
            )

            await sendEmail({
                to: email,
                subject: `验证您的 ${APP_NAME} 邮箱地址`,
                html,
                text,
            })

            console.log(`Email verification sent to: ${email}`)
        } catch (error) {
            console.error('Failed to send email verification:', error)
            throw error
        }
    },

    /**
     * 发送密码重置邮件
     */
    async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '🔑',
                    message: `有人请求重置您的 <strong>${APP_NAME}</strong> 账户密码。如果是您本人操作，请点击下方按钮重置密码：`,
                    buttonText: '重置密码',
                    actionUrl: resetUrl,
                    reminderContent: '• 此重置链接将在 <strong>1 小时</strong>后过期<br/>• 如果不是您本人操作，请立即检查您的账户安全<br/>• 建议修改密码并启用两步验证',
                    securityTip: '如果您没有请求重置密码，请忽略此邮件并检查您的账户安全。',
                },
                {
                    title: `重置您的 ${APP_NAME} 密码`,
                    preheader: '有人请求重置您的密码，如果是您本人操作请点击链接。',
                },
            )

            await sendEmail({
                to: email,
                subject: `重置您的 ${APP_NAME} 密码`,
                html,
                text,
            })

            console.log(`Password reset email sent to: ${email}`)
        } catch (error) {
            console.error('Failed to send password reset email:', error)
            throw error
        }
    },

    /**
     * 发送登录验证码邮件
     */
    async sendLoginOTP(email: string, otp: string, expiresInMinutes: number = 5): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: '🔓',
                    message: `您正在尝试登录 <strong>${APP_NAME}</strong>。请使用以下验证码完成登录：`,
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: '如果不是您本人操作，请忽略此邮件并检查您的账户安全。',
                },
                {
                    title: `您的 ${APP_NAME} 登录验证码`,
                    preheader: `您的登录验证码是 ${otp}`,
                },
            )

            await sendEmail({
                to: email,
                subject: `您的 ${APP_NAME} 登录验证码`,
                html,
                text,
            })

            console.log(`Login OTP sent to: ${email}`)
        } catch (error) {
            console.error('Failed to send login OTP:', error)
            throw error
        }
    },

    /**
     * 发送Magic Link邮件
     */
    async sendMagicLink(email: string, magicUrl: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '✨',
                    message: `点击下方按钮，无需密码即可安全登录您的 <strong>${APP_NAME}</strong> 账户：`,
                    buttonText: '一键登录',
                    actionUrl: magicUrl,
                    reminderContent: '• 此登录链接将在 <strong>15 分钟</strong>后过期<br/>• 链接只能使用一次<br/>• 如果不是您本人操作，请忽略此邮件',
                    securityTip: '为了您的账户安全，请勿将此链接分享给任何人。',
                },
                {
                    title: `您的 ${APP_NAME} 登录链接`,
                    preheader: '点击即可安全登录，无需输入密码。',
                },
            )

            await sendEmail({
                to: email,
                subject: `您的 ${APP_NAME} 登录链接`,
                html,
                text,
            })

            console.log(`Magic link sent to: ${email}`)
        } catch (error) {
            console.error('Failed to send magic link:', error)
            throw error
        }
    },

    /**
     * 发送邮箱更改验证邮件
     */
    async sendEmailChangeVerification(currentEmail: string, newEmail: string, changeUrl: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: '📧',
                    message: `您即将修改邮箱地址为：<strong>${newEmail}</strong><br/><br/>如果确认变更，请点击下方按钮：`,
                    buttonText: '确认邮箱变更',
                    actionUrl: changeUrl,
                    reminderContent: '• 此确认链接将在 <strong>24 小时</strong>后过期<br/>• 变更邮箱后，您需要使用新邮箱地址登录<br/>• 如果这不是您的操作，请忽略此邮件',
                    securityTip: '为了您的账户安全，邮箱变更确认链接已发送到您当前的邮箱地址。',
                },
                {
                    title: `确认邮箱地址变更 - ${APP_NAME}`,
                    preheader: `确认将邮箱地址变更为 ${newEmail}`,
                },
            )

            await sendEmail({
                to: currentEmail,
                subject: `确认邮箱地址变更 - ${APP_NAME}`,
                html,
                text,
            })

            console.log(`Email change verification sent to: ${currentEmail} for new email: ${newEmail}`)
        } catch (error) {
            console.error('Failed to send email change verification:', error)
            throw error
        }
    },

    /**
     * 发送账户安全通知邮件
     */
    async sendSecurityNotification(email: string, action: string, details: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateSimpleMessageTemplate(
                {
                    headerIcon: '🛡️',
                    message: `我们检测到您的 <strong>${APP_NAME}</strong> 账户有以下安全活动：<br/><br/><strong>${action}</strong>`,
                    extraInfo: details,
                },
                {
                    title: `${APP_NAME} 账户安全通知`,
                    preheader: '您的账户有安全活动，请查看详情。',
                },
            )

            await sendEmail({
                to: email,
                subject: `${APP_NAME} 账户安全通知`,
                html,
                text,
            })

            console.log(`Security notification sent to: ${email}`)
        } catch (error) {
            console.error('Failed to send security notification:', error)
            throw error
        }
    },
}
