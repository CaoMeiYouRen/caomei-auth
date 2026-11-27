import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractHeadingSlugs, githubSlugify } from '../../../scripts/quality/doc-slug.mjs'
import { checkAnchors, extractLinkTargets } from '../../../scripts/quality/check-doc-anchors.mjs'

/**
 * 阶段 18 M3.2：文档锚点 slug 与引用校验。
 *
 * 关键不变量：站点 slug 与 GitHub 口径一致（数字开头不补 `_`、逐个空白转 `-` 不折叠），
 * 且失效引用必须被报告而不是静默通过。
 */
describe('scripts/quality/doc-slug', () => {
    it('数字开头不补下划线，与 GitHub 锚点一致', () => {
        expect(githubSlugify('7. 进度表')).toBe('7-进度表')
        expect(githubSlugify('7.3 提交规范 (Commit Convention)')).toBe('73-提交规范-commit-convention')
    })

    it('去掉标点后逐个空白转连字符，不折叠', () => {
        expect(githubSlugify('1.3 2FA 覆盖边界与账号恢复等级 (2FA Coverage & Recovery Levels)'))
            .toBe('13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels')
        expect(githubSlugify('5.1.4 漏洞研判与安全公告 (Vulnerability Triage & Security Advisory)'))
            .toBe('514-漏洞研判与安全公告-vulnerability-triage--security-advisory')
    })

    it('保留 CJK 与连字符', () => {
        expect(githubSlugify('备份码 / 恢复码`code`')).toBe('备份码--恢复码code')
    })

    it('提取标题 slug 时跳过代码块并处理重复标题', () => {
        const markdown = ['# 标题', '```', '# 代码里的标题', '```', '## 重复', '## 重复'].join('\n')
        expect(extractHeadingSlugs(markdown)).toEqual(['标题', '重复', '重复-1'])
    })
})

describe('scripts/quality/check-doc-anchors', () => {
    it('识别内联链接与引用式链接目标', () => {
        expect(extractLinkTargets('见 [a](./x.md#h) 与 [b](https://example.com/#h)')).toEqual(['./x.md#h', 'https://example.com/#h'])
        expect(extractLinkTargets('[ref]: ./y.md#k')).toEqual(['./y.md#k'])
    })

    it('报告失效锚点，通过有效锚点', () => {
        const root = mkdtempSync(join(tmpdir(), 'doc-anchors-'))
        mkdirSync(join(root, 'docs'), { recursive: true })
        writeFileSync(join(root, 'docs', 'target.md'), '# 目标页\n\n## 7. 进度表\n', 'utf8')
        writeFileSync(
            join(root, 'docs', 'source.md'),
            ['# 源页', '', '有效：[x](./target.md#7-进度表)', '失效：[y](./target.md#不存在的标题)'].join('\n'),
            'utf8',
        )

        const { problems } = checkAnchors(root, ['docs'])

        expect(problems).toHaveLength(1)
        expect(problems[0]).toMatchObject({ file: join('docs', 'source.md'), line: 4 })
        expect(problems[0]!.target).toBe('./target.md#不存在的标题')
    })

    it('外部链接与非 md 链接不参与判定', () => {
        const root = mkdtempSync(join(tmpdir(), 'doc-anchors-'))
        mkdirSync(join(root, 'docs'), { recursive: true })
        writeFileSync(join(root, 'docs', 'a.md'), '# A\n\n[外链](https://example.com/#x)\n', 'utf8')
        expect(checkAnchors(root, ['docs']).problems).toEqual([])
    })
})
