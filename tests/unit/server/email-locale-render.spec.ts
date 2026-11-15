import { describe, expect, it } from 'vitest'
import { emailTemplateEngine } from '@/server/utils/email/templates'
import { getEmailTranslator } from '@/server/utils/email/i18n'

/** 去掉 HTML 注释后再断言，模板里的中文注释不进入用户可见面 */
function stripComments(html: string): string {
    let result = ''
    let cursor = 0
    while (cursor < html.length) {
        const start = html.indexOf('<!--', cursor)
        if (start === -1) {
            result += html.slice(cursor)
            break
        }
        result += html.slice(cursor, start)
        const end = html.indexOf('-->', start + 4)
        if (end === -1) {
            break
        }
        cursor = end + 3
    }
    return result
}

function chineseSegments(html: string): string[] {
    return [...new Set(stripComments(html).match(/[\u4e00-\u9fa5]{2,}/gu) ?? [])]
}

describe('server/utils/email 双语渲染', () => {
    it('英文邮件不残留中文界面文案与未替换占位符', async () => {
        const t = getEmailTranslator('en-US')
        const action = await emailTemplateEngine.generateActionEmailTemplate({
            headerIcon: 'lock',
            message: t('email.verification.message', { appName: 'Caomei Auth' }),
            buttonText: t('email.verification.buttonText'),
            actionUrl: 'https://auth.example/verify',
            reminderContent: t('email.verification.reminder', { appName: 'Caomei Auth' }),
            securityTip: t('email.verification.securityTip', { appName: 'Caomei Auth' }),
        }, {
            title: t('email.verification.title', { appName: 'Caomei Auth' }),
            preheader: t('email.verification.preheader', { appName: 'Caomei Auth' }),
        }, 'en-US')

        const code = await emailTemplateEngine.generateCodeEmailTemplate({
            headerIcon: 'key',
            message: t('email.loginOtp.message', { appName: 'Caomei Auth' }),
            verificationCode: '123456',
            expiresIn: 5,
            securityTip: t('email.loginOtp.securityTip'),
        }, {
            title: t('email.loginOtp.title', { appName: 'Caomei Auth' }),
            preheader: t('email.loginOtp.preheader', { code: '123456' }),
        }, 'en-US')

        const simple = await emailTemplateEngine.generateSimpleMessageTemplate({
            headerIcon: 'shield',
            message: t('email.securityNotification.message', { appName: 'Caomei Auth', action: 'Password changed' }),
            extraInfo: 'IP address 203.0.113.10',
        }, { title: t('email.securityNotification.title', { appName: 'Caomei Auth' }) }, 'en-US')

        for (const html of [action.html, code.html, simple.html]) {
            /* 品牌名保持中文是预期行为，其余中文片段视为漏译 */
            expect(chineseSegments(html).filter((segment) => !segment.includes('草梅'))).toEqual([])
            expect(stripComments(html)).not.toMatch(/\{\{\w+\}\}/u)
            /* 单花括号也是占位符：漏传参数时不应把 {appName} / {code} 发给用户 */
            expect(stripComments(html)).not.toMatch(/\{(?:appName|code|newEmail|minutes|action)\}/u)
        }

        expect(action.html).toContain('Verify email address')
        expect(code.html).toContain('Use this code within 5 minutes')
        expect(simple.text).toContain('Password changed')
    })

    it('中文邮件保留原文案与动态值', async () => {
        const t = getEmailTranslator('zh-CN')
        const code = await emailTemplateEngine.generateCodeEmailTemplate({
            headerIcon: 'key',
            message: t('email.emailVerificationOtp.message', { appName: '草梅Auth' }),
            verificationCode: '654321',
            expiresIn: 10,
            securityTip: t('email.emailVerificationOtp.securityTip'),
        }, {
            title: t('email.emailVerificationOtp.title', { appName: '草梅Auth' }),
            preheader: t('email.emailVerificationOtp.preheader', { code: '654321' }),
        })

        expect(code.html).toContain('654321')
        expect(code.html).toContain('请在 10 分钟内使用此验证码')
        expect(code.html).toContain('🛡️ 安全提示')
        expect(code.html).toContain('隐私政策')
        expect(chineseSegments(code.html)).not.toContain('{{codeExpiresIn}}')
    })
})
