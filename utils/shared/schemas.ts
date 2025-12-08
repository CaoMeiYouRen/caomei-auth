import { z } from 'zod'
import {
    emailSchema,
    phoneSchema,
    usernameSchema,
    nicknameSchema,
    passwordSchema,
} from './validators'

// 注册表单 Schema (Email)
export const registerEmailFormSchema = z.object({
    nickname: nicknameSchema,
    username: usernameSchema.optional().or(z.literal('')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
})

// 注册表单 Schema (Phone)
export const registerPhoneFormSchema = z.object({
    nickname: nicknameSchema,
    username: usernameSchema.optional().or(z.literal('')),
    phone: phoneSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 注册表单 Schema (通用 - 仅用于类型定义或统一导出，实际校验建议使用上面两个)
export const registerFormSchema = z.union([registerEmailFormSchema, registerPhoneFormSchema])

// 修改密码表单 Schema
export const changePasswordFormSchema = z.object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密码不能与当前密码相同',
    path: ['newPassword'],
})

// 设置用户名表单 Schema
export const setUsernameFormSchema = z.object({
    username: usernameSchema,
})

// 修改邮箱表单 Schema
export const editEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 修改手机号表单 Schema
export const editPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 管理员创建用户表单 Schema
export const createUserFormSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.string().min(1, '请选择角色'),
    nickname: nicknameSchema.optional(),
})

// 管理员更新用户表单 Schema
export const updateUserFormSchema = z.object({
    nickname: nicknameSchema,
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    role: z.string().min(1, '请选择角色'),
    password: passwordSchema.optional().or(z.literal('')),
})
