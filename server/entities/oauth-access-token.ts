import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('oauth_access_token')
export class OAuthAccessToken extends BaseEntity {
    /**
     * 颁发给客户端的访问令牌
     */
    @CustomColumn({ type: 'text', index: true, nullable: false })
    accessToken: string

    /**
     * 颁发给客户端的刷新令牌
     */
    @CustomColumn({ type: 'text', index: true, nullable: true })
    refreshToken: string

    /**
     * 访问令牌的过期日期
     */
    @CustomColumn({ type: 'datetime', nullable: false })
    accessTokenExpiresAt: Date

    /**
     * 刷新令牌的过期日期
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    refreshTokenExpiresAt: Date

    /**
     * OAuth客户端的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    clientId: string

    /**
     * 与令牌关联的用户的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    userId: string

    /**
     * 授予的作用域的逗号分隔列表
     */
    @CustomColumn({ type: 'text', nullable: true })
    scopes: string
}
