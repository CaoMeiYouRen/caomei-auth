import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 用户授权同意（better-auth 1.7 `oauthConsent` 模型）
 */
@Entity('oauth_consent')
export class OAuthConsent extends BaseEntity {
    /**
     * OAuth 客户端标识
     */
    @CustomColumn({ type: 'varchar', index: true, length: 191, nullable: false })
    clientId: string

    /**
     * 给予同意的用户 ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    userId: string

    /**
     * 关联的引用标识
     */
    @CustomColumn({ type: 'varchar', length: 191, nullable: true })
    referenceId: string

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
     * 授予的作用域
     */
    @CustomColumn({ type: 'simple-json', nullable: false })
    scopes: string[]
}
