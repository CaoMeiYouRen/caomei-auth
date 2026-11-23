import { Entity, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import type { LoginEventChannel, LoginEventResult, LoginEventType } from '@/utils/shared/login-events'

/**
 * 登录事件（阶段 12 M1.1 / D18）。
 *
 * 登录事件是管理端事件查询、统计与热力图的唯一数据源：
 * - 只记录必要元数据，不落密码、验证码、令牌、备份码 / 恢复码（D20）；
 * - `userId` 可空，用于匿名或未知用户的失败事件，不设外键（避免用户删除后丢失取证记录）；
 * - 索引覆盖时间轴与常用筛选维度（类型 / 用户 / 结果 / 通道 / IP），查询默认按 `createdAt` 倒序。
 *
 * 写入与清理入口见 `server/utils/login-events/repository.ts`；保留期与
 * 节流清理在 M1.3 接入。
 */
@Entity('login_event')
@Index('IDX_login_event_created_at', ['createdAt'])
@Index('IDX_login_event_type_created_at', ['type', 'createdAt'])
@Index('IDX_login_event_user_id_created_at', ['userId', 'createdAt'])
@Index('IDX_login_event_result_created_at', ['result', 'createdAt'])
@Index('IDX_login_event_channel_created_at', ['channel', 'createdAt'])
@Index('IDX_login_event_ip_created_at', ['ip', 'createdAt'])
export class LoginEvent extends BaseEntity {

    /** 事件类型（固定枚举，见 `utils/shared/login-events.ts`） */
    @CustomColumn({ type: 'varchar', length: 32, nullable: false })
    type: LoginEventType

    /** 事件结果：成功 / 失败 */
    @CustomColumn({ type: 'varchar', length: 16, nullable: false })
    result: LoginEventResult

    /** 登录通道；无法归类的通道写 `unknown` */
    @CustomColumn({ type: 'varchar', length: 32, nullable: false, default: 'unknown' })
    channel: LoginEventChannel

    /** 关联用户；匿名 / 未知用户的失败事件为空 */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    userId: string | null

    /**
     * 请求来源 IP（与既有会话口径一致，不做匿名化）。
     *
     * `varchar(45)` 覆盖 IPv6 文本上限；MySQL 无法对 `TEXT` 建全列索引，
     * 因此改定长类型并由 `IDX_login_event_ip_created_at` 支撑 IP 精确筛选（D26）。
     */
    @CustomColumn({ type: 'varchar', length: 45, nullable: true })
    ip: string | null

    /** 请求 User-Agent，展示端负责截断 */
    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string | null

    /**
     * 脱敏后的补充字段（仅 `LOGIN_EVENT_METADATA_KEYS` 白名单中的扁平标量，
     * 如 provider / factor / reason），写入前经 `sanitizeLoginEventMetadata` 过滤。
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    metadata: Record<string, unknown> | null
}
