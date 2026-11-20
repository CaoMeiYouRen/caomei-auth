import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

export type ChannelChangeType = 'email' | 'phone'
export type ChannelChangeStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'

/**
 * 待确认的联系方式改绑请求（阶段 9 M8）。
 *
 * 管理员或用户发起改绑时创建；用户在有效期内用新通道验证码确认后生效。
 * 只保留哈希后的验证码，禁止落盘明文。
 */
@Entity('channel_change_request')
export class ChannelChangeRequest extends BaseEntity {

    /** 被改绑的用户 */
    @CustomColumn({ type: 'varchar', length: 36, index: true })
    userId: string

    /** 通道类型 */
    @CustomColumn({ type: 'varchar', length: 16 })
    channel: ChannelChangeType

    /** 目标邮箱 / 手机号（规范化后的值） */
    @CustomColumn({ type: 'varchar', length: 255 })
    newValue: string

    /** 验证码哈希（sha256(requestId:code)） */
    @CustomColumn({ type: 'varchar', length: 64 })
    codeHash: string

    /** 请求状态 */
    @CustomColumn({ type: 'varchar', length: 16, default: 'pending' })
    status: ChannelChangeStatus

    /** 已尝试次数 */
    @CustomColumn({ type: 'integer', default: 0 })
    attempts: number

    /** 发起人（管理员）与原因 */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    requestedBy: string | null

    @CustomColumn({ type: 'text', nullable: true })
    reason: string | null

    /** 过期时间 */
    @CustomColumn({ type: 'datetime' })
    expiresAt: Date

    /** 确认时间 */
    @CustomColumn({ type: 'datetime', nullable: true })
    confirmedAt: Date | null
}
