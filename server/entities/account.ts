import { Column, Entity, Index } from 'typeorm'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'

@Entity('account')
export class Account extends BaseEntity {

    @Column('text', { nullable: false })
    accountId: string

    @Column('text', { nullable: false })
    providerId: string

    @Index()
    @Column('varchar', { length: 36, nullable: false })
    userId: string

    @Column('text', { nullable: true })
    accessToken: string

    @Column('text', { nullable: true })
    refreshToken: string

    @Column('text', { nullable: true })
    idToken: string

    @Column(getDateType(), { nullable: true })
    accessTokenExpiresAt: Date

    @Column(getDateType(), { nullable: true })
    refreshTokenExpiresAt: Date

    @Column('text', { nullable: true })
    scope: string

    @Column('text', { nullable: true })
    password: string

}
