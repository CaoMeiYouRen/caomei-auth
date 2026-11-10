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
    password: z.string().min(1, 'validation.passwordRequired'),
})

// 邮箱验证码登录表单 Schema
export const loginEmailOtpFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 用户名登录表单 Schema
export const loginUsernameFormSchema = z.object({
    username: usernameSchema,
    password: z.string().min(1, 'validation.passwordRequired'),
})

// 手机号登录表单 Schema
export const loginPhoneFormSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(1, 'validation.passwordRequired'),
})

// 手机号验证码登录表单 Schema
export const loginPhoneOtpFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// ========== 忘记密码表单 Schemas ==========

// 邮箱找回密码表单 Schema
export const forgotPasswordEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, 'validation.emailCodeRequired'),
})

// 手机号找回密码表单 Schema
export const forgotPasswordPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, 'validation.smsCodeRequired'),
})

// 重置密码表单 Schema (用于忘记密码后的密码重置)
export const resetPasswordFormBaseSchema = z.object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'validation.confirmNewPasswordRequired'),
})

export const resetPasswordFormSchema = resetPasswordFormBaseSchema.refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
})

// ========== 快速登录表单 Schemas ==========

// 邮箱验证码快速登录表单 Schema
export const quickLoginEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 手机号验证码快速登录表单 Schema
export const quickLoginPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 注册表单 Schema (Email)
export const registerEmailFormBaseSchema = z.object({
    nickname: nicknameSchema,
    username: usernameSchema.optional().or(z.literal('')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
})

export const registerEmailFormSchema = registerEmailFormBaseSchema.refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
})

// 注册表单 Schema (Phone)
export const registerPhoneFormSchema = z.object({
    nickname: nicknameSchema,
    username: usernameSchema.optional().or(z.literal('')),
    phone: phoneSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 注册表单 Schema (通用 - 仅用于类型定义或统一导出，实际校验建议使用上面两个)
export const registerFormSchema = z.union([registerEmailFormSchema, registerPhoneFormSchema])

// 修改密码表单 Schema
export const changePasswordFormBaseSchema = z.object({
    currentPassword: z.string().min(1, 'validation.currentPasswordRequired'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'validation.confirmNewPasswordRequired'),
})

export const changePasswordFormSchema = changePasswordFormBaseSchema.refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'validation.sameAsCurrentPassword',
    path: ['newPassword'],
})

// 设置用户名表单 Schema
export const setUsernameFormSchema = z.object({
    username: usernameSchema,
})

