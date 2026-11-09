import { z } from 'zod'
import { validateEmail, validatePhone, validateUrl } from './validate'

// Email Schema
export const emailSchema = z.string()
    .min(1, 'validation.emailRequired')
    .refine(validateEmail, {
        message: 'validation.emailInvalid',
    })

// Phone Schema
export const phoneSchema = z.string()
    .min(1, 'validation.phoneRequired')
    .refine((val) => validatePhone(val), {
        message: 'validation.phoneInvalid',
    })

// Username Schema
export const usernameSchema = z.string()
    .min(1, 'validation.usernameRequired')
    .min(2, 'validation.usernameTooShort')
    .max(36, 'validation.usernameTooLong')
    .regex(/^[a-zA-Z0-9_-]+$/, 'validation.usernameCharset')
    .refine((val) => !emailSchema.safeParse(val).success, {
        message: 'validation.usernameEmailFormat',
    })
    .refine((val) => !validatePhone(val), {
        message: 'validation.usernamePhoneFormat',
    })

// Nickname Schema
export const nicknameSchema = z.string()
    .min(1, 'validation.nicknameRequired')
    .min(2, 'validation.nicknameTooShort')
    .max(36, 'validation.nicknameTooLong')
    // eslint-disable-next-line no-control-regex
    .regex(/^[^\u0000-\u001F\u0020\u007F-\u009F\u00A0-\u00FF]+$/, 'validation.nicknameCharset')

// Password Schema
export const passwordSchema = z.string()
    .min(1, 'validation.passwordRequired')
    .min(6, 'validation.passwordTooShort')
    .max(32, 'validation.passwordTooLong')

// URL Schema
export const urlSchema = z.string()
    .refine(validateUrl, {
        message: 'validation.urlInvalid',
    })

// ID Schema
export const idSchema = z.string().min(1, 'validation.idRequired')

// CN Phone Schema
export const cnPhoneSchema = z.string()
    .min(1, 'validation.phoneRequired')
    .refine((val) => validatePhone(val, 'zh-CN'), {
        message: 'validation.cnPhoneInvalid',
    })
