import { Entity, OneToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

@Entity('two_factor')
export class TwoFactor extends BaseEntity {

    /**
     * 关联的用户ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    userId: string

    /**
     * 关联的用户（一对一关系）
     */
    @OneToOne(() => User, (user) => user.twoFactor, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    user: User

    /**
     * TOTP 密钥
     */
    @CustomColumn({ type: 'text', nullable: false })
    secret: string

    /**
     * 备份恢复码（JSON 数组；better-auth 默认明文存储，开启加密时才为密文）
     */
    @CustomColumn({ type: 'text', nullable: true })
    backupCodes: string

    /**
     * 是否已完成 2FA 验证（better-auth 1.7 新增）
     */
    @CustomColumn({ type: 'boolean', default: true, nullable: false })
    verified: boolean

    /**
     * 连续验证失败次数（better-auth 1.7 新增）
     */
    @CustomColumn({ type: 'integer', default: 0, nullable: false })
    failedVerificationCount: number

    /**
     * 锁定截止时间（better-auth 1.7 新增）
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    lockedUntil: Date

    /**
     * 最近一次被消费的 TOTP 时间步（阶段 10 M2.2）。
     *
     * 恢复证明消费 TOTP 时以 CAS 推进该值，保证同一时间步只能成功一次；
     * 不参与 better-auth 的登录校验。
     */
    @CustomColumn({ type: 'integer', nullable: true })
    lastUsedTimeStep: number | null

}
