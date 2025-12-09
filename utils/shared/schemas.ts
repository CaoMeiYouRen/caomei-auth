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

// OAuth Application Base Schema
export const oauthApplicationBaseSchema = z.object({
    client_name: z.string().optional(),
    name: z.string().optional(),
    redirect_uris: z.union([z.array(z.string()), z.string()]).optional(),
    redirectURLs: z.union([z.array(z.string()), z.string()]).optional(),
    token_endpoint_auth_method: z.string().default('client_secret_basic'),
    grant_types: z.array(z.string()).default(['authorization_code']),
    response_types: z.array(z.string()).default(['code']),
    client_uri: z.string().optional(),
    logo_uri: z.string().optional(),
    scope: z.string().optional(),
    contacts: z.array(z.string()).optional(),
    tos_uri: z.string().optional(),
    policy_uri: z.string().optional(),
    jwks_uri: z.string().optional(),
    jwks: z.any().optional(),
    metadata: z.any().optional(),
    software_id: z.string().optional(),
    software_version: z.string().optional(),
    software_statement: z.string().optional(),
    type: z.string().default('web'),
    disabled: z.boolean().default(false),
    description: z.string().optional(),
})

// OAuth Application Schema (Create)
export const oauthApplicationSchema = oauthApplicationBaseSchema.refine((data) => data.client_name || data.name, {
    message: '应用名称是必需的 (client_name 或 name)',
    path: ['client_name'],
}).refine((data) => data.redirect_uris || data.redirectURLs, {
    message: '重定向URI是必需的 (redirect_uris 或 redirectURLs)',
    path: ['redirect_uris'],
})

// OAuth Application Update Schema
export const oauthApplicationUpdateSchema = oauthApplicationBaseSchema.partial()

// SSO Provider Schema
export const ssoProviderSchema = z.object({
    type: z.enum(['oidc', 'saml']),
    providerId: z.string().min(1, 'Provider ID is required'),
    name: z.string().optional(),
    description: z.string().optional(),
    issuer: z.string().min(1, 'Issuer is required'),
    domain: z.string().min(1, 'Domain is required'),
    organizationId: z.string().optional(),
    enabled: z.boolean().optional(),
    metadataUrl: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    oidcConfig: z.object({
        clientId: z.string().min(1, 'Client ID is required'),
        clientSecret: z.string().min(1, 'Client Secret is required'),
        authorizationUrl: z.string().optional(),
        tokenUrl: z.string().optional(),
        userInfoUrl: z.string().optional(),
    }).optional(),
    samlConfig: z.object({
        entryPoint: z.string().min(1, 'Entry Point is required'),
        cert: z.string().min(1, 'Cert is required'),
        issuer: z.string().optional(),
    }).optional(),
    additionalConfig: z.any().optional(),
}).refine((data) => {
    if (data.type === 'oidc') {
        return !!data.oidcConfig
    }
    if (data.type === 'saml') {
        return !!data.samlConfig
    }
    return true
}, {
    message: 'Config is required for the selected type',
    path: ['type'],
})

// SSO Provider Update Schema
export const ssoProviderUpdateSchema = ssoProviderSchema.partial()

// Admin Role Sync Schema
export const adminRoleSyncSchema = z.object({
    userId: z.string().min(1, '缺少必要参数 userId'),
    action: z.enum(['sync', 'add', 'remove']),
})

// Revoke Consent Schema
export const revokeConsentSchema = z.object({
    clientId: z.string().min(1, '缺少客户端ID'),
})
