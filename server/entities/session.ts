import { Entity, Index } from 'typeorm'
import { getDateType } from '../database/type'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('session')
export class Session extends BaseEntity {

    @CustomColumn({ type: 'datetime', nullable: false })
    expiresAt: Date

    @CustomColumn({ type: 'text', index: true, nullable: false })
    token: string

    @CustomColumn({ type: 'text', nullable: true })
    ipAddress: string

    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string

    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: false })
    userId: string

    /**
     * 正在模拟此会话的管理员的ID
     */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    impersonatedBy: string
}
