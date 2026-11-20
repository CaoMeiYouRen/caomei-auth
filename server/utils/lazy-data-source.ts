import type { DataSource } from 'typeorm'
import { dataSource } from '@/server/database'

/**
 * 延迟解析的 DataSource 代理。
 *
 * `server/database` 通过顶层 `await initializeDB()` 导出 `dataSource`；Nitro / Rollup
 * 可能把 `betterAuth()` 排在该赋值之前求值。适配器只在请求期调用方法，
 * 代理把属性读取延后到数据库初始化完成之后。
 */
export function createLazyDataSource(): DataSource {
    return new Proxy({} as DataSource, {
        get(_target, property) {
            const source = dataSource as DataSource
            const value = Reflect.get(source, property)
            return typeof value === 'function' ? value.bind(source) : value
        },
    })
}
