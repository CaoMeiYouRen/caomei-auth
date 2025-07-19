import { parse } from 'better-bytes'
import ms from 'ms'

/**
 * 基础配置
 * 包含服务器基本设置、备案信息等
 */
// 雪花算法机器 ID。默认为进程 ID 对 1024 取余数，也可以手动指定
export const MACHINE_ID = Number(process.env.MACHINE_ID || process.pid % 1024)
// Better Auth 的基础 URL
export const AUTH_BASE_URL = process.env.NUXT_PUBLIC_AUTH_BASE_URL || import.meta.env.NUXT_PUBLIC_AUTH_BASE_URL as string || ''
// 联系邮箱
export const CONTACT_EMAIL = import.meta.env.NUXT_PUBLIC_CONTACT_EMAIL as string
// ICP备案号
export const ICP_BEIAN_NUMBER = import.meta.env.NUXT_PUBLIC_ICP_BEIAN_NUMBER
// 公安备案号
export const PUBLIC_SECURITY_BEIAN_NUMBER = import.meta.env.NUXT_PUBLIC_PUBLIC_SECURITY_BEIAN_NUMBER
// 用于加密、签名和哈希的密钥。生产环境必须设置
export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || ''
// 应用名称
export const APP_NAME = process.env.NUXT_PUBLIC_APP_NAME || import.meta.env.NUXT_PUBLIC_APP_NAME as string || '草梅Auth'

/**
 * 文件上传配置
 * 包含文件上传大小限制、每日限额等设置
 */
// 存储类型，可选值：s3, vercel-blob
export const STORAGE_TYPE = process.env.STORAGE_TYPE || ''
// 文件名前缀
export const BUCKET_PREFIX = process.env.BUCKET_PREFIX || ''
// 最大允许上传的文件大小，默认 4.5 MiB
export const MAX_UPLOAD_SIZE_TEXT = import.meta.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE as string || '4.5MiB'
export const MAX_UPLOAD_SIZE = Number(parse(MAX_UPLOAD_SIZE_TEXT))
// 限流时间窗口（默认1天）
export const UPLOAD_LIMIT_WINDOW = Number(process.env.UPLOAD_LIMIT_WINDOW || ms('1d') / 1000)
// 文件上传每日限制
export const UPLOAD_DAILY_LIMIT = Number(process.env.UPLOAD_DAILY_LIMIT || '100')
// 单个用户每日上传文件限制
export const UPLOAD_SINGLE_USER_DAILY_LIMIT = Number(process.env.UPLOAD_SINGLE_USER_DAILY_LIMIT || '5')

// S3 相关配置
export const S3_BASE_URL = process.env.S3_BASE_URL
export const S3_REGION = process.env.S3_REGION
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
export const S3_ENDPOINT = process.env.S3_ENDPOINT
// Vercel Blob 配置
export const VERCEL_BLOB_TOKEN = process.env.VERCEL_BLOB_TOKEN
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

/**
 * 数据库配置
 * 支持 SQLite、MySQL、PostgreSQL
 */
// 数据库类型：sqlite, mysql, postgres
export const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite'
// 数据库连接 URL (MySQL和PostgreSQL使用)
export const DATABASE_URL = process.env.DATABASE_URL
// SQLite 数据库路径 (仅SQLite使用)
export const DATABASE_PATH = process.env.DATABASE_PATH || 'database/caomei-auth.sqlite'
// 是否启用 SSL 连接 (true/false)
export const DATABASE_SSL = process.env.DATABASE_SSL === 'true'
// 数据库字符集 (仅MySQL使用)
export const DATABASE_CHARSET = process.env.DATABASE_CHARSET || 'utf8_general_ci'
// 数据库时区 (仅MySQL使用)
export const DATABASE_TIMEZONE = process.env.DATABASE_TIMEZONE || 'local'
// 数据库表前缀
export const DATABASE_ENTITY_PREFIX = process.env.DATABASE_ENTITY_PREFIX || 'caomei_auth_'

/**
 * Redis配置（可选）
 */
// Redis 连接地址
export const REDIS_URL = process.env.REDIS_URL

/**
 * 短信服务配置
 * 目前提供Spug渠道作为示例，如有需要，可在issue或discussion中提出其他渠道，会看情况适配
 */