// 修改邮箱表单 Schema
export const editEmailFormSchema = z.object({
    email: emailSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 修改手机号表单 Schema
export const editPhoneFormSchema = z.object({
    phone: phoneSchema,
    code: z.string().min(1, 'validation.codeRequired'),
})

// 管理员创建用户表单 Schema
export const createUserFormSchema = z.object({
    name: nicknameSchema, // 昵称 (对应 API 的 name 字段)
    email: emailSchema,
    username: z.string().default(''), // 用户名可选，默认为空字符串
    password: passwordSchema,
    role: z.string().min(1, 'validation.roleRequired'),
})

// 管理员更新用户表单 Schema
export const updateUserFormSchema = z.object({
    nickname: nicknameSchema,
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    role: z.string().min(1, 'validation.roleRequired'),
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
    message: 'validation.appNameRequired',
    path: ['client_name'],
}).refine((data) => data.redirect_uris || data.redirectURLs, {
    message: 'validation.redirectUrisRequired',
    path: ['redirect_uris'],
})

// OAuth Application Update Schema
export const oauthApplicationUpdateSchema = oauthApplicationBaseSchema.partial()

// SSO Provider Schema
export const ssoProviderBaseSchema = z.object({
    type: z.enum(['oidc', 'saml']),
    providerId: z.string().min(1, 'validation.providerIdRequiredEn'),
    name: z.string().optional(),
    description: z.string().optional(),
    issuer: z.string().min(1, 'validation.issuerRequiredEn'),
    domain: z.string().min(1, 'validation.domainRequiredEn'),
    organizationId: z.string().optional(),
    enabled: z.boolean().optional(),
    metadataUrl: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    oidcConfig: z.object({
        clientId: z.string().min(1, 'validation.clientIdRequiredEn'),
        clientSecret: z.string().min(1, 'validation.clientSecretRequiredEn'),
        authorizationUrl: z.string().optional(),
        tokenUrl: z.string().optional(),
        userInfoUrl: z.string().optional(),
    }).optional(),
    samlConfig: z.object({
        entryPoint: z.string().min(1, 'validation.entryPointRequiredEn'),
        cert: z.string().min(1, 'validation.certRequiredEn'),
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
    message: 'validation.configRequired',
    path: ['type'],
})

// SSO Provider Update Schema
export const ssoProviderUpdateSchema = ssoProviderBaseSchema.partial()

// Admin Role Sync Schema
export const adminRoleSyncSchema = z.object({
    userId: z.string().min(1, 'validation.missingUserId'),
    action: z.enum(['sync', 'add', 'remove']),
})

// Revoke Consent Schema
export const revokeConsentSchema = z.object({
    clientId: z.string({ message: 'validation.missingClientId' }).min(1, 'validation.missingClientId'),
})

// ========== 前端表单专用 Schemas ==========

// OAuth 应用前端表单 Schema
export const oauthApplicationFormSchema = z.object({
    client_name: z.string().min(1, 'validation.clientNameRequired'),
    description: z.string().optional(),
    redirect_uris: z.array(z.string().min(1, 'validation.redirectUrlRequired'))
        .min(1, 'validation.atLeastOneRedirectUrl')
        .refine((urls) => urls.every((url) => validateUrl(url)), {
            message: 'validation.redirectUrlInvalid',
        }),
    client_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: 'validation.clientUriInvalid',
    }),
    logo_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: 'validation.logoUriInvalid',
    }),
    scope: z.string().min(1, 'validation.scopeRequired'),
    contacts: z.array(z.string()).optional().refine((emails) => !emails || emails.every((email) => validateEmail(email)), {
        message: 'validation.contactEmailInvalid',
    }),
    tos_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: 'validation.tosUriInvalid',
    }),
    policy_uri: z.string().optional().refine((val) => !val || validateUrl(val), {
        message: 'validation.policyUriInvalid',
    }),
    token_endpoint_auth_method: z.enum(['none', 'client_secret_basic', 'client_secret_post']),
    grant_types: z.array(z.enum(['authorization_code', 'refresh_token']))
        .min(1, 'validation.atLeastOneGrantType'),
    response_types: z.array(z.enum(['code']))
        .min(1, 'validation.atLeastOneResponseType'),
    software_id: z.string().optional(),
    software_version: z.string().optional(),
    disabled: z.boolean().optional(),
})

// SSO 提供商前端表单 Schema
export const ssoProviderFormSchema = z.object({
    type: z.enum(['oidc', 'saml']),
    providerId: z.string().min(1, 'validation.providerIdRequired'),
    name: z.string().optional(),
    description: z.string().optional(),
    issuer: z.string().min(1, 'validation.issuerUrlRequired')
        .refine((val) => validateUrl(val), {
            message: 'validation.issuerUrlInvalid',
        }),
    domain: z.string().min(1, 'validation.domainRequired'),
    organizationId: z.string().optional(),
    enabled: z.boolean().optional(),
    oidcConfig: z.object({
        clientId: z.string().min(1, 'validation.clientIdRequired'),
        clientSecret: z.string().min(1, 'validation.clientSecretRequired'),
        discoveryEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'validation.discoveryEndpointInvalid',
        }),
        authorizationEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'validation.authorizationEndpointInvalid',
        }),
        tokenEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'validation.tokenEndpointInvalid',
        }),
        userInfoEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'validation.userInfoEndpointInvalid',
        }),
        jwksEndpoint: z.string().optional().refine((val) => !val || validateUrl(val), {
            message: 'validation.jwksEndpointInvalid',
        }),
        scopes: z.array(z.string()).optional(),
        pkce: z.boolean().optional(),
        mapping: z.object({
            email: z.string().optional(),
            emailVerified: z.string().optional(),
            name: z.string().optional(),
            image: z.string().optional(),
        }).optional(),
    }).optional(),
    samlConfig: z.object({
        entryPoint: z.string().min(1, 'validation.samlEntryPointRequired')
            .refine((val) => validateUrl(val), {
                message: 'validation.samlEntryPointInvalid',
            }),
        certificate: z.string().min(1, 'validation.certificateRequired'),
        signingKey: z.string().optional(),
        attributeConsumingServiceIndex: z.number().optional(),
        mapping: z.object({
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
    message: 'validation.ssoConfigRequired',
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
