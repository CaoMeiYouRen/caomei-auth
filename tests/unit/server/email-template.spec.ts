import fs from 'fs'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const storageGetItem = vi.fn().mockRejectedValue(new Error('missing'))
const storageFactory = vi.fn(() => ({
    getItem: storageGetItem,
}))
const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false)

beforeAll(() => {
    vi.stubGlobal('useStorage', storageFactory)
})

afterEach(() => {
    storageGetItem.mockClear()
})

afterAll(() => {
    vi.unstubAllGlobals()
    existsSpy.mockRestore()
})

import { EmailTemplateEngine, emailTemplateEngine } from '@/server/utils/email-template'

describe('server/utils/email-template', () => {
    it('produces fallback code email when templates are missing', async () => {
        const result = await emailTemplateEngine.generateCodeEmailTemplate({
            headerIcon: 'shield',
            message: '请使用以下验证码完成验证',
            verificationCode: '932641',
            expiresIn: 5,
        }, {
            title: '验证码',
        })

        expect(result.html).toContain('932641')
        expect(result.html).toContain('请使用以下验证码完成验证')
        expect(result.html).toContain('安全提示')
        expect(result.text).not.toContain('<')
        expect(result.text).toContain('932641')
    })

    it('generates action email with button and reminder fallback contents', async () => {
        const result = await emailTemplateEngine.generateActionEmailTemplate({
            headerIcon: 'lock',
            message: '点击按钮重置密码',
            buttonText: '立即重置',
            actionUrl: 'https://auth.example/reset',
            reminderContent: '该链接 10 分钟内有效',
        }, {
            title: '密码重置',
        })

        expect(result.html).toContain('立即重置')
        expect(result.html).toContain('https://auth.example/reset')
        expect(result.html).toContain('重要提醒')
        expect(result.text).toContain('立即重置')
    })

    it('falls back to default template implementation when instantiating a new engine', async () => {
        const customEngine = new EmailTemplateEngine()
        const result = await customEngine.generateSimpleMessageTemplate({
            headerIcon: 'info',
            message: '演示模式通知',
            securityTip: '仅用于演示环境',
        }, {
            title: '通知',
        })

        expect(result.html).toContain('演示模式通知')
        expect(result.text).toContain('演示模式通知')
    })
})
