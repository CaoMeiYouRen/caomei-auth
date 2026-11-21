import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * 账号恢复码（阶段 10 M1）。
 *
 * 与 better-auth 的 2FA 备份码分离（D2）：
 * - 备份码用于「登录时替代 TOTP」，恢复码用于「通道全失时的自助恢复证明」；
 * - 只保存 sha256 哈希，明文在签发响应中出现一次，禁止落盘；
 * - 消费采用 `used_at IS NULL` 条件更新，并发双花只有一个成功。
 */
@Entity('recovery_code')
export class RecoveryCode extends BaseEntity {

    /** 所属用户 */
    @CustomColumn({ type: 'varchar', length: 36, index: true, nullable: false })
    userId: string

    /** 恢复码哈希（sha256(规范化后的明文)） */
    @CustomColumn({ type: 'varchar', length: 64, nullable: false })
    codeHash: string

    /** 消费时间；为空表示仍可用 */
    @CustomColumn({ type: 'datetime', nullable: true })
    usedAt: Date | null
}
