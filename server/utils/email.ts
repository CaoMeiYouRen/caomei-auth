import nodemailer from 'nodemailer'

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
    return transporter.sendMail({
        from: options.from || process.env.EMAIL_FROM, // 发件人
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    })
}
