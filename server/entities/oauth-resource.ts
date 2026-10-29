import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 受保护资源（better-auth 1.7 `oauthResource` 模型，RFC 8707 resource indicator）
 */
@Entity('oauth_resource')
export class OAuthResource extends BaseEntity {
    /**
     * 资源标识符（绝对 URI，无 fragment）
     *
     * 使用 varchar 而非 text：MySQL 无法直接在 text 列上建立唯一索引（需前缀长度）。
     */
    @CustomColumn({ type: 'varchar', length: 768, unique: true, nullable: false })
    identifier: string

    /**
     * 资源名称
     */
    @CustomColumn({ type: 'text', nullable: false })
    name: string

    /**
     * 访问令牌有效期（秒），null 表示继承插件默认值
     */
    @CustomColumn({ type: 'integer', nullable: true })
    accessTokenTtl: number

    /**
     * 刷新令牌有效期（秒），null 表示继承插件默认值
     */
    @CustomColumn({ type: 'integer', nullable: true })
    refreshTokenTtl: number

    /**
     * 签名算法
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    signingAlgorithm: string

    /**
     * 签名密钥 ID
     */
    @CustomColumn({ type: 'varchar', length: 191, nullable: true })
    signingKeyId: string

    /**
     * 允许的作用域
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    allowedScopes: string[]

    /**
     * 自定义声明
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    customClaims: Record<string, any>

    /**
     * 是否强制绑定 DPoP
     */
    @CustomColumn({ type: 'boolean', default: false })
    dpopBoundAccessTokensRequired: boolean

    /**
     * 是否已禁用
     */
    @CustomColumn({ type: 'boolean', default: false })
    disabled: boolean

    /**
     * 策略版本
     */
    @CustomColumn({ type: 'integer', default: 1 })
    policyVersion: number

    /**
     * 资源附加元数据
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    metadata: Record<string, any>
}
