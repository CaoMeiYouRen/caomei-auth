import { PrimaryColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm'
import { snowflake } from '../utils/snowflake'

/**
 * 基础实体类
 * 该类定义了所有实体的基础字段，包括 ID、创建时间和更新时间。
 *
 * @author CaoMeiYouRen
 * @date 2025-06-22
 * @export
 * @abstract
 * @class BaseEntity
 */
export abstract class BaseEntity {

    @PrimaryColumn('varchar', { length: 36 })
    id: string

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date

    @BeforeInsert()
    private setId() {
        if (!this.id) {
            this.id = snowflake.generateId() // 生成唯一的 ID
        }
    }
}
