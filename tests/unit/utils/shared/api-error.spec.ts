import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '@/utils/shared/api-error'

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
