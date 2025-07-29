import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'
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
    @Column('text')
    publicKey: string

    /**
     * 网络密钥的私有部分
     */
    @Column('text')
    privateKey: string

}
