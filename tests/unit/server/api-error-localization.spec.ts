import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/** 递归列出目录下的 .ts 文件 */
function listTsFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            return listTsFiles(fullPath)
        }
        return entry.name.endsWith('.ts') ? [fullPath] : []
    })
}

/** 把字符串字面量与注释抹成空格，避免 `}` 或中文出现在字面量里影响判定 */
function stripLiteralsAndComments(source: string): string {
    let output = ''
    let quote: string | null = null
    let inLineComment = false
    let inBlockComment = false

    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false
                output += char
            } else {
                output += ' '
            }
            continue
        }
        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false
                output += '  '
                index++
            } else {
                output += char === '\n' ? '\n' : ' '
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                output += '  '
                index++
                continue
            }
            if (char === quote) {
                quote = null
            }
            output += char === '\n' ? '\n' : ' '
            continue
        }
        if (char === '/' && next === '/') {
            inLineComment = true
            output += '  '
            index++
            continue
        }
        if (char === '/' && next === '*') {
            inBlockComment = true
            output += '  '
            index++
            continue
        }
        if (char === '\'' || char === '"' || char === '`') {
            quote = char
            output += ' '
            continue
        }
        output += char
    }

    return output
}

/** 截取 `createError({...})` / `createLocalizedError(event, {...})` 的完整对象字面量 */
function errorBlocks(source: string): string[] {
    const blocks: string[] = []
    const pattern = /create(?:Localized)?Error\(\s*(?:event\s*,\s*)?\{/gu
    for (const match of source.matchAll(pattern)) {
        const start = (match.index ?? 0) + match[0].length - 1
        let depth = 0
        for (let index = start; index < source.length; index++) {
            const char = source[index]
            if (char === '{') {
                depth++
                continue
            }
            if (char === '}') {
                depth--
                if (depth === 0) {
                    blocks.push(source.slice(start, index + 1))
                    break
                }
            }
        }
    }
    return blocks
}

const apiFiles = listTsFiles(path.resolve(process.cwd(), 'server/api'))
const middlewareFiles = listTsFiles(path.resolve(process.cwd(), 'server/middleware'))

describe('server/api 错误面本地化', () => {
    it('createError 参数里不再出现中文硬编码', () => {
        const offenders = apiFiles
            .map((file) => ({ file, blocks: errorBlocks(readFileSync(file, 'utf8')) }))
            .filter((entry) => entry.blocks.some((block) => /[\u4e00-\u9fa5]/u.test(block)))
            .map((entry) => path.relative(process.cwd(), entry.file))

        expect(offenders).toEqual([])
    })

    it('响应 message 不再出现中文硬编码', () => {
        const offenders = apiFiles
            .filter((file) => /message:\s*['"`][^'"`]*[\u4e00-\u9fa5]/u.test(readFileSync(file, 'utf8')))
            .map((file) => path.relative(process.cwd(), file))

        expect(offenders).toEqual([])
    })

    it('每个管理端 handler 都接入了服务端翻译', () => {
        const adminFiles = listTsFiles(path.resolve(process.cwd(), 'server/api/admin'))
        const offenders = adminFiles
            .filter((file) => {
                const code = stripLiteralsAndComments(readFileSync(file, 'utf8'))
                return !/createLocalizedError|getServerI18n/u.test(code)
            })
            .map((file) => path.relative(process.cwd(), file))

        expect(offenders).toEqual([])
    })

    it('中间件不在错误文案里直接写中文', () => {
        const offenders = middlewareFiles
            .map((file) => ({ file, blocks: errorBlocks(readFileSync(file, 'utf8')) }))
            .filter((entry) => entry.blocks.some((block) => /[\u4e00-\u9fa5]/u.test(block)))
            .map((entry) => path.relative(process.cwd(), entry.file))

        expect(offenders).toEqual([])
    })
})
