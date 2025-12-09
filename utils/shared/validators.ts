import { z } from 'zod'
import { validateEmail, validatePhone, validateUrl } from './validate'

// Email Schema
export const emailSchema = z.string()
    .min(1, '请输入邮箱')
    .refine(validateEmail, {
        message: '请输入有效的邮箱地址',
    })

// Phone Schema
export const phoneSchema = z.string()
    .min(1, '请输入手机号')
    .refine((val) => validatePhone(val), {
        message: '请输入有效的手机号',
    })

// Username Schema
export const usernameSchema = z.string()
    .min(1, '请输入用户名')
    .min(2, '用户名长度不能少于 2 位')
    .max(36, '用户名长度不能超过 36 位')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符')
    .refine((val) => !emailSchema.safeParse(val).success, {
        message: '用户名不能是邮箱格式',
    })
    .refine((val) => !validatePhone(val), {
        message: '用户名不能是手机号格式',
    })

// Nickname Schema
export const nicknameSchema = z.string()
    .min(1, '请输入昵称')
    .min(2, '昵称长度不能少于 2 位')
    .max(36, '昵称长度不能超过 36 位')
    // eslint-disable-next-line no-control-regex
    .regex(/^[^\u0000-\u001F\u0020\u007F-\u009F\u00A0-\u00FF]+$/, '昵称包含非法字符')

// Password Schema
export const passwordSchema = z.string()
    .min(1, '请输入密码')
    .min(6, '密码长度不能少于 6 位')
    .max(32, '密码长度不能超过 32 位')

// URL Schema
export const urlSchema = z.string()
    .refine(validateUrl, {
        message: '请输入有效的链接',
    })

// ID Schema
export const idSchema = z.string().min(1, 'ID 不能为空')

// CN Phone Schema
export const cnPhoneSchema = z.string()
    .min(1, '请输入手机号')
    .refine((val) => validatePhone(val, 'zh-CN'), {
        message: '请输入有效的中国大陆手机号',
    })
