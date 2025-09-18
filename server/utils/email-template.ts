import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

import mjml2html from 'mjml'
import dayjs from 'dayjs'

import logger from './logger'
import { APP_NAME, AUTH_BASE_URL, CONTACT_EMAIL, EMAIL_FROM } from '@/utils/env'

interface EmailTemplateData {
    [key: string]: string | number | boolean
}

interface BaseTemplateConfig {
    headerIcon: string
    message: string
    securityTip?: string
}

interface ActionTemplateConfig extends BaseTemplateConfig {
    buttonText: string
    actionUrl: string
    reminderContent: string
}

interface CodeTemplateConfig extends BaseTemplateConfig {
    verificationCode: string
    expiresIn: number
}

interface SimpleMessageConfig extends BaseTemplateConfig {
    extraInfo?: string
}

interface TemplateOptions {
    title: string
    preheader?: string
}

interface EmailResult {
    html: string
    text: string
}

/**
 * 获取模板文件内容 - 支持开发和生产环境
 */
async function getTemplateContent(relativePath: string): Promise<string> {
    try {
        // 生产环境：使用 Nitro 的存储层 API
        const storage = useStorage('assets:templates')
        const content = await storage.getItem(relativePath)
        if (typeof content === 'string') {
            return content
        }
    } catch (error) {
        // 如果存储层失败，回退到文件系统
        logger.warn('Failed to read template from storage, falling back to filesystem', { relativePath, error })
    }

    // 开发环境回退：直接从文件系统读取
    return getTemplateContentFromFs(relativePath)
}

/**
 * 从文件系统获取模板内容（回退方案）
 */
