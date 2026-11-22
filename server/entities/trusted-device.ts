import { Entity, Index, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

/**
 * 可信设备（阶段 12 M4.1 / D23）。
 *
 * 上游 better-auth 只用 `verification` 行（`trust-device-*`）+ `trust_device` cookie 表达信任，
 * 没有 UA / IP 字段；本表在「2FA 验证并勾选信任设备」成功后采集展示所需元数据。
 * `identifier` 与上游 verification.identifier 同值，吊销时两表必须同时删除。
 */
@Entity('trusted_device')
@Index('IDX_trusted_device_user_created_at', ['userId', 'createdAt'])
@Index('IDX_trusted_device_identifier', ['identifier'], { unique: true })
export class TrustedDevice extends BaseEntity {

    /** 所属用户 */
    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    userId: string

    /** 上游 `trust-device-*` identifier；唯一，用于与 verification 行对齐 */
    @CustomColumn({ type: 'varchar', length: 128, nullable: false })
    identifier: string

    /** 设备 UA 摘要（原始值，展示端截断） */
    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string | null

    /** 最近一次使用 IP */
    @CustomColumn({ type: 'text', nullable: true })
    ip: string | null

    /** 信任过期时间（与 verification 行一致） */
    @CustomColumn({ type: 'datetime', nullable: false })
    expiresAt: Date

    /** 最近一次使用时间 */
    @CustomColumn({ type: 'datetime', nullable: false })
    lastUsedAt: Date

    /** 所属用户；用户删除时级联清理可信设备 */
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    user: User
}
