import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 客户端（better-auth 1.7 `@better-auth/oauth-provider` 的 `oauthClient` 模型）
 *
 * 对应 1.6 的 `oauth_application` 表：`redirectURLs` 改为 `redirectUris` 数组，
 * `type` 改为 `applicationType`，`scope` 改为 `scopes` 数组。
 */
@Entity('oauth_client')
export class OAuthClient extends BaseEntity {
    /**
     * 每个 OAuth 客户端的唯一标识符
     */
    @CustomColumn({ type: 'varchar', length: 191, index: true, unique: true, nullable: false })
    clientId: string

    /**
     * OAuth 客户端的密钥（默认为哈希后的值）
     */
    @CustomColumn({ type: 'text', nullable: true })
    clientSecret: string

    /**
     * 客户端发现记录标识
     */
    @CustomColumn({ type: 'varchar', length: 191, nullable: true })
    clientDiscoveryId: string

    /**
     * 是否已禁用
     */
    @CustomColumn({ type: 'boolean', default: false })
    disabled: boolean

    /**
     * 是否跳过同意页面
     */
    @CustomColumn({ type: 'boolean', nullable: true })
    skipConsent: boolean

    /**
     * 是否启用 RP-Initiated Logout
     */
    @CustomColumn({ type: 'boolean', nullable: true })
    enableEndSession: boolean

    /**
     * subject 类型（public / pairwise）
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    subjectType: string

    /**
     * 客户端可请求的作用域
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    scopes: string[]

    /**
     * client_credentials 授权可用的作用域
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    clientCredentialsScopes: string[]

    /**
     * 拥有该客户端的用户 ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    userId: string

    /**
     * OAuth 客户端名称
     */
    @CustomColumn({ type: 'text', nullable: true })
    name: string

    /**
     * 应用描述（本项目扩展字段，不属于 better-auth oauthClient 模型）
     */
    @CustomColumn({ type: 'text', nullable: true })
    description: string

    /**
     * 应用 URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    uri: string

    /**
     * Logo URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    icon: string

    /**
     * 联系方式列表
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    contacts: string[]

    /**
     * 服务条款 URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    tos: string

    /**
     * 隐私政策 URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    policy: string

    /**
     * 软件 ID
     */
    @CustomColumn({ type: 'varchar', length: 64, nullable: true })
    softwareId: string

    /**
     * 软件版本
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    softwareVersion: string

    /**
     * 软件声明
     */
    @CustomColumn({ type: 'text', nullable: true })
    softwareStatement: string

    /**
     * 重定向 URI 列表
     */
    @CustomColumn({ type: 'simple-json', nullable: false })
    redirectUris: string[]

    /**
     * 登出后重定向 URI 列表
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    postLogoutRedirectUris: string[]

    /**
     * Back-channel logout URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    backchannelLogoutUri: string

    /**
     * Back-channel logout 是否需要 session 标识
     */
    @CustomColumn({ type: 'boolean', nullable: true })
    backchannelLogoutSessionRequired: boolean

    /**
     * 令牌端点认证方法
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    tokenEndpointAuthMethod: string

    /**
     * 应用类型（web / native）
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    applicationType: string

    /**
     * 客户端 JWKS
     */
    @CustomColumn({ type: 'text', nullable: true })
    jwks?: string

    /**
     * 客户端 JWKS URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    jwksUri: string

    /**
     * 授权类型列表
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    grantTypes: string[]

    /**
     * 响应类型列表
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    responseTypes: string[]

    /**
     * 是否强制 PKCE
     */
    @CustomColumn({ type: 'boolean', nullable: true })
    requirePKCE: boolean

    /**
     * 是否绑定 DPoP 访问令牌
     */
    @CustomColumn({ type: 'boolean', default: false })
    dpopBoundAccessTokens: boolean

    /**
     * 关联的引用标识
     */
    @CustomColumn({ type: 'varchar', length: 191, nullable: true })
    referenceId: string

    /**
     * 客户端附加元数据
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>
}
