import { beforeEach, describe, expect, it, vi } from 'vitest'

const registerLocale = vi.hoisted(() => vi.fn())

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return {
        ...actual,
        registerLocale: (code: string, messages: unknown) => {
            registerLocale(code, messages)
            actual.registerLocale(code as never, messages as never)
        },
    }
})

import { registerCaomeiLocales } from '@/plugins/caomei-locale'

describe('plugins/caomei-locale', () => {
    beforeEach(() => {
        registerLocale.mockClear()
    })

    it('按 Registry 的启用语言注册非预注册文案', async () => {
        await registerCaomeiLocales()
        const codes = registerLocale.mock.calls.map(([code]) => code).sort()
        expect(codes).toEqual(['ja-JP', 'ko-KR', 'zh-TW'])
    })

    it('只注册非预注册的启用语言', async () => {
        await registerCaomeiLocales([{ code: 'zh-CN' }, { code: 'en-US' }])
        expect(registerLocale).not.toHaveBeenCalled()

        await registerCaomeiLocales([{ code: 'zh-CN' }, { code: 'zh-TW' }, { code: 'ja-JP' }, { code: 'ko-KR' }])
        expect(registerLocale).toHaveBeenCalledWith('zh-TW', expect.objectContaining({ pagination: expect.anything() }))
        expect(registerLocale).toHaveBeenCalledWith('ja-JP', expect.objectContaining({ pagination: expect.anything() }))
        expect(registerLocale).toHaveBeenCalledWith('ko-KR', expect.objectContaining({ pagination: expect.anything() }))
    })
})
