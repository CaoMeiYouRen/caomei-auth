/**
 * Demo 模式相关类型定义
 */

/**
 * 假数据用户信息
 */
export interface DemoUser {
    id?: string
    name: string
    username?: string
    email: string
    emailVerified: boolean
    image?: string
    role?: string
    status?: 'active' | 'inactive' | 'suspended'
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
    phoneNumber?: string
    phoneNumberVerified?: boolean
}

/**
 * 假数据 OAuth 应用信息
 */
export interface DemoOAuthApplication {
    id: string
    name: string
    clientId: string
    clientSecret: string
    redirectUris: string[]
    description?: string
    logo?: string
    scopes: string[]
    status: 'active' | 'inactive'
    createdAt: Date
    updatedAt: Date
    authorizedUsers?: number
}

/**
 * 假数据登录日志信息
 */
export interface DemoLoginLog {
    id: string
    userId: string
    userEmail: string
    userName: string
    ip: string
    userAgent: string
    location?: string
    loginMethod: 'password' | 'email' | 'phone' | 'oauth' | 'sso'
    provider?: string
    success: boolean
    failureReason?: string
    createdAt: Date
}

/**
 * 假数据 SSO 提供商信息
 */
export interface DemoSSOProvider {
    id: string
    name: string
    type: 'oauth2' | 'saml' | 'oidc'
    providerId: string
    clientId: string
    clientSecret: string
    issuerUrl?: string
    authorizationUrl?: string
    tokenUrl?: string
    userInfoUrl?: string
    scopes?: string[]
    enabled: boolean
    logo?: string
    description?: string
    createdAt: Date
    updatedAt: Date
    usersCount?: number
}

/**
 * 假数据统计信息
 */
export interface DemoStats {
    totalUsers: number
    activeUsers: number
    totalLogins: number
    todayLogins: number
    totalOAuthApps: number
    activeOAuthApps: number
    totalSSOProviders: number
    activeSSOProviders: number
}

/**
 * Demo 模式配置
 */
export interface DemoConfig {
    enabled: boolean
    adminUser: DemoUser
    normalUser: DemoUser
    password: string
}
