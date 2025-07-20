import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

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
}
