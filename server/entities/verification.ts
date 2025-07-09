import { Column, Entity, Index } from 'typeorm'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'

@Entity('verification')
export class Verification extends BaseEntity {

    @Index()
    @Column('text', { nullable: false })
    identifier: string

    @Column('text', { nullable: false })
    value: string

    @Column(getDateType(), { nullable: false })
    expiresAt: Date
}
