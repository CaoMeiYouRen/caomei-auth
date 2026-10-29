import { Entity, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth 客户端与受保护资源的关联表（better-auth 1.7 `oauthClientResource` 模型）
 *
 * 仅在 `enforcePerClientResources` 开启时生效；`clientId` 与 `resourceId`
 * 分别存储 `oauthClient.clientId` 与 `oauthResource.identifier`。
 */
@Entity('oauth_client_resource')
@Index(['clientId', 'resourceId'], { unique: true })
export class OAuthClientResource extends BaseEntity {
    /**
     * OAuth 客户端标识
     */
    @CustomColumn({ type: 'varchar', index: true, length: 191, nullable: false })
    clientId: string

    /**
     * 受保护资源标识
     */
    @CustomColumn({ type: 'varchar', index: true, length: 512, nullable: false })
    resourceId: string

    /**
     * 关联附加元数据
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    metadata: Record<string, any>
}
