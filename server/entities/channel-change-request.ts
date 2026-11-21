import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

export type ChannelChangeType = 'email' | 'phone'
export type ChannelChangeStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'
/** 发起方：管理员协助（即时生效）或用户自助（冷静期后生效） */
export type ChannelChangeSource = 'admin' | 'user'

/**
 * 待确认 / 待生效的联系方式改绑请求（阶段 9 M8，阶段 10 M2.1 扩展）。
 *
 * - `source` 区分管理员协助与用户自助；自助请求必须经过冷静期，不能被管理员确认端点消费；
 * - `scheduledAt` 非空表示冷静期模型：只有到点才生效，`expiresAt` 此时只用于验证码窗口；
 * - `cancelledAt` 记录取消时间，供状态判定与倒计时展示；
 * - `proofFactor` 记录用户自助申请时使用的恢复因子类型（不含验证码明文）。
 *
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

    /** 发起方；老数据回填为 admin */
    @CustomColumn({ type: 'varchar', length: 16, default: 'admin' })
    source: ChannelChangeSource

    /** 已尝试次数 */
    @CustomColumn({ type: 'integer', default: 0 })
    attempts: number

    /** 发起人（管理员）与原因 */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    requestedBy: string | null

    @CustomColumn({ type: 'text', nullable: true })
    reason: string | null

    /** 验证码窗口截止时间（阶段 9 语义；自助请求不用于生效判定） */
    @CustomColumn({ type: 'datetime' })
    expiresAt: Date

    /** 冷静期结束（生效）时间；为空表示即时确认模型 */
    @CustomColumn({ type: 'datetime', nullable: true })
    scheduledAt: Date | null

    /** 取消时间 */
    @CustomColumn({ type: 'datetime', nullable: true })
    cancelledAt: Date | null

    /** 用户自助申请使用的恢复因子类型 */
    @CustomColumn({ type: 'varchar', length: 16, nullable: true })
    proofFactor: string | null

    /** 确认（归属验证通过 / 管理员确认）时间；生效时间另由 scheduledAt 判定 */
    @CustomColumn({ type: 'datetime', nullable: true })
    confirmedAt: Date | null
}
