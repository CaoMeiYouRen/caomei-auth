import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 访问令牌（better-auth 1.7 `oauthAccessToken` 模型）
 *
 * 仅在访问令牌没有 resource audience 声明（非 JWT）时落库，默认以哈希形式存储。
 */
@Entity('oauth_access_token')
export class OAuthAccessToken extends BaseEntity {
    /**
     * 访问令牌（默认为哈希值）
     */
    @CustomColumn({ type: 'varchar', index: true, unique: true, length: 255, nullable: false })
    token: string

    /**
     * OAuth 客户端标识
     */
    @CustomColumn({ type: 'varchar', index: true, length: 191, nullable: false })
    clientId: string

    /**
     * 关联的会话 ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    sessionId: string

    /**
     * 关联的用户 ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    userId: string

    /**
     * 关联的引用标识
     */
    @CustomColumn({ type: 'varchar', length: 191, nullable: true })
    referenceId: string

    /**
     * 授权码标识
     */
    @CustomColumn({ type: 'varchar', index: true, length: 191, nullable: true })
    authorizationCodeId: string

    /**
     * 资源标识列表
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    resources: string[]

    /**
     * 请求的 userinfo 声明
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    requestedUserInfoClaims: string[]

    /**
     * 关联的刷新令牌 ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    refreshId: string

    /**
     * 过期时间
     */
    @CustomColumn({ type: 'datetime', nullable: false })
    expiresAt: Date

    /**
     * 吊销时间
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    revoked: Date

    /**
     * 确认信息
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    confirmation: Record<string, any>

    /**
     * 授予的作用域
     */
    @CustomColumn({ type: 'simple-json', nullable: false })
    scopes: string[]
}
