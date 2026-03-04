import { z } from 'zod'
import {
    emailSchema,
    phoneSchema,
    usernameSchema,
    nicknameSchema,
    passwordSchema,
} from './validators'
import { validateEmail, validateUrl } from './validate'

// ========== 登录表单 Schemas ==========

// 邮箱登录表单 Schema
export const loginEmailFormSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, '请输入密码'),
})

// 邮箱验证码登录表单 Schema
export const loginEmailOtpFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 用户名登录表单 Schema
export const loginUsernameFormSchema = z.object({
    username: usernameSchema,
    password: z.string().min(1, '请输入密码'),
})

// 手机号登录表单 Schema
export const loginPhoneFormSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(1, '请输入密码'),
})

// 手机号验证码登录表单 Schema
export const loginPhoneOtpFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, '请输入验证码'),
})

// ========== 忘记密码表单 Schemas ==========

// 邮箱找回密码表单 Schema
export const forgotPasswordEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, '请输入邮箱验证码'),
})

// 手机号找回密码表单 Schema
export const forgotPasswordPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, '请输入短信验证码'),
})

// 重置密码表单 Schema (用于忘记密码后的密码重置)
export const resetPasswordFormBaseSchema = z.object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, '请确认新密码'),
})

export const resetPasswordFormSchema = resetPasswordFormBaseSchema.refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
})

// ========== 快速登录表单 Schemas ==========

// 邮箱验证码快速登录表单 Schema
export const quickLoginEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 手机号验证码快速登录表单 Schema
export const quickLoginPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, '请输入验证码'),
})

// 注册表单 Schema (Email)
export const registerEmailFormBaseSchema = z.object({
    nickname: nicknameSchema,
    username: usernameSchema.optional().or(z.literal('')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, '请确认密码'),
})

export const registerEmailFormSchema = registerEmailFormBaseSchema.refine((data) => data.password === data.confirmPassword, {
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
export const changePasswordFormBaseSchema = z.object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, '请确认新密码'),
})

export const changePasswordFormSchema = changePasswordFormBaseSchema.refine((data) => data.newPassword === data.confirmPassword, {
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
    name: nicknameSchema, // 昵称 (对应 API 的 name 字段)
    email: emailSchema,
    username: z.string().default(''), // 用户名可选，默认为空字符串
    password: passwordSchema,
    role: z.string().min(1, '请选择角色'),
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
export const ssoProviderBaseSchema = z.object({
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
})

export const ssoProviderSchema = ssoProviderBaseSchema.refine((data) => {
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
export const ssoProviderUpdateSchema = ssoProviderBaseSchema.partial()

// Admin Role Sync Schema
export const adminRoleSyncSchema = z.object({
    userId: z.string().min(1, '缺少必要参数 userId'),
    action: z.enum(['sync', 'add', 'remove']),
})

// Revoke Consent Schema
export const revokeConsentSchema = z.object({
    clientId: z.string({ message: '缺少客户端ID' }).min(1, '缺少客户端ID'),
})

// ========== 前端表单专用 Schemas ==========

// OAuth 应用前端表单 Schema
export const oauthApplicationFormSchema = z.object({
    client_name: z.string().min(1, '应用名称不能为空'),
    description: z.string().optional(),
    redirect_uris: z.array(z.string().min(1, '重定向URL不能为空'))
        .min(1, '至少需要一个重定向URL')
        .refine((urls) => urls.every((url) => validateUrl(url)), {
            message: '重定向URL格式无效',
        }),
    client_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: '应用主页格式无效',
    }),
    logo_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: '应用Logo格式无效',
    }),
    scope: z.string().min(1, '授权范围不能为空'),
    contacts: z.array(z.string()).optional().refine((emails) => !emails || emails.every((email) => validateEmail(email)), {
        message: '联系邮箱格式无效',
    }),
    tos_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: '服务条款链接格式无效',
    }),
    policy_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: '隐私政策链接格式无效',
    }),
    token_endpoint_auth_method: z.enum(['none', 'client_secret_basic', 'client_secret_post']),
    grant_types: z.array(z.enum(['authorization_code', 'refresh_token']))
        .min(1, '至少需要选择一种授权类型'),
    response_types: z.array(z.enum(['code']))
        .min(1, '至少需要选择一种响应类型'),
    software_id: z.string().optional(),
    software_version: z.string().optional(),
    disabled: z.boolean().optional(),
})

