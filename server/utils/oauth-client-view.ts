import { createHash } from 'node:crypto'
import type { OAuthClient } from '@/server/entities/oauth-client'

const splitToList = (value?: string | null) => (value ? value.split(',').filter(Boolean) : [])

const splitToScopes = (value?: string | null) => (value ? value.split(/[\s,]+/).filter(Boolean) : [])

/**
 * 按 better-auth 默认的客户端密钥哈希算法（SHA-256 + base64url，无 padding）存储密钥。
 *
 * @see @better-auth/oauth-provider 的 `storeClientSecret: "hashed"` 默认实现
 */
export const hashClientSecret = (secret: string) => createHash('sha256').update(secret).digest('base64url')

/**
 * 将 `oauth_client` 实体转换为管理端沿用 1.6 字段命名的视图，
 * 避免前端管理页面因 1.7 字段重命名而整体改写。
 */
export function toAdminOAuthClientView(client: OAuthClient) {
    return {
        id: client.id,
        clientId: client.clientId,
        name: client.name,
        description: client.description,
        redirectURLs: (client.redirectUris ?? []).join(','),
        tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
        grantTypes: (client.grantTypes ?? []).join(','),
        responseTypes: (client.responseTypes ?? []).join(','),
        clientUri: client.uri,
        logoUri: client.icon,
        scope: (client.scopes ?? []).join(' '),
        contacts: (client.contacts ?? []).join(','),
        tosUri: client.tos,
        policyUri: client.policy,
        jwksUri: client.jwksUri,
        jwks: client.jwks ? safeJsonParse(client.jwks) : null,
        metadata: client.metadata ?? null,
        softwareId: client.softwareId,
        softwareVersion: client.softwareVersion,
        softwareStatement: client.softwareStatement,
        type: client.applicationType,
        disabled: client.disabled,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
    }
}

/**
 * 将管理端的 1.6 字段映射回 1.7 的 `oauth_client` 字段
 */
export function applyOAuthClientInput(client: OAuthClient, input: {
    name?: string
    description?: string
    redirectURLs?: string
    tokenEndpointAuthMethod?: string
    grantTypes?: string
    responseTypes?: string
    clientUri?: string
    logoUri?: string
    scope?: string
    contacts?: string
    tosUri?: string
    policyUri?: string
    jwksUri?: string
    jwks?: unknown
    metadata?: Record<string, unknown> | null
    softwareId?: string
    softwareVersion?: string
    softwareStatement?: string
    type?: string
    disabled?: boolean
}) {
    if (input.name !== undefined) {
        client.name = input.name
    }
    if (input.description !== undefined) {
        client.description = input.description
    }
    if (input.redirectURLs !== undefined) {
        client.redirectUris = splitToList(input.redirectURLs)
    }
    if (input.tokenEndpointAuthMethod !== undefined) {
        client.tokenEndpointAuthMethod = input.tokenEndpointAuthMethod
    }
    if (input.grantTypes !== undefined) {
        client.grantTypes = splitToList(input.grantTypes)
    }
    if (input.responseTypes !== undefined) {
        client.responseTypes = splitToList(input.responseTypes)
    }
    if (input.clientUri !== undefined) {
        client.uri = input.clientUri
    }
    if (input.logoUri !== undefined) {
        client.icon = input.logoUri
    }
    if (input.scope !== undefined) {
        client.scopes = splitToScopes(input.scope)
    }
    if (input.contacts !== undefined) {
        client.contacts = splitToList(input.contacts)
    }
    if (input.tosUri !== undefined) {
        client.tos = input.tosUri
    }
    if (input.policyUri !== undefined) {
        client.policy = input.policyUri
    }
    if (input.jwksUri !== undefined) {
        client.jwksUri = input.jwksUri
    }
    if (input.jwks !== undefined) {
        client.jwks = input.jwks ? JSON.stringify(input.jwks) : undefined
    }
    if (input.metadata !== undefined) {
        client.metadata = input.metadata ?? undefined
    }
    if (input.softwareId !== undefined) {
        client.softwareId = input.softwareId
    }
    if (input.softwareVersion !== undefined) {
        client.softwareVersion = input.softwareVersion
    }
    if (input.softwareStatement !== undefined) {
        client.softwareStatement = input.softwareStatement
    }
    if (input.type !== undefined) {
        client.applicationType = input.type
    }
    if (input.disabled !== undefined) {
        client.disabled = input.disabled
    }
    return client
}

function safeJsonParse(value: string) {
    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}
