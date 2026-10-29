import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 刷新令牌（better-auth 1.7 `oauthRefreshToken` 模型）
 *
 * 默认以哈希形式存储，令牌与 session 绑定。
 */
@Entity('oauth_refresh_token')
export class OAuthRefreshToken extends BaseEntity {
    /**
     * 刷新令牌（默认为哈希值）
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
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
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
     * 轮换时间
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    rotatedAt: Date

    /**
     * 轮换重放响应缓存
     */
    @CustomColumn({ type: 'text', nullable: true })
    rotationReplayResponse: string

    /**
     * 轮换重放响应过期时间
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    rotationReplayExpiresAt: Date

    /**
     * 认证时间
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    authTime: Date

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
