import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * OAuth `private_key_jwt` 客户端断言的单次使用记录（better-auth 1.7 `oauthClientAssertion` 模型）
 *
 * 主键为断言标识的摘要，重复或并发断言会命中主键冲突而原子失败。
 */
@Entity('oauth_client_assertion')
export class OAuthClientAssertion extends BaseEntity {
    /**
     * 断言过期时间，过期后该行可被清理
     */
    @CustomColumn({ type: 'datetime', nullable: false })
    expiresAt: Date
}
