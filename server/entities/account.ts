import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

@Entity('account')
export class Account extends BaseEntity {

    @CustomColumn({ type: 'text', nullable: false })
    accountId: string

    @CustomColumn({ type: 'text', nullable: false })
    providerId: string

    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    userId: string

    @CustomColumn({ type: 'text', nullable: true })
    accessToken: string

    @CustomColumn({ type: 'text', nullable: true })
    refreshToken: string

    @CustomColumn({ type: 'text', nullable: true })
    idToken: string

    @CustomColumn({ type: 'datetime', nullable: true })
    accessTokenExpiresAt: Date

    @CustomColumn({ type: 'datetime', nullable: true })
    refreshTokenExpiresAt: Date

    @CustomColumn({ type: 'text', nullable: true })
    scope: string

    @CustomColumn({ type: 'text', nullable: true })
    password: string

    // ========== 关系定义 ==========

    /**
     * 关联的用户（多对一关系）
     */
    @ManyToOne(() => User, (user) => user.account, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    user: User

}
