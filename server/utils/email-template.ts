import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

import mjml2html from 'mjml'
import dayjs from 'dayjs'

import logger from './logger'
import { getFallbackFragment, getFallbackMjmlTemplate, generateFallbackHtml } from './email-templates-fallback'
import { APP_NAME, AUTH_BASE_URL, CONTACT_EMAIL } from '@/utils/shared/env'

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
        } catch {
            logger.warn('Email template fragment not found, using fallback', { fragmentName })

            // 提供常用片段的回退内容
            const fallbackFragment = getFallbackFragment(fragmentName)
            this.fragmentCache.set(fragmentName, fallbackFragment)
            return fallbackFragment
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
        } catch {
            logger.warn('MJML template not found, using fallback', { templateName })
            return getFallbackMjmlTemplate(templateName)
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
            const text = this.generateTextVersion(compiledHtml)
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
    private generateTextVersion(html: string): string {
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

        const html = generateFallbackHtml(options.title, safeData)
        const text = this.generateTextVersion(html)
        return { html, text }
    }
}

export const emailTemplateEngine = new EmailTemplateEngine()
