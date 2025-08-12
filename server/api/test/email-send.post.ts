import { emailService } from '~/server/utils/email-service'

export default defineEventHandler(async (event) => {

    if (import.meta.env.PROD) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Email testing endpoint is disabled in production',
        })
    }

    const method = getMethod(event)

    if (method !== 'POST') {
        throw createError({
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
        })
    }

    try {
        const body = await readBody(event)
        const { email, type, ...params } = body

        if (!email || !type) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Email and type are required',
            })
        }

        let result

        switch (type) {
            case 'verification':
                if (!params.verificationUrl) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'verificationUrl is required',
                    })
                }
                result = await emailService.sendVerificationEmail(email, params.verificationUrl)
                break

            case 'password-reset':
                if (!params.resetUrl) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'resetUrl is required',
                    })
                }
                result = await emailService.sendPasswordResetEmail(email, params.resetUrl)
                break

            case 'login-otp':
                if (!params.otp) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'otp is required',
                    })
                }
                result = await emailService.sendLoginOTP(email, params.otp, params.expiresInMinutes || 5)
                break

            case 'magic-link':
                if (!params.magicUrl) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'magicUrl is required',
                    })
                }
                result = await emailService.sendMagicLink(email, params.magicUrl)
                break

            case 'email-change':
                if (!params.newEmail || !params.changeUrl) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'newEmail and changeUrl are required',
                    })
                }
                result = await emailService.sendEmailChangeVerification(email, params.newEmail, params.changeUrl)
                break

            case 'security-notification':
                if (!params.action || !params.details) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'action and details are required',
                    })
                }
                result = await emailService.sendSecurityNotification(email, params.action, params.details)
                break

            default:
                throw createError({
                    statusCode: 400,
                    statusMessage: `Unsupported email type: ${type}`,
                })
        }

        return {
            success: true,
            message: 'Email sent successfully',
        }
    } catch (error) {
        console.error('Email test error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error instanceof Error ? error.message : 'Internal Server Error',
        })
    }
})
