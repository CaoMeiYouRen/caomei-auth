import { useFetch, navigateTo, type UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'
import { useToast } from 'primevue/usetoast'

/**
 * API 响应接口
 */
export interface ApiResponse<T = any> {
    code: number
    message: string
    data: T
}

/**
 * 封装 useFetch，提供统一的错误处理和配置
 * @param url 请求地址
 * @param options 请求配置
 */
export function useApi<T = any>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
    const toast = useToast()

    const defaults: UseFetchOptions<T> = {
        // 默认 key，避免重复请求
        key: typeof url === 'function' ? url() : url,

        // 请求拦截
        onRequest({ options: requestOptions }) {
            // 可以在这里添加 Authorization 头等
            // requestOptions.headers = requestOptions.headers || {}
        },

        // 响应拦截
        onResponse({ response }) {
            // 可以在这里处理统一的响应数据结构
        },

        // 错误处理
        onResponseError({ response }) {
            const status = response.status
            const message = (response._data as any)?.message || response.statusText || '请求失败'

            // 401 未授权，跳转登录
            if (status === 401) {
                toast.add({
                    severity: 'error',
                    summary: '认证失效',
                    detail: '请重新登录',
                    life: 3000,
                })
                navigateTo('/login')
                return
            }

            // 403 无权限
            if (status === 403) {
                toast.add({
                    severity: 'error',
                    summary: '权限不足',
                    detail: '您没有权限执行此操作',
                    life: 3000,
                })
                return
            }

            // 其他错误
            toast.add({
                severity: 'error',
                summary: '请求错误',
                detail: message,
                life: 3000,
            })
        },
    }

    // 合并配置
    const params = defu(options, defaults)

    return useFetch(url, params)
}
