import { Entity, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/** 注册控制规则类型：邮箱域名 / 手机号国家码 */
export type RegistrationRuleType = 'email-domain' | 'phone-country'
/** allow 为白名单（非空时仅放行列内），deny 为黑名单（命中即拒绝） */
export type RegistrationRuleMode = 'allow' | 'deny'

@Entity('registration_rule')
@Index('IDX_registration_rule_unique', ['type', 'mode', 'value'], { unique: true })
export class RegistrationRule extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 32 })
    type: RegistrationRuleType

    @CustomColumn({ type: 'varchar', length: 8 })
    mode: RegistrationRuleMode

    /** 域名（小写，可带前导点表示后缀匹配）或国家码（形如 +86） */
    @CustomColumn({ type: 'varchar', length: 128 })
    value: string

    @CustomColumn({ type: 'boolean', default: true })
    enabled: boolean

    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    note: string | null
}
