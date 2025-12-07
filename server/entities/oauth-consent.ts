import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { OAuthApplication } from './oauth-application'

@Entity('oauth_consent')
export class OAuthConsent extends BaseEntity {
    /**
     * 给予同意的用户的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    userId: string

    /**
     * OAuth客户端的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    clientId: string

    /**
     * 同意的作用域的逗号分隔列表
     */
    @CustomColumn({ type: 'text', nullable: true })
    scopes: string

    /**
     * 指示是否给予了同意
     */
    @CustomColumn({ type: 'boolean', default: false })
    consentGiven: boolean

    // ========== 关系定义 ==========

    /**
     * 关联的 OAuth 客户端（多对一关系）
     */
    @ManyToOne(() => OAuthApplication, (client) => client.consents, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    client: OAuthApplication

    /**
     * 关联的用户（多对一关系）
     */
    @ManyToOne(() => User, (user) => user.oauthConsents, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    user: User
}
