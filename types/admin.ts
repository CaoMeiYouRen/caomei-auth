/**
 * Admin 用户数据类型。
 *
 * 字段对齐 `better-auth` admin 插件的 `listUsers` / 用户详情返回；
 * 列表页只需要 `AdminUserRow`，对话框（详情、会话、禁用）使用 `AdminUserProfile` 的超集。
 */
export interface AdminUserRow {
    id: string
    name?: string | null
    email: string
    role?: string | null
    banned?: boolean | null
    image?: string | null
    createdAt: string | Date
}

export interface AdminUserProfile extends AdminUserRow {
    username?: string | null
    phoneNumber?: string | null
    emailVerified?: boolean | null
    phoneNumberVerified?: boolean | null
    banReason?: string | null
    banExpires?: string | Date | null
    updatedAt?: string | Date | null
}

/**
 * Admin OAuth 应用行。
 *
 * 字段对齐 `server/utils/oauth-client-view.ts` 的 `toAdminOAuthClientView`（管理端沿用 1.6 字段命名）；
 * 列表与编辑 / 密钥对话框共用同一视图，避免逐组件重复声明。
 */
export interface AdminOAuthApplicationRow {
    id: string
    clientId: string
    name: string
    description?: string | null
    redirectURLs?: string | null
    tokenEndpointAuthMethod?: string | null
    grantTypes?: string | null
    responseTypes?: string | null
    clientUri?: string | null
    logoUri?: string | null
    scope?: string | null
    contacts?: string | null
    tosUri?: string | null
    policyUri?: string | null
    jwksUri?: string | null
    jwks?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
    softwareId?: string | null
    softwareVersion?: string | null
    softwareStatement?: string | null
    type?: string | null
    disabled?: boolean | null
    createdAt: string | Date
    updatedAt?: string | Date | null
}

/** OAuth 应用创建响应（RFC 7591 风格字段，`/api/admin/oauth/applications` POST 返回） */
export interface AdminOAuthClientCredentials {
    client_id: string
    client_secret: string
    client_name: string
    scope?: string
    redirect_uris?: string[]
}

/** 用户会话行（`better-auth` admin `listUserSessions` 的最小字段集） */
export interface AdminUserSession {
    token: string
    userAgent?: string | null
    createdAt: string | Date
    expiresAt: string | Date
}
