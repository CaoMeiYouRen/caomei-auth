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
     * 备份恢复码（用逗号分隔的哈希值）
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

}