// 是否启用短信发送功能（包含注册、登录、绑定、找回密码等页面）
export const PHONE_ENABLED = import.meta.env.NUXT_PUBLIC_PHONE_ENABLED === 'true'
// 短信发件渠道
export const PHONE_CHANNEL = process.env.PHONE_CHANNEL || ''
// Spug短信模板ID，在Spug短信模板配置中获取
export const PHONE_SPUG_TEMPLATE_ID = process.env.PHONE_SPUG_TEMPLATE_ID || ''
// 短信发件人名称，默认使用 应用名称
export const PHONE_SENDER_NAME = process.env.PHONE_SENDER_NAME || APP_NAME || '草梅Auth'
// 短信验证码有效时间（秒）
export const PHONE_EXPIRES_IN = Number(process.env.PHONE_EXPIRES_IN || 300)
// 短信验证码每日发送上限（全局限制）
export const PHONE_DAILY_LIMIT = Number(process.env.PHONE_DAILY_LIMIT || 100)
// 单个手机号每日验证码发送上限
export const PHONE_SINGLE_USER_DAILY_LIMIT = Number(process.env.PHONE_SINGLE_USER_DAILY_LIMIT || 3)
// 限流时间窗口
export const PHONE_LIMIT_WINDOW = Number(process.env.PHONE_LIMIT_WINDOW || ms('1d') / 1000)

/**
 * 邮件服务配置
 * SMTP 服务器配置和邮件发送限制
 */
// SMTP 服务器地址
export const EMAIL_HOST = process.env.EMAIL_HOST
// SMTP 服务器端口
export const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587
// 是否使用SSL连接邮件服务器
export const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'
// 邮件发送者地址
export const EMAIL_USER = process.env.EMAIL_USER
// 邮件发送者密码
export const EMAIL_PASS = process.env.EMAIL_PASS
// 默认邮件发送者名称和地址
export const EMAIL_FROM = process.env.EMAIL_FROM
// 邮箱验证码每日发送上限（全局限制）
export const EMAIL_DAILY_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT || 100)
// 单个邮箱每日验证码发送上限
export const EMAIL_SINGLE_USER_DAILY_LIMIT = Number(process.env.EMAIL_SINGLE_USER_DAILY_LIMIT || 5)
// 限流时间窗口
export const EMAIL_LIMIT_WINDOW = Number(process.env.EMAIL_LIMIT_WINDOW || ms('1d') / 1000)
// 邮件验证码有效时间（秒）
export const EMAIL_EXPIRES_IN = Number(process.env.EMAIL_EXPIRES_IN || 300)

// 匿名和临时邮箱配置
export const ANONYMOUS_EMAIL_DOMAIN_NAME = process.env.ANONYMOUS_EMAIL_DOMAIN_NAME || 'anonymous.com'
export const TEMP_EMAIL_DOMAIN_NAME = process.env.TEMP_EMAIL_DOMAIN_NAME || 'example.com'

/**
 * 社交登录配置
 */
// 匿名登录配置。如果启用，则允许用户不填写用户名、密码、邮箱的情况下即可直接登录
export const ANONYMOUS_LOGIN_ENABLED = process.env.ANONYMOUS_LOGIN_ENABLED === 'true'
// GitHub 配置
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
// Google 配置
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
// Microsoft 配置
export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET
// Discord 配置
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
// 微博配置
export const WEIBO_CLIENT_ID = process.env.WEIBO_CLIENT_ID
export const WEIBO_CLIENT_SECRET = process.env.WEIBO_CLIENT_SECRET
export const WEIBO_REDIRECT_URI = process.env.WEIBO_REDIRECT_URI
export const WEIBO_SCOPES = process.env.WEIBO_SCOPES?.split(',').map((e) => e.trim()).filter(Boolean) || []
// QQ 配置
export const QQ_CLIENT_ID = process.env.QQ_CLIENT_ID
export const QQ_CLIENT_SECRET = process.env.QQ_CLIENT_SECRET
export const QQ_REDIRECT_URI = process.env.QQ_REDIRECT_URI
export const QQ_USE_UNIONID = process.env.QQ_USE_UNIONID === 'true'

/**
 * 管理员配置
 */
// 管理员用户ID列表
export const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',').map((e) => e.trim()).filter(Boolean) || []

