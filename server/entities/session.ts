import { Column, Entity } from 'typeorm'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'

@Entity('session')
export class Session extends BaseEntity {

    @Column(getDateType(), { nullable: false })
    expiresAt: Date

    @Column('text', { nullable: false })
    token: string

    @Column('text', { nullable: true })
    ipAddress: string

    @Column('text', { nullable: true })
    userAgent: string

    @Column('varchar', { length: 36, nullable: false })
    userId: string

    /**
     * 正在模拟此会话的管理员的ID
     */
    @Column('varchar', { length: 36, nullable: true })
    impersonatedBy: string
}
