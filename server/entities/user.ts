import { Column, Entity } from 'typeorm'
import { BaseEntity } from './base-entity'

@Entity('user')
export class User extends BaseEntity {

    /**
     * 用户选择的显示名称
     */
    @Column('text', { nullable: false })
    name: string

    /**
     * 用户邮箱地址
    */
    @Column('varchar', { length: 255, nullable: false })
    email: string

    /**
     * 用户邮箱是否已验证
     */
    @Column('boolean', { default: false })
    emailVerified: boolean

    /**
     * 用户头像
     */
    @Column('text', { nullable: true })
    image: string

    /**
     * 用户名
     */
    @Column('varchar', { length: 128, nullable: true })
    username: string

    /**
     * 非规范化用户名
     */
    @Column('varchar', { length: 128, nullable: true })
    displayUsername: string

    /**
     * 是否为匿名用户
     */
    @Column('boolean', { default: false })
    isAnonymous: boolean

    /**
     * 用户手机号
     */
    @Column('varchar', { length: 64, nullable: true })
    phoneNumber: string

    /**
     * 用户手机号是否已验证
     */
    @Column('boolean', { default: false })
    phoneNumberVerified: boolean

    /**
     * 用户的角色。默认为 user。管理员为 admin。
     */
    @Column('varchar', { length: 32, nullable: true, default: 'user' })
    role: string

    /**
     * 是否被禁止
     */
    @Column('boolean', { default: false })
    banned: boolean

    /**
     * 被禁止的原因
     */
    @Column('text', { nullable: true })
    banReason: string

    /**
     * 禁止过期时间（Unix 时间戳，秒）
     */
    @Column('integer', { nullable: true })
    banExpires: number

}
