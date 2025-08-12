import { sendEmail } from './email'
import { emailTemplateEngine } from './email-template'
import { APP_NAME } from '@/utils/env'

/**
 * 邮件验证服务
 */
export const emailService = {
    /**
     * 发送邮箱验证邮件（使用MJML模板）
     */
    async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
        try {
            const { html, text } = emailTemplateEngine.generateEmailTemplate(
                'email-verification',
                {
                    verificationUrl,
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
     * 发送邮箱更改验证邮件（使用MJML模板，暂时用回退方案）
     */
    async sendEmailChangeVerification(
        currentEmail: string,
        newEmail: string,
        changeUrl: string,
    ): Promise<void> {
        try {
            // 暂时使用简单的邮件格式，后续可以创建专门的MJML模板
            await sendEmail({
                to: currentEmail,
                subject: `确认邮箱地址变更 - ${APP_NAME}`,
                text: `您即将修改为新邮箱地址是 ${newEmail}，请点击链接以批准更改：${changeUrl}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
                            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 30px; color: #e63946; font-size: 24px; font-weight: bold; }
                            .content { color: #4a5568; line-height: 1.6; font-size: 16px; }
                            .button { display: inline-block; padding: 16px 32px; background: #e63946; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #a0aec0; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">${APP_NAME}</div>
                            <div class="content">
                                <p>您好！</p>
                                <p>您即将修改邮箱地址为：<strong>${newEmail}</strong></p>
                                <p>如果确认变更，请点击下方按钮：</p>
                                <p style="text-align: center;">
                                    <a href="${changeUrl}" class="button">确认邮箱变更</a>
                                </p>
                                <p>如果这不是您的操作，请忽略此邮件。</p>
                            </div>
                            <div class="footer">
                                © ${new Date().getFullYear()} ${APP_NAME}. 保留所有权利。
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            })

            console.log(`Email change verification sent to: ${currentEmail} for new email: ${newEmail}`)
        } catch (error) {
            console.error('Failed to send email change verification:', error)
            throw error
        }
    },
}
