import { describe, expect, it } from 'vitest'
import { getApiErrorMessage, getAuthResponseError, throwIfAuthError } from '@/utils/shared/api-error'

describe('utils/shared/api-error', () => {
    it('优先使用服务端本地化文案（error.data.message）', () => {
        const error = Object.assign(new Error('[POST] "https://example.com/api/admin/users": 500 服务器内部错误'), {
            data: { message: '该用户已存在' },
        })
        expect(getApiErrorMessage(error, '操作失败')).toBe('该用户已存在')
    })

    it('无 data 时回退到普通 Error 文案', () => {
        expect(getApiErrorMessage(new Error('网络连接超时'), '操作失败')).toBe('网络连接超时')
    })

    it('屏蔽 ofetch 技术串', () => {
        expect(getApiErrorMessage(new Error('[GET] "https://example.com/api/admin/logs": 500 服务器错误'), '操作失败'))
            .toBe('操作失败')
        expect(getApiErrorMessage(new Error('[POST] https://example.com/api/admin/users: 500 服务器错误'), '操作失败'))
            .toBe('操作失败')
    })

    it('忽略空白 message 与非对象错误', () => {
        expect(getApiErrorMessage(new Error('   '), '操作失败')).toBe('操作失败')
        expect(getApiErrorMessage('boom', '操作失败')).toBe('操作失败')
        expect(getApiErrorMessage(undefined, '操作失败')).toBe('操作失败')
    })

    it('data.message 不是字符串时回退', () => {
        const error = Object.assign(new Error('fallback message'), { data: { message: 500 } })
        expect(getApiErrorMessage(error, '操作失败')).toBe('fallback message')
    })
})

describe('getAuthResponseError', () => {
    it('无 error 时返回 null（成功分支）', () => {
        expect(getAuthResponseError({ data: {} })).toBeNull()
        expect(getAuthResponseError(undefined)).toBeNull()
    })

    it('返回 better-auth 的错误文案，缺失时返回空串交给本地化兜底', () => {
        expect(getAuthResponseError({ error: { message: '用户已存在' } })).toBe('用户已存在')
        expect(getAuthResponseError({ error: { message: '  ' } })).toBe('')
        expect(getAuthResponseError({ error: {} })).toBe('')
    })
})

describe('throwIfAuthError', () => {
    it('成功响应不抛错', () => {
        expect(() => throwIfAuthError({ data: {} }, '操作失败')).not.toThrow()
        expect(() => throwIfAuthError(undefined, '操作失败')).not.toThrow()
    })

    it('失败时抛出可展示文案，缺失文案时使用本地化兜底', () => {
        expect(() => throwIfAuthError({ error: { message: '用户已存在' } }, '操作失败')).toThrow('用户已存在')
        expect(() => throwIfAuthError({ error: {} }, '操作失败')).toThrow('操作失败')
    })
})
