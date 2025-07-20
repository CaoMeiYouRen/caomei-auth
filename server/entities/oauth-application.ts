import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('oauth_application')
export class OAuthApplication extends BaseEntity {
    /**
     * 每个OAuth客户端的唯一标识符
     */
    @CustomColumn({ type: 'text', index: true, unique: true, nullable: false })
    clientId: string

    /**
     * OAuth客户端的密钥
     */
    @CustomColumn({ type: 'text', nullable: false })
    clientSecret: string

    /**
     * OAuth客户端的名称
     */
    @CustomColumn({ type: 'text', nullable: false })
    name: string

    /**
     * 重定向URL的逗号分隔列表
     */
    @CustomColumn({ type: 'text', nullable: false })
    redirectURLs: string

    /**
     * OAuth客户端的附加元数据
     */
    @CustomColumn({ type: 'text', nullable: true })
    metadata: string

    /**
     * OAuth客户端的类型（例如，web，移动）
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: false })
    type: string

    /**
     * 指示客户端是否已禁用
     */
    @CustomColumn({ type: 'boolean', default: false })
    disabled: boolean

    /**
     * 拥有该客户端的用户的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    userId: string
}
