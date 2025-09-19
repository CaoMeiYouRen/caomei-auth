import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * JWKS 实体类
 * 用于存储 JSON Web Key Set 相关信息
 */
@Entity('jwks')
export class Jwks extends BaseEntity {

    /**
     * 网络密钥的公共部分
     */
    @CustomColumn({ type: 'text', nullable: false })
    publicKey: string

    /**
     * 网络密钥的私有部分
     */
    @CustomColumn({ type: 'text', nullable: false })
    privateKey: string

}
