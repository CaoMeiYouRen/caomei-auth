import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

/**
 * SSO 提供商实体
 * 用于存储 SSO（单点登录）提供商的配置信息，支持 OIDC 和 SAML 协议
 *
 * @author CaoMeiYouRen
 * @date 2025-08-04
 * @export
 * @class SSOProvider
 */
@Entity('sso_provider')
export class SSOProvider extends BaseEntity {
    /**
     * 发行者标识符
     * 用于唯一标识 SSO 提供商
     */
    @CustomColumn({ type: 'text', nullable: false, index: true })
    issuer: string

    /**
     * 提供商的域名
     * 用于域名匹配和路由
     */
    @CustomColumn({ type: 'varchar', length: 255, nullable: false, index: true })
    domain: string

    /**
     * OIDC 配置
     * 存储 OpenID Connect 提供商的配置信息（JSON 字符串格式）
     */
    @CustomColumn({ type: 'text', nullable: true })
    oidcConfig: string

    /**
     * SAML 配置
     * 存储 SAML 提供商的配置信息（JSON 字符串格式）
     */
    @CustomColumn({ type: 'text', nullable: true })
    samlConfig: string

    /**
     * 提供商 ID
     * 用于标识提供商并生成重定向 URL
     */
    @CustomColumn({ type: 'varchar', length: 128, nullable: false, index: true, unique: true })
    providerId: string

    /**
     * 组织 ID
     * 如果提供商链接到组织，则存储组织 ID
     */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    organizationId: string

    /**
     * 用户 ID
     * 关联的用户 ID（创建或管理此提供商配置的用户）
     */
    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    userId: string

    /**
     * 关联的用户实体
     */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User

    /**
     * 提供商名称
     * 用于显示的友好名称
     */
    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    name: string

    /**
     * 提供商描述
     */
    @CustomColumn({ type: 'text', nullable: true })
    description: string

    /**
     * 提供商状态
     * 是否启用该提供商
     */
    @CustomColumn({ type: 'boolean', default: true })
    enabled: boolean

    /**
     * 提供商类型
     * 标识是 OIDC 还是 SAML 提供商
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: false, default: 'oidc' })
    type: 'oidc' | 'saml'

    /**
     * 元数据 URL
     * 用于自动发现提供商配置的 URL
     */
    @CustomColumn({ type: 'text', nullable: true })
    metadataUrl: string

    /**
     * 客户端 ID
     * 在提供商处注册的客户端标识符
     */
    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    clientId: string

    /**
     * 客户端密钥
     * 在提供商处注册的客户端密钥
     */
    @CustomColumn({ type: 'text', nullable: true })
    clientSecret: string

    /**
     * 重定向 URI
     * 授权后的回调地址
     */
    @CustomColumn({ type: 'text', nullable: true })
    redirectUri: string

    /**
     * 作用域
     * 请求的权限范围
     */
    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    scopes: string

    /**
     * 附加配置
     * 存储其他自定义配置选项（JSON 字符串格式）
     */
    @CustomColumn({ type: 'text', nullable: true })
    additionalConfig: string
}
