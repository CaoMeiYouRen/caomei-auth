import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

/** P5 后唯一来源：同名 composable 必须显式 import `caomei-ui`，禁止回退到 PrimeVue（见 docs/design/governance/2026-11-14-p4-closure.md） */
export const REQUIRED_IMPORTS = [
    { name: 'useToast', sources: ['caomei-ui'] },
    { name: 'useConfirm', sources: ['caomei-ui'] },
]

/** 只扫描应用运行时代码；测试与脚本另有 mock，不参与判定 */
export const SCAN_ROOTS = ['app.vue', 'pages', 'components', 'composables', 'plugins', 'middleware', 'utils', 'lib']

const SCAN_EXTENSIONS = ['.vue', '.ts']

/**
 * 判断文件是否显式 import 了要求的来源
 * @param {string} source
 * @param {{ name: string, source: string }} requirement
 */
export function hasExplicitImport(source, requirement) {
    const candidates = requirement.sources ?? [requirement.source]
    return candidates.some((candidate) => {
        const escapedSource = candidate.replaceAll('/', '\\/')
        const pattern = new RegExp(
            `import\\s*\\{[^}]*\\b${requirement.name}\\b[^}]*\\}\\s*from\\s*['"]${escapedSource}['"]`,
            'u',
        )
        return pattern.test(source)
    })
}

/**
 * 找出缺失显式 import 的调用
 * @param {string} source
 * @param {{ name: string, source: string }[]} requirements
 * @returns {{ name: string, source: string }[]}
 */
export function findMissingImports(source, requirements = REQUIRED_IMPORTS) {
    return requirements.filter((requirement) => {
        if (!new RegExp(`\\b${requirement.name}\\s*\\(`, 'u').test(source)) {
            return false
        }
        return !hasExplicitImport(source, requirement)
    })
}

/**
 * 递归收集需要扫描的源文件（相对 root）
 * @param {string} root
 * @param {string[]} roots
 * @returns {Promise<string[]>}
 */
export async function collectSourceFiles(root, roots = SCAN_ROOTS) {
    const results = []

    async function walk(relativePath) {
        const absolute = path.join(root, relativePath)
        const entries = await readdir(absolute, { withFileTypes: true }).catch(() => null)

        if (!entries) {
            if (SCAN_EXTENSIONS.some((extension) => relativePath.endsWith(extension))) {
                results.push(relativePath.split(path.sep).join('/'))
            }
            return
        }

        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (['node_modules', '.nuxt', '.output'].includes(entry.name)) {
                    continue
                }
                await walk(path.join(relativePath, entry.name))
                continue
            }
            if (SCAN_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
                results.push(path.join(relativePath, entry.name).split(path.sep).join('/'))
            }
        }
    }

    for (const relativePath of roots) {
        await walk(relativePath)
    }

    return results.sort()
}

/**
 * 扫描项目，返回违规文件与缺失项
 * @param {{ root?: string, roots?: string[], requirements?: typeof REQUIRED_IMPORTS }} options
 */
export async function checkProject({ root = projectRoot, roots = SCAN_ROOTS, requirements = REQUIRED_IMPORTS } = {}) {
    const files = await collectSourceFiles(root, roots)
    const violations = []

    for (const file of files) {
        const source = await readFile(path.join(root, file), 'utf8')
        const missing = findMissingImports(source, requirements)

        if (missing.length > 0) {
            violations.push({ file, missing })
        }
    }

    return violations
}

function formatViolations(violations) {
    return violations
        .map(({ file, missing }) => `- ${file}: 缺少 ${missing.map((item) => `\`${item.name}\` from ${(item.sources ?? [item.source]).map((source) => `'${source}'`).join(' / ')}`).join('、')}`)
        .join('\n')
}

async function main() {
    const violations = await checkProject()

    if (violations.length === 0) {
        process.stdout.write('caomei-ui 迁移守卫通过：useToast / useConfirm 均为显式 import。\n')
        return
    }

    process.stderr.write(`caomei-ui 迁移守卫失败：${violations.length} 个文件依赖了自动导入。\n${formatViolations(violations)}\n`)
    process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    await main()
}
