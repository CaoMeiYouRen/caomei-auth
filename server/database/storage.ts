import type { SecondaryStorage } from 'better-auth'
import { Redis } from 'ioredis'
import { LRUCache } from 'lru-cache'
import { REDIS_URL } from '@/utils/shared/env'

// 定义基础存储接口，包含 increment 方法
interface BaseStorage {
    get: (key: string) => Promise<string | null> | string | null
    /**
     *
     * @param key
     * @param value
     * @param ttl 秒数
     * @returns
     */
    set: (key: string, value: string, ttl?: number) => Promise<void | null | string> | void
    delete: (key: string) => Promise<void | null | string> | void
    /**
     *
     * @param key
     * @param ttl 秒数
     * @returns
     */
    increment: (key: string, ttl: number) => Promise<number>
    /**
     * 原子读取并删除
     *
     * @param key
     * @returns
     */
    getAndDelete: (key: string) => Promise<string | null>
}

// 初始化基础存储
const createBaseStorage = (): BaseStorage => {
    if (REDIS_URL) {
        const redis = new Redis(REDIS_URL)
        return {
            get: async (key: string) => {
                const value = await redis.get(key)
                return value ?? null
            },
            set: async (key: string, value: string, ttl?: number) => {
                if (ttl) {
                    await redis.set(key, value, 'EX', ttl)
                } else {
                    await redis.set(key, value)
                }
            },
            delete: async (key: string) => {
                await redis.del(key)
            },
            increment: async (key: string, ttl: number) => {
                const current = await redis.incr(key)
                if (current === 1) {
                    await redis.expire(key, ttl)
                }
                return current
            },
            getAndDelete: async (key: string) => redis.getdel(key),
        }
    }
    const memoryStorage = new LRUCache<string, string>({
        max: 1000,
        ttl: 1000 * 60 * 60,
    })
    return {
        get: async (key: string) => {
            const value = memoryStorage.get(key)
            return value ?? null
        },
        set: async (key: string, value: string, ttl?: number) => {
            memoryStorage.set(key, value, { ttl: ttl ? ttl * 1000 : undefined })
        },
        delete: async (key: string) => {
            memoryStorage.delete(key)
        },
        increment: async (key: string, ttl: number) => {
            const currentValue = memoryStorage.get(key)
            const current = (currentValue ? parseInt(currentValue, 10) : 0) + 1
            // 仅在首次创建时设置过期时间，避免后续自增不断延长计数窗口（与 Redis 实现保持一致）
            if (current === 1) {
                memoryStorage.set(key, current.toString(), { ttl: ttl * 1000 })
            } else {
                memoryStorage.set(key, current.toString())
            }
            return current
        },
        getAndDelete: async (key: string): Promise<string | null> => {
            const value = await memoryStorage.fetch(key)
            if (value === undefined) {
                return null
            }
            return value
        },
    }
}

// 创建基础存储实例
const baseStorage = createBaseStorage()

// 实现 SecondaryStorage 接口
const secondaryStorageImplementation: SecondaryStorage = {
    get: baseStorage.get,
    set: baseStorage.set,
    delete: baseStorage.delete,
    increment: baseStorage.increment,
    // better-auth 1.7 起 getAndDelete 为必实现方法，用于原子读取并删除
    getAndDelete: baseStorage.getAndDelete,
}

// 二级存储
export const secondaryStorage = secondaryStorageImplementation

// 限流存储
export const limiterStorage = baseStorage