// SSO 提供商前端表单 Schema
export const ssoProviderFormSchema = z.object({
    type: z.enum(['oidc', 'saml']),
    providerId: z.string().min(1, 'Provider ID 不能为空'),
    name: z.string().optional(),
    description: z.string().optional(),
    issuer: z.string().min(1, '发行者 URL 不能为空')
        .refine((val) => validateUrl(val), {
            message: '发行者 URL 格式无效',
        }),
    domain: z.string().min(1, '域名不能为空'),
    organizationId: z.string().optional(),
    enabled: z.boolean().optional(),
    oidcConfig: z.object({
        clientId: z.string().min(1, 'Client ID 不能为空'),
        clientSecret: z.string().min(1, 'Client Secret 不能为空'),
        discoveryEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'Discovery Endpoint 格式无效',
        }),
        authorizationEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'Authorization Endpoint 格式无效',
        }),
        tokenEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'Token Endpoint 格式无效',
        }),
        userInfoEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'UserInfo Endpoint 格式无效',
        }),
        jwksEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'JWKS Endpoint 格式无效',
        }),
        scopes: z.array(z.string()).optional(),
        pkce: z.boolean().optional(),
        mapping: z.object({
            id: z.string().optional(),
            email: z.string().optional(),
            emailVerified: z.string().optional(),
            name: z.string().optional(),
            image: z.string().optional(),
        }).optional(),
    }).optional(),
    samlConfig: z.object({
        entryPoint: z.string().min(1, 'SAML 入口点 URL 不能为空')
            .refine((val) => validateUrl(val), {
                message: 'SAML 入口点 URL 格式无效',
            }),
        certificate: z.string().min(1, 'X.509 证书不能为空'),
        signingKey: z.string().optional(),
        attributeConsumingServiceIndex: z.number().optional(),
        mapping: z.object({
            id: z.string().optional(),
            email: z.string().optional(),
            name: z.string().optional(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
        }).optional(),
    }).optional(),
}).refine((data) => {
    if (data.type === 'oidc') {
        return !!data.oidcConfig
    }
    if (data.type === 'saml') {
        return !!data.samlConfig
    }
    return true
}, {
    message: '配置不能为空',
    path: ['type'],
})

// ========== 类型导出 ==========
export type LoginEmailForm = z.infer<typeof loginEmailFormSchema>
export type LoginEmailOtpForm = z.infer<typeof loginEmailOtpFormSchema>
export type LoginUsernameForm = z.infer<typeof loginUsernameFormSchema>
export type LoginPhoneForm = z.infer<typeof loginPhoneFormSchema>
export type LoginPhoneOtpForm = z.infer<typeof loginPhoneOtpFormSchema>
export type ForgotPasswordEmailForm = z.infer<typeof forgotPasswordEmailFormSchema>
export type ForgotPasswordPhoneForm = z.infer<typeof forgotPasswordPhoneFormSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>
export type QuickLoginEmailForm = z.infer<typeof quickLoginEmailFormSchema>
export type QuickLoginPhoneForm = z.infer<typeof quickLoginPhoneFormSchema>
export type RegisterEmailForm = z.infer<typeof registerEmailFormSchema>
export type RegisterPhoneForm = z.infer<typeof registerPhoneFormSchema>
export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>
export type SetUsernameForm = z.infer<typeof setUsernameFormSchema>
export type EditEmailForm = z.infer<typeof editEmailFormSchema>
export type EditPhoneForm = z.infer<typeof editPhoneFormSchema>
export type CreateUserForm = z.infer<typeof createUserFormSchema>
export type UpdateUserForm = z.infer<typeof updateUserFormSchema>
export type OAuthApplicationForm = z.infer<typeof oauthApplicationSchema>
export type SSOProviderForm = z.infer<typeof ssoProviderSchema>
export type OAuthApplicationFormData = z.infer<typeof oauthApplicationFormSchema>
export type SSOProviderFormData = z.infer<typeof ssoProviderFormSchema>
