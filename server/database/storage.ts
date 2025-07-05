import { SecondaryStorage } from 'better-auth'
import { Redis } from 'ioredis'
import { LRUCache } from 'lru-cache'

let storage: SecondaryStorage = null as any

export const initializeStorage = (): SecondaryStorage => {
    if (storage) {
        return storage
    }
    if (process.env.REDIS_URL) {
        const redis = new Redis(process.env.REDIS_URL)
        storage = {
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
        }
        return storage
    }
    // 使用 LRU 缓存作为内存存储
    const memoryStorage = new LRUCache<string, string>({
        max: 1000, // 最大缓存条目数
        ttl: 1000 * 60 * 60, // 默认 TTL 为 1 小时
    })

    storage = {
        get: async (key: string) => {
            if (secondaryStorage) {
                return secondaryStorage.get(key)
            }
            return memoryStorage.get(key) ?? null
        },
        set: async (key: string, value: string, ttl?: number) => {
            if (secondaryStorage) {
                await secondaryStorage.set(key, value, ttl)
            } else {
                memoryStorage.set(key, value, { ttl })
            }
        },
        delete: async (key: string) => {
            if (secondaryStorage) {
                await secondaryStorage.delete(key)
            } else {
                memoryStorage.delete(key)
            }
        },
    }
    return storage
}
// 二级存储
export const secondaryStorage = initializeStorage()