function getTemplateContentFromFs(relativePath: string): string {
    // 开发环境路径
    const devPath = join(process.cwd(), 'server/templates', relativePath)
    if (existsSync(devPath)) {
        return readFileSync(devPath, 'utf-8')
    }

    // 备用路径 1: 相对于当前文件的路径
    const backupPath1 = join(__dirname, '../templates', relativePath)
    if (existsSync(backupPath1)) {
        return readFileSync(backupPath1, 'utf-8')
    }

    // 备用路径 2: Vercel 等平台的路径
    const backupPath2 = join('/var/task', 'server/templates', relativePath)
    if (existsSync(backupPath2)) {
        return readFileSync(backupPath2, 'utf-8')
    }

    // 备用路径 3: Docker 容器路径
    const dockerPath = join('/app', 'server/templates', relativePath)
    if (existsSync(dockerPath)) {
        return readFileSync(dockerPath, 'utf-8')
    }

    // 如果都找不到，抛出错误
    throw new Error(`Template file not found: ${relativePath}`)
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
    private async getFragment(fragmentName: string): Promise<string> {
        if (this.fragmentCache.has(fragmentName)) {
            return this.fragmentCache.get(fragmentName) || ''
        }

        try {
            const fragment = await getTemplateContent(`fragments/${fragmentName}.mjml`)
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
    private async getMjmlTemplate(templateName: string): Promise<string> {
        const cacheKey = `mjml_${templateName}`
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey) || ''
        }

        try {
            const template = await getTemplateContent(`${templateName}.mjml`)
            this.templateCache.set(cacheKey, template)
            return template
        } catch (error) {
            logger.warn('MJML template not found, using fallback', { templateName })
            return this.getFallbackMjmlTemplate(templateName)
        }
    }

    /**
     * 构建基础模板数据
     */
    private buildBaseTemplateData(config: BaseTemplateConfig, options: TemplateOptions, footerNote?: string): EmailTemplateData {
        return {
            appName: APP_NAME,
            baseUrl: AUTH_BASE_URL,
            contactEmail: `mailto:${CONTACT_EMAIL}`,
            currentYear: dayjs().year(),
            headerIcon: config.headerIcon,
            headerSubtitle: '安全 • 便捷 • 统一的身份认证平台',
            greeting: '您好！',
            helpText: '需要帮助？联系我们的客服团队',
            footerNote: footerNote || '这是一封系统自动发送的邮件，请勿直接回复。',
            primaryColor: '#e63946',
            message: config.message,
            securityTip: config.securityTip || '• 验证码仅供本次操作使用，请勿泄露给他人\n• 如果您没有进行此操作，请忽略此邮件\n• 请在规定时间内完成验证，过期需重新获取',
            ...options,
        }
    }

    /**
     * 编译MJML模板
     */
    private compileMjmlTemplate(template: string, templateName: string): string | null {
        try {
            const { html, errors } = mjml2html(template, {
                validationLevel: 'soft',
            })

            if (errors && errors.length > 0) {
                logger.email.templateError({
                    templateName,
                    error: `MJML compilation warnings: ${errors.map((e) => e.message).join(', ')}`,
                })
            }

            return html
        } catch (error) {
            logger.email.templateError({
                templateName,
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    /**
     * 通用模板生成方法
     */
    private async generateTemplate(
        templateName: string,
        fragments: string[],
        templateData: EmailTemplateData,
        options: TemplateOptions,
    ): Promise<EmailResult> {
        const baseTemplate = await this.getMjmlTemplate('base-template')

        // 组合主要内容
        const fragmentContents = await Promise.all(
            fragments.map((fragmentName) => this.getFragment(fragmentName)),
        )
        const mainContent = fragmentContents
            .map((fragment) => this.renderTemplate(fragment, templateData))
            .join('')

        const finalTemplateData = {
            ...templateData,
            mainContent,
        }

        const finalTemplate = this.renderTemplate(baseTemplate, finalTemplateData)
        const compiledHtml = this.compileMjmlTemplate(finalTemplate, templateName)

        if (compiledHtml) {
            const text = this.generateTextVersion(compiledHtml, finalTemplateData)
            return { html: compiledHtml, text }
        }

        // 回退到简单模板
        return this.generateFallbackTemplate(templateName, finalTemplateData, options)
    }

    /**
     * 生成带操作按钮的邮件模板（如验证邮箱、重置密码等）
     */
    public async generateActionEmailTemplate(
        templateConfig: ActionTemplateConfig,
        options: TemplateOptions,
    ): Promise<EmailResult> {
        const templateData = this.buildBaseTemplateData(templateConfig, options)
        const fragments = ['action-message', 'important-reminder', 'security-tip']

        return await this.generateTemplate('action-email', fragments, { ...templateData, ...templateConfig }, options)
    }

    /**
     * 生成验证码邮件模板
     */
    public async generateCodeEmailTemplate(
        templateConfig: CodeTemplateConfig,
        options: TemplateOptions,
    ): Promise<EmailResult> {
        const templateData = this.buildBaseTemplateData(templateConfig, options, '这是一封系统自动发送的验证码邮件，请勿直接回复。')
        const fragments = ['verification-code', 'security-tip']

        return await this.generateTemplate('code-email', fragments, { ...templateData, ...templateConfig }, options)
    }

    /**
     * 生成简单消息邮件模板
     */
    public async generateSimpleMessageTemplate(
        templateConfig: SimpleMessageConfig,
        options: TemplateOptions,
    ): Promise<EmailResult> {
        const templateData = this.buildBaseTemplateData(templateConfig, options)
        const fragments = ['simple-message']

        return await this.generateTemplate('simple-message', fragments, { ...templateData, ...templateConfig }, options)
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
     * 回退MJML模板映射
     */
    private getFallbackMjmlTemplate(templateName: string): string {
        const fallbackTemplates: Record<string, string> = {
            'email-verification': this.getEmailVerificationFallback(),
            'action-email': this.getEmailVerificationFallback(),
            'code-email': this.getCodeEmailFallback(),
            default: this.getDefaultFallback(),
        }

        return fallbackTemplates[templateName] || fallbackTemplates.default
    }

    /**
     * 邮箱验证回退模板
     */
    private getEmailVerificationFallback(): string {
        return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #e63946 !important; }
      .primary-bg { background-color: #e63946 !important; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#e63946" padding="40px 20px">
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
            <mj-text font-size="16px" color="#4a5568" padding-bottom="30px">
              {{message}}
            </mj-text>

            <!-- CTA Button -->
            <mj-button background-color="#e63946" color="#ffffff" font-size="16px" font-weight="600" padding="20px 0" border-radius="8px" href="{{actionUrl}}">
              {{buttonText}}
            </mj-button>

            <!-- Alternative Link -->
            <mj-text font-size="14px" color="#4a5568" padding="30px 0 10px 0">
              <strong>无法点击按钮？</strong>请复制以下链接到浏览器地址栏：
            </mj-text>
            <mj-text font-size="12px" color="#718096" font-family="monospace" padding="0 0 20px 0" background-color="#f7fafc">
              {{actionUrl}}
            </mj-text>

            <mj-text font-size="16px" color="#4a5568" padding-top="30px">
              <strong>重要提醒：</strong><br/>
              {{reminderContent}}
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
              <a href="{{contactEmail}}" style="color: #e63946; text-decoration: none; margin: 0 10px;">联系方式</a>
              <a href="{{baseUrl}}/privacy" style="color: #e63946; text-decoration: none; margin: 0 10px;">隐私政策</a>
              <a href="{{baseUrl}}/terms" style="color: #e63946; text-decoration: none; margin: 0 10px;">服务条款</a>
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
    }

    /**
     * 验证码邮件回退模板
     */
    private getCodeEmailFallback(): string {
        return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #e63946 !important; }
      .code-highlight {
        background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
        padding: 20px 40px !important;
        border-radius: 12px !important;
        letter-spacing: 4px !important;
        font-family: Monaco, Consolas, 'Lucida Console', monospace !important;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#e63946" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="32px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="rgba(255,255,255,0.9)" font-size="16px" font-weight="400" padding="8px 0 0 0">
              安全 · 便捷 · 统一的身份认证平台
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="20px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
              您好！
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" padding="0 0 20px 0">
              {{message}}
            </mj-text>

            <!-- Verification Code -->
            <mj-text align="center" padding="20px 0" css-class="code-highlight">
              {{verificationCode}}
            </mj-text>

            <!-- Expiry Info -->
            <mj-text font-size="14px" color="#718096" align="center" padding="0 0 30px 0">
              请在 {{expiresIn}} 分钟内使用此验证码
            </mj-text>

            <!-- Security Tips -->
            <mj-text font-size="14px" color="#234e52" font-weight="600" padding="0 0 8px 0">
              🛡️ 安全提示
            </mj-text>
            <mj-text font-size="14px" color="#234e52" padding="0 0 20px 0">
              {{securityTip}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding="0 0 15px 0">
              需要帮助？联系我们的客服团队
            </mj-text>
            <mj-text align="center" font-size="14px" padding="0 0 20px 0">
              <a href="{{contactEmail}}" style="color: #e63946; text-decoration: none; margin: 0 12px;">联系方式</a>
              <a href="{{baseUrl}}/privacy" style="color: #e63946; text-decoration: none; margin: 0 12px;">隐私政策</a>
              <a href="{{baseUrl}}/terms" style="color: #e63946; text-decoration: none; margin: 0 12px;">服务条款</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0" padding="0">
              © {{currentYear}} {{appName}}. 保留所有权利。
            </mj-text>
            <mj-text align="center" font-size="11px" color="#cbd5e0" padding="10px 0 0 0">
              {{footerNote}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
    }

    /**
     * 默认回退模板
     */
    private getDefaultFallback(): string {
        return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="bold" color="#e63946" padding-bottom="20px">
          {{appName}}
        </mj-text>
        <mj-text font-size="16px" color="#333333" padding="0 0 20px 0">
          {{message}}
        </mj-text>
        <mj-text align="center" font-size="12px" color="#666666" padding-top="40px">
          © {{currentYear}} {{appName}}. 保留所有权利。
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
    }

    /**
     * 回退到简单HTML模板
     */
    private generateFallbackTemplate(templateName: string, data: EmailTemplateData, options: TemplateOptions): EmailResult {
        // 记录调试信息
        logger.info('Using fallback template', {
            templateName,
            hasVerificationCode: !!data.verificationCode,
            hasActionUrl: !!data.actionUrl,
            message: data.message,
            verificationCode: data.verificationCode ? '***' : null,
        })

        const primaryColor = '#e63946'

        // 确保数据存在
        const safeData = {
            appName: data.appName || '草梅Auth',
            message: data.message || '邮件内容',
            verificationCode: data.verificationCode || '',
            actionUrl: data.actionUrl || '',
            buttonText: data.buttonText || '点击操作',
            securityTip: data.securityTip || '',
            currentYear: data.currentYear || new Date().getFullYear(),
            footerNote: data.footerNote || '这是一封系统自动发送的邮件，请勿直接回复。',
            expiresIn: data.expiresIn || 10,
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${options.title || '草梅Auth'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            text-align: center;
            padding: 40px 20px;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4a5568;
        }
        .code-section {
            text-align: center;
            margin: 30px 0;
        }
        .code-box {
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 25px 40px;
            display: inline-block;
            border-radius: 12px;
            letter-spacing: 4px;
            font-family: 'Courier New', Monaco, Consolas, monospace;
            box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
            margin: 10px 0;
        }
        .code-note {
            font-size: 14px;
            color: #718096;
            margin-top: 15px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, ${primaryColor} 0%, #ff6b6b 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-1px);
        }
        .security-tip {
            background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
            padding: 20px;
            border-left: 4px solid #38b2ac;
            border-radius: 8px;
            margin: 30px 0;
        }
        .security-tip-title {
            font-weight: 600;
            color: #234e52;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .security-tip-content {
            color: #234e52;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-line;
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .footer-links {
            margin-bottom: 20px;
        }
        .footer-links a {
            color: ${primaryColor};
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
        }
        .footer-copyright {
            font-size: 12px;
            color: #a0aec0;
            margin-bottom: 10px;
        }
        .footer-note {
            font-size: 11px;
            color: #cbd5e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${safeData.appName}</div>
            <div class="subtitle">安全 · 便捷 · 统一的身份认证平台</div>
        </div>
        <div class="content">
            <div class="greeting">您好！</div>
            <div class="message">${safeData.message}</div>

            ${safeData.verificationCode
                    ? `
            <div class="code-section">
                <div class="code-box">${safeData.verificationCode}</div>
                ${safeData.expiresIn ? `<div class="code-note">请在 ${safeData.expiresIn} 分钟内使用此验证码</div>` : ''}
            </div>
            `
                    : ''
            }

            ${safeData.actionUrl
                    ? `
            <div style="text-align: center;">
                <a href="${safeData.actionUrl}" class="button">${safeData.buttonText}</a>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #4a5568;">
                <strong>无法点击按钮？</strong>请复制以下链接到浏览器地址栏：<br/>
                <div style="background: #f7fafc; padding: 10px; border-radius: 4px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #718096; word-break: break-all;">
                    ${safeData.actionUrl}
                </div>
            </div>
            `
                    : ''
            }

            ${safeData.securityTip
                    ? `
            <div class="security-tip">
                <div class="security-tip-title">🛡️ 安全提示</div>
                <div class="security-tip-content">${safeData.securityTip}</div>
            </div>
            `
                    : ''
            }
        </div>
        <div class="footer">
            <div class="footer-links">
                <a href="mailto:${CONTACT_EMAIL}">联系方式</a>
                <a href="${AUTH_BASE_URL}/privacy">隐私政策</a>
                <a href="${AUTH_BASE_URL}/terms">服务条款</a>
            </div>
            <div class="footer-copyright">© ${safeData.currentYear} ${safeData.appName}. 保留所有权利。</div>
            <div class="footer-note">${safeData.footerNote}</div>
        </div>
    </div>
</body>
</html>`

        const text = this.generateTextVersion(html, safeData)
        return { html, text }
    }
}

export const emailTemplateEngine = new EmailTemplateEngine()
