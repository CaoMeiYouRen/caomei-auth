import nodemailer, { type Transporter } from 'nodemailer'
import {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
} from '@/utils/shared/env'

export type MailerFactory = () => Transporter

export function createDefaultMailer(): Transporter {
    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT || 587,
        secure: EMAIL_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    })
}
