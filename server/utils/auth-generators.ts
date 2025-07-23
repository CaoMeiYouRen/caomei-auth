import { generateRandomString } from './random'
import { TEMP_EMAIL_DOMAIN_NAME } from '@/utils/env'

/**
 * 生成临时邮箱地址
 * 使用8位随机字符作为邮箱前缀
 * @returns {string} 临时邮箱地址
 */
export const getTempEmail = (): string => `${generateRandomString(8)}@${TEMP_EMAIL_DOMAIN_NAME}`

/**
 * 生成临时用户名
 * 使用8位随机字符作为用户名后缀
 * @param phoneNumber 手机号（可选参数，用于兼容原有接口）
 * @returns {string} 临时用户名
 */
export const getTempName = (phoneNumber?: string): string => `user-${generateRandomString(8)}`

/**
 * 生成OAuth客户端ID
 * 生成16位随机字符串并转换为小写
 * @returns {string} 客户端ID
 */
export const generateClientId = (): string => generateRandomString(16).toLowerCase()

/**
 * 生成OAuth客户端密钥
 * 生成32位随机字符串
 * TODO 考虑使用 crypto 模块生成更安全的密钥
 * @returns {string} 客户端密钥
 */
export const generateClientSecret = (): string => generateRandomString(32)

