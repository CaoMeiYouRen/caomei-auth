import { Entity, Index } from 'typeorm'
import { getDateType } from '../database/type'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('verification')
@Index(['identifier', 'value']) // 复合索引，提高查询性能
export class Verification extends BaseEntity {

    @Index()
    @CustomColumn({ type: 'text', nullable: false })
    identifier: string

    @CustomColumn({ type: 'text', nullable: false })
    value: string

    @CustomColumn({ type: 'datetime', nullable: false })
    expiresAt: Date
}
