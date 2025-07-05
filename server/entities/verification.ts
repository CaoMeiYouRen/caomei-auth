import { Column, Entity } from 'typeorm'
import { BaseEntity } from './base-entity'

@Entity('verification')
export class Verification extends BaseEntity {

    @Column('text', { nullable: false })
    identifier: string

    @Column('text', { nullable: false })
    value: string

    @Column('timestamp with time zone', { nullable: false })
    expiresAt: Date
}
