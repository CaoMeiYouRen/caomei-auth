import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('oauth_application')
export class OAuthApplication extends BaseEntity {
    /**
     * 每个OAuth客户端的唯一标识符
     */
    @CustomColumn({ type: 'text', index: true, unique: true, nullable: false })
    clientId: string

    /**
     * OAuth客户端的密钥
     */
    @CustomColumn({ type: 'text', nullable: false })
    clientSecret: string

    /**
     * OAuth客户端的名称
     */
    @CustomColumn({ type: 'text', nullable: false })
    name: string

    /**
     * OAuth客户端的描述
     */
    @CustomColumn({ type: 'text', nullable: true })
    description: string

    /**
     * 重定向URL的列表
     */
    @CustomColumn({ type: 'text', nullable: false })
    redirectURLs: string

    /**
     * 令牌端点认证方法
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true, default: 'client_secret_basic' })
    tokenEndpointAuthMethod: string

    /**
     * 授权类型列表
     */
    @CustomColumn({ type: 'text', nullable: true })
    grantTypes: string

    /**
     * 响应类型列表
     */
    @CustomColumn({ type: 'text', nullable: true })
    responseTypes: string

    /**
     * 应用URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    clientUri: string

    /**
     * Logo URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    logoUri: string

    /**
     * 作用域
     */
    @CustomColumn({ type: 'text', nullable: true })
    scope: string

    /**
     * 联系方式列表
     */
    @CustomColumn({ type: 'text', nullable: true })
    contacts: string

    /**
     * 服务条款URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    tosUri: string

    /**
     * 隐私政策URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    policyUri: string

    /**
     * JWKS URI
     */
    @CustomColumn({ type: 'text', nullable: true })
    jwksUri: string

    /**
     * JWKS
     */
    @CustomColumn({ type: 'text', nullable: true })
    jwks: string

    /**
     * OAuth客户端的附加元数据
     */
    @CustomColumn({ type: 'text', nullable: true })
    metadata: string

    /**
     * 软件ID
     */
    @CustomColumn({ type: 'varchar', length: 64, nullable: true })
    softwareId: string

    /**
     * 软件版本
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    softwareVersion: string

    /**
     * 软件声明
     */
    @CustomColumn({ type: 'text', nullable: true })
    softwareStatement: string

    /**
     * OAuth客户端的类型（例如，web，移动）
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: false })
    type: string

    /**
     * 指示客户端是否已禁用
     */
    @CustomColumn({ type: 'boolean', default: false })
    disabled: boolean

    /**
     * 拥有该客户端的用户的ID
     */
    @CustomColumn({ type: 'varchar', index: true, length: 36, nullable: true })
    userId: string
}
