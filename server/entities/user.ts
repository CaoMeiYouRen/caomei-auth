import { Entity, OneToOne, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { TwoFactor } from './two-factor'
import { Account } from './account'
import { Session } from './session'
import { OAuthApplication } from './oauth-application'
import { OAuthAccessToken } from './oauth-access-token'
import { OAuthConsent } from './oauth-consent'

@Entity('user')
export class User extends BaseEntity {

    /**
     * 用户选择的显示名称
     */
    @CustomColumn({ type: 'text', nullable: false })
    name: string

    /**
     * 用户邮箱地址，唯一
     */
    @CustomColumn({ type: 'varchar', index: true, unique: true, length: 255, nullable: false })
    email: string

    /**
     * 用户邮箱是否已验证
     */
    @CustomColumn({ type: 'boolean', default: false })
    emailVerified: boolean

    /**
     * 用户头像
     */
    @CustomColumn({ type: 'text', nullable: true })
    image: string

    /**
     * 用户名（全小写字母），唯一
     */
    @CustomColumn({ type: 'varchar', index: true, unique: true, length: 128, nullable: true })
    username: string

    /**
     * 非规范化用户名
     */
    @CustomColumn({ type: 'varchar', length: 128, nullable: true })
    displayUsername: string

    /**
     * 是否为匿名用户
     */
    @CustomColumn({ type: 'boolean', default: false })
    isAnonymous: boolean

    /**
     * 用户手机号，唯一
     */
    @CustomColumn({ type: 'varchar', index: true, unique: true, length: 64, nullable: true })
    phoneNumber: string

    /**
     * 用户手机号是否已验证
     */
    @CustomColumn({ type: 'boolean', default: false })
    phoneNumberVerified: boolean

    /**
     * 用户的角色。默认为 user。管理员为 admin。
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true, default: 'user' })
    role: string

    /**
     * 是否被禁止
     */
    @CustomColumn({ type: 'boolean', default: false })
    banned: boolean

    /**
     * 被禁止的原因
     */
    @CustomColumn({ type: 'text', nullable: true })
    banReason: string

    /**
     * 禁止过期时间（Unix 时间戳，秒）
     */
    @CustomColumn({ type: 'integer', nullable: true })
    banExpires: number

    /**
     * 是否启用两因素认证
     */
    @CustomColumn({ type: 'boolean', default: false })
    twoFactorEnabled: boolean

    // ========== 关系定义 ==========

    /**
     * 用户的两因素认证设置（一对一关系）
     */
    @OneToOne(() => TwoFactor, (twoFactor) => twoFactor.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    twoFactor?: TwoFactor

    /**
     * 用户的第三方账户（一对多关系）
     */
    @OneToMany(() => Account, (account) => account.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    account?: Account[]

    /**
     * 用户的会话（一对多关系）
     */
    @OneToMany(() => Session, (session) => session.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    sessions?: Session[]

    /**
     * 用户创建的 OAuth 应用（一对多关系）
     */
    @OneToMany(() => OAuthApplication, (application) => application.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    oauthApplications?: OAuthApplication[]

    /**
     * 用户的 OAuth 访问令牌（一对多关系）
     */
    @OneToMany(() => OAuthAccessToken, (token) => token.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    oauthAccessTokens?: OAuthAccessToken[]

    /**
     * 用户的 OAuth 授权同意（一对多关系）
     */
    @OneToMany(() => OAuthConsent, (consent) => consent.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    oauthConsents?: OAuthConsent[]

}
