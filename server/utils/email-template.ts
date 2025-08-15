import { readFileSync } from 'fs'
import { join } from 'path'

import mjml2html from 'mjml'

import logger from './logger'
import { APP_NAME, AUTH_BASE_URL } from '@/utils/env'

interface EmailTemplateData {
    [key: string]: string | number | boolean
}

export class EmailTemplateEngine {
    private templateCache = new Map<string, string>()
    private fragmentCache = new Map<string, string>()

    /**
     * 渲染模板变量
     */
    private renderTemplate(template: string, data: EmailTemplateData): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => String(data[key] || match))
    }

    /**
     * 获取模板片段
     */
    private getFragment(fragmentName: string): string {
        if (this.fragmentCache.has(fragmentName)) {
            return this.fragmentCache.get(fragmentName) || ''
        }

        try {
            const fragmentPath = join(process.cwd(), 'server/templates/fragments', `${fragmentName}.mjml`)
            const fragment = readFileSync(fragmentPath, 'utf-8')
            this.fragmentCache.set(fragmentName, fragment)
            return fragment
        } catch (error) {
            logger.warn('Email template fragment not found', { fragmentName })
            return ''
        }
    }

    /**
     * 获取MJML模板内容
     */
    private getMjmlTemplate(templateName: string): string {
        const cacheKey = `mjml_${templateName}`
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey) || ''
        }

        try {
            const templatePath = join(process.cwd(), 'server/templates', `${templateName}.mjml`)
            const template = readFileSync(templatePath, 'utf-8')
            this.templateCache.set(cacheKey, template)
            return template
        } catch (error) {
            logger.warn('MJML template not found, using fallback', { templateName })
            return this.getFallbackMjmlTemplate(templateName)
        }
    }

    /**
     * 生成带操作按钮的邮件模板（如验证邮箱、重置密码等）
     */
    public generateActionEmailTemplate(
        templateConfig: {
            headerIcon: string
            message: string
            buttonText: string
            actionUrl: string
            reminderContent: string
            securityTip: string
        },
        options: {
            title: string
            preheader?: string
        },
    ): { html: string, text: string } {
        const baseTemplate = this.getMjmlTemplate('base-template')
        const actionFragment = this.getFragment('action-message')
        const reminderFragment = this.getFragment('important-reminder')
        const securityFragment = this.getFragment('security-tip')

        // 组合主要内容
        const mainContent = [
            this.renderTemplate(actionFragment, templateConfig),
            this.renderTemplate(reminderFragment, templateConfig),
            this.renderTemplate(securityFragment, templateConfig),
        ].join('')

        const templateData = {
            appName: APP_NAME,
            baseUrl: AUTH_BASE_URL,
            currentYear: new Date().getFullYear(),
            headerIcon: templateConfig.headerIcon,
            headerSubtitle: '安全 • 便捷 • 统一的身份认证平台',
            greeting: '您好！',
            helpText: '需要帮助？联系我们的客服团队',
            footerNote: '这是一封系统自动发送的邮件，请勿直接回复。',
            mainContent,
            ...options,
        }

        const finalTemplate = this.renderTemplate(baseTemplate, templateData)

        try {
            const { html, errors } = mjml2html(finalTemplate, {
                validationLevel: 'soft',
            })

            if (errors && errors.length > 0) {
                logger.warn('MJML compilation warnings', { errors })
            }

            const text = this.generateTextVersion(html, templateData)
            return { html, text }
        } catch (error) {
            logger.error('MJML compilation failed', { error: error instanceof Error ? error.message : error })
            return this.generateFallbackTemplate('action-email', templateData, options)
        }
    }

    /**
     * 生成验证码邮件模板
     */
    public generateCodeEmailTemplate(
        templateConfig: {
            headerIcon: string
            message: string
            verificationCode: string
            expiresIn: number
            securityTip: string
        },
        options: {
            title: string
            preheader?: string
        },
    ): { html: string, text: string } {
        const baseTemplate = this.getMjmlTemplate('base-template')
        const codeFragment = this.getFragment('verification-code')
        const securityFragment = this.getFragment('security-tip')

        const mainContent = [
            this.renderTemplate(codeFragment, templateConfig),
            this.renderTemplate(securityFragment, templateConfig),
        ].join('')

        const templateData = {
            appName: APP_NAME,
            baseUrl: AUTH_BASE_URL,
            currentYear: new Date().getFullYear(),
            headerIcon: templateConfig.headerIcon,
            headerSubtitle: '安全 • 便捷 • 统一的身份认证平台',
            greeting: '您好！',
            helpText: '需要帮助？联系我们的客服团队',
            footerNote: '这是一封系统自动发送的验证码邮件，请勿直接回复。',
            mainContent,
            ...options,
        }

        const finalTemplate = this.renderTemplate(baseTemplate, templateData)

        try {
            const { html, errors } = mjml2html(finalTemplate, {
                validationLevel: 'soft',
            })

            if (errors && errors.length > 0) {
                logger.email.templateError({ templateName: 'code-email', error: `MJML compilation warnings: ${errors.map((e) => e.message).join(', ')}` })
            }

            const text = this.generateTextVersion(html, templateData)
            return { html, text }
        } catch (error) {
            logger.email.templateError({ templateName: 'code-email', error: error instanceof Error ? error.message : String(error) })
            return this.generateFallbackTemplate('code-email', templateData, options)
        }
    }

    /**
     * 生成简单消息邮件模板
     */
    public generateSimpleMessageTemplate(
        templateConfig: {
            headerIcon: string
            message: string
            extraInfo?: string
        },
        options: {
            title: string
            preheader?: string
        },
    ): { html: string, text: string } {
        const baseTemplate = this.getMjmlTemplate('base-template')
        const messageFragment = this.getFragment('simple-message')

        const mainContent = this.renderTemplate(messageFragment, templateConfig)

        const templateData = {
            appName: APP_NAME,
            baseUrl: AUTH_BASE_URL,
            currentYear: new Date().getFullYear(),
            headerIcon: templateConfig.headerIcon,
            headerSubtitle: '安全 • 便捷 • 统一的身份认证平台',
            greeting: '您好！',
            helpText: '需要帮助？联系我们的客服团队',
            footerNote: '这是一封系统自动发送的邮件，请勿直接回复。',
            mainContent,
            ...options,
        }

        const finalTemplate = this.renderTemplate(baseTemplate, templateData)

        try {
            const { html, errors } = mjml2html(finalTemplate, {
                validationLevel: 'soft',
            })

            if (errors && errors.length > 0) {
                logger.email.templateError({ templateName: 'simple-message', error: `MJML compilation warnings: ${errors.map((e) => e.message).join(', ')}` })
            }

            const text = this.generateTextVersion(html, templateData)
            return { html, text }
        } catch (error) {
            logger.email.templateError({ templateName: 'simple-message', error: error instanceof Error ? error.message : String(error) })
            return this.generateFallbackTemplate('simple-message', templateData, options)
        }
    }

    /**
     * 生成纯文本版本
     */
    private generateTextVersion(html: string, data: EmailTemplateData): string {
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签
            .replace(/<[^>]*>/g, '') // 移除所有HTML标签
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/\s+/g, ' ') // 压缩空白字符
            .replace(/\n\s*\n/g, '\n\n') // 处理多余的换行
            .trim()
    }

    /**
     * 回退MJML模板
     */
    private getFallbackMjmlTemplate(templateName: string): string {
        // 根据模板名称返回对应的回退模板
        switch (templateName) {
            case 'email-verification':
                return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: {{primaryColor}} !important; }
      .primary-bg { background-color: {{primaryColor}} !important; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="{{primaryColor}}" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="28px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="#ffffff" font-size="16px" font-weight="400" padding-top="8px">
              安全 · 便捷 · 统一的身份认证平台
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="18px" color="#2d3748" padding-bottom="20px">
              您好！
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" line-height="1.6" padding-bottom="30px">
              感谢您注册 {{appName}}！为了确保您的账户安全，请点击下方按钮验证您的邮箱地址：
            </mj-text>

            <!-- CTA Button -->
            <mj-button background-color="{{primaryColor}}" color="#ffffff" font-size="16px" font-weight="600" padding="20px 0" border-radius="8px" href="{{verificationUrl}}">
              验证邮箱地址
            </mj-button>

            <!-- Alternative Link -->
            <mj-section background-color="#f7fafc" padding="20px" border-left="4px solid {{primaryColor}}">
              <mj-column>
                <mj-text font-size="14px" color="#4a5568" padding-bottom="10px">
                  <strong>无法点击按钮？</strong>请复制以下链接到浏览器地址栏：
                </mj-text>
                <mj-text font-size="12px" color="#718096" font-family="monospace" word-break="break-all">
                  {{verificationUrl}}
                </mj-text>
              </mj-column>
            </mj-section>

            <mj-text font-size="16px" color="#4a5568" line-height="1.6" padding-top="30px">
              <strong>重要提醒：</strong><br/>
              • 此验证链接将在 24 小时后过期<br/>
              • 如果您没有注册 {{appName}} 账户，请忽略此邮件<br/>
              • 请勿将此链接分享给他人
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding-bottom="10px">
              需要帮助？联系我们的客服团队
            </mj-text>
            <mj-text align="center" font-size="14px" padding-bottom="20px">
              <a href="{{baseUrl}}/docs" class="primary-color" style="text-decoration: none; margin: 0 10px;">帮助中心</a>
              <a href="{{baseUrl}}/privacy" class="primary-color" style="text-decoration: none; margin: 0 10px;">隐私政策</a>
              <a href="{{baseUrl}}/terms" class="primary-color" style="text-decoration: none; margin: 0 10px;">服务条款</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0">
              © {{currentYear}} {{appName}}. 保留所有权利。
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`

            default:
                return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="bold" color="{{primaryColor}}" padding-bottom="20px">
          {{appName}}
        </mj-text>
        <mj-text font-size="16px" color="#333333" line-height="1.6">
          {{content}}
        </mj-text>
        <mj-text align="center" font-size="12px" color="#666666" padding-top="40px">
          © {{currentYear}} {{appName}}. 保留所有权利。
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
        }
    }

    /**
     * 回退到简单HTML模板
     */
    private generateFallbackTemplate(templateName: string, data: EmailTemplateData, options: { title: string }): { html: string, text: string } {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${options.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: ${data.primaryColor}; }
        .content { color: #333; line-height: 1.6; }
        .button { display: inline-block; padding: 12px 24px; background: ${data.primaryColor}; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${data.appName}</div>
        </div>
        <div class="content">
            ${data.content || '邮件内容'}
        </div>
        <div class="footer">
            <p>© ${data.currentYear} ${data.appName}. 保留所有权利。</p>
        </div>
    </div>
</body>
</html>`

        const text = this.generateTextVersion(html, data)
        return { html, text }
    }
}

export const emailTemplateEngine = new EmailTemplateEngine()
