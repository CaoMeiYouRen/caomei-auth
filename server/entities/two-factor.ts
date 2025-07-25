import { Entity, OneToOne, JoinColumn } from 'typeorm'
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
    @JoinColumn({ name: 'userId' })
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

}
