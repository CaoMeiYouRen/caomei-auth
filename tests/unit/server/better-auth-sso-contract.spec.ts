import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * 回归保护测试：防止 `@better-auth/sso` 与 `better-auth` 主包出现 ESM
 * 命名导出契约破坏。历史背景：某次升级 sso 到 1.7.2 后，sso 引入了仅在
 * better-auth@1.7.x 才导出的 `PRIVATE_KEY_JWT_SIGNING_ALGORITHMS`，导致
 * Node ESM 在生产环境启动时抛 SyntaxError。本测试通过三层断言阻止同类
 * 回归再次发生：
 *
 *   1. 静态契约：扫描 sso dist 入口，提取所有 `import { ... } from "better-auth"`
 *      形式的命名导入；动态加载 better-auth 主包，校验每个符号确实存在。
 *   2. 运行时契约：`import('@better-auth/sso')` 必须成功，不能抛 SyntaxError，
 *      且核心插件工厂 `sso` 必须可用。
 *   3. peer dep 一致性：sso 的 peer dep 中 better-auth 范围必须与项目锁定版本主版本号一致。
 *
 * 正则覆盖矩阵（当前 sso dist 是 bundled 单行 ESM）：
 *   - ✅ `import { A, B as C } from "better-auth[/xxx]"`（含子路径）
 *   - ✅ `import * as Ns from "better-auth[/xxx]"`
 *   - ✅ `import Default from "better-auth[/xxx]"`
 *   - ⚠️  未覆盖 `import type { ... }`（types-only，运行时不可达，可忽略）
 *   - ⚠️  未覆盖 `export * from "..."`（re-export，需另行扫描 sso dist）
 *
 * 若未来 sso dist 形态变化（多行 / `export *` / TS 直发），需升级本测试。
 */

// 当前 spec 文件所在目录（vitest 4.x 透传 import.meta.dirname，无需 fileURLToPath）
const specDir = import.meta.dirname

// 从仓库根向上解析 node_modules（vitest 可能在子目录运行，需向上回溯）
function findRepoRoot(startDir: string): string {
    let dir = startDir
    while (true) {
        const pkgPath = path.join(dir, 'package.json')
        if (fs.existsSync(pkgPath)) {
            return dir
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            throw new Error('无法定位仓库根目录（找不到 package.json）')
        }
        dir = parent
    }
}

const repoRoot = findRepoRoot(specDir)
const ssoPkgPath = path.join(repoRoot, 'node_modules/@better-auth/sso/package.json')
const projectPkgPath = path.join(repoRoot, 'package.json')

type SsoPackageJson = {
    version: string
    type?: string
    main: string
    module?: string
    peerDependencies?: Record<string, string>
}

type ProjectPackageJson = {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

/**
 * 粗略提取 semver 范围字符串的首段 major 号（如 "^1.6.30 || ^2.0.0" -> "1"）。
 * 注意：这是粗略匹配，不替代完整 semver 检查；只在单段范围或取首段足够保守时使用。
 */
function extractLeadingMajor(range: string): string | null {
    const m = range.match(/\d+/)
    return m ? m[0] : null
}

describe('deps/@better-auth/sso <-> better-auth contract', () => {
    let ssoPkg: SsoPackageJson
    let ssoDistPath: string
    let ssoDistContent: string

    beforeAll(() => {
        if (!fs.existsSync(ssoPkgPath)) {
            throw new Error(`@better-auth/sso 未安装: 找不到 ${ssoPkgPath}`)
        }
        ssoPkg = JSON.parse(fs.readFileSync(ssoPkgPath, 'utf8')) as SsoPackageJson
        const mainEntry = ssoPkg.module || ssoPkg.main
        ssoDistPath = path.join(path.dirname(ssoPkgPath), mainEntry)
        if (!fs.existsSync(ssoDistPath)) {
            throw new Error(`sso dist 入口不存在: ${ssoDistPath}`)
        }
        ssoDistContent = fs.readFileSync(ssoDistPath, 'utf8')
    })

    /**
     * 从 sso dist 入口中提取所有 `import ... from "better-auth[/...]"` 语句。
     * 返回 Map<子路径, 具名符号列表>，空子路径代表主包。
     *
     * 注意：当前实现仅扫描 named/default/namespace 三种 import 形态；
     * `export * from "better-auth"` 形式的 re-export 不在本扫描范围内。
     */
    function extractBetterAuthNamedImports(source: string): Map<string, string[]> {
        const importRegex =
            /import\s+(?:\{([^}]+)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s*["']better-auth(?:\/([^"']+))?["']/g

        const result = new Map<string, string[]>()
        for (const m of source.matchAll(importRegex)) {
            const subpath = m[4] ?? ''
            if (!result.has(subpath)) {
                result.set(subpath, [])
            }
            if (m[1]) {
                // 具名导入：拆分并去掉 `X as Y` 的别名部分（只关心原名是否存在）
                const names = m[1]
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => s.replace(/\s+as\s+\w+/i, '').trim())
                result.get(subpath)!.push(...names)
            }
            // 默认导入与命名空间导入由运行时 import 自然验证，不在此处展开
        }
        return result
    }

    it('sso dist 入口存在且为 ESM', () => {
        expect(ssoPkg.type).toBe('module')
        expect(ssoDistContent).toMatch(/^import\s/m)
    })

    describe('静态契约：sso 引用的 better-auth 主包具名符号必须存在', () => {
        let requestedNames: string[] = []

        beforeAll(() => {
            const imports = extractBetterAuthNamedImports(ssoDistContent)
            requestedNames = imports.get('') ?? []
        })

        it('sso 至少引用了 better-auth 主包的一个具名符号', () => {
            // 防止误报：如果正则失效或 sso 不再 import 主包，应显式失败
            expect(requestedNames.length).toBeGreaterThan(0)
        })

        it('sso 引用的所有 better-auth 主包符号都在主包中存在', async () => {
            // 动态加载主包（vitest 环境走完整 ESM 解析路径，与生产 Nitro 一致）
            const betterAuth = await import('better-auth')
            const missing = requestedNames.filter((name) => !(name in betterAuth))
            expect(missing, [
                `sso v${ssoPkg.version} 引入了 better-auth 不再提供的具名符号：`,
                missing.map((n) => `  - ${n}`).join('\n'),
                '',
                '这会导致生产环境启动时抛 SyntaxError：',
                `  SyntaxError: The requested module 'better-auth' does not provide an export named '...'`,
                '',
                '修复方法：将 sso 降至与 better-auth 主版本兼容的版本',
                '（或升级 better-auth 主版本到 sso peer dep 覆盖的版本，需完整回归测试）。',
                '详细修复策略参见 docs/standards/git.md 与历史 commit。',
            ].join('\n')).toEqual([])
        })

        it('回归保护：sso 与 better-auth 关于 PRIVATE_KEY_JWT_SIGNING_ALGORITHMS 的契约必须一致', async () => {
            // 双向断言：要么 sso 不引用 + better-auth 不导出（兼容），要么 sso 引用 + better-auth 导出（兼容）；
            // 不允许 sso 引用但 better-auth 不导出（d69d9bd 引入的同款回归）。
            const betterAuth = await import('better-auth')
            const ssoAsksForPrivateKeyJwt = requestedNames.includes('PRIVATE_KEY_JWT_SIGNING_ALGORITHMS')
            const baHasPrivateKeyJwt = 'PRIVATE_KEY_JWT_SIGNING_ALGORITHMS' in betterAuth
            const ssoPeerRange = ssoPkg.peerDependencies?.['better-auth'] ?? ''

            expect(
                ssoAsksForPrivateKeyJwt && !baHasPrivateKeyJwt,
                [
                    `sso v${ssoPkg.version} 引用了 PRIVATE_KEY_JWT_SIGNING_ALGORITHMS，但 better-auth 主包未导出此符号。`,
                    ssoPeerRange ? `sso 的 peer dep: better-auth ${ssoPeerRange}` : '',
                    '',
                    '修复方法：',
                    '  方案 A：降级 sso 到与 better-auth 主版本兼容的版本（推荐，零破坏性变更）',
                    '  方案 B：升级 better-auth 主版本到 sso peer dep 覆盖的版本（需完整回归测试）',
                ].filter(Boolean).join('\n'),
            ).toBe(false)
        })
    })

    describe('运行时契约：sso 包必须能正常加载', () => {
        it('import("@better-auth/sso") 不抛 SyntaxError 且 sso 工厂可用', async () => {
            const ssoModule = await import('@better-auth/sso')
            expect(typeof ssoModule.sso).toBe('function')
        }, 30_000)
    })

    describe('peer dep 一致性', () => {
        it('sso 的 better-auth peer dep 范围字符串存在', () => {
            const peer = ssoPkg.peerDependencies
            expect(peer, 'sso package.json 必须声明 peerDependencies').toBeDefined()
            expect(peer?.['better-auth']).toBeDefined()
        })

        it('sso 与 better-auth 主版本兼容（粗略字符串匹配）', () => {
            // 粗略首段匹配策略（不替代完整 semver 检查）：
            //   - 取依赖范围字符串的首个数字段作为 major
            //   - 若任一为复合范围（如 "^1.6.30 || ^2.0.0"），仅校验首段
            //   - 这是保守匹配；如未来需要严格校验，应引入 semver 依赖
            const ssoPeer = ssoPkg.peerDependencies?.['better-auth'] ?? ''
            const projectPkg = JSON.parse(
                fs.readFileSync(projectPkgPath, 'utf8'),
            ) as ProjectPackageJson
            const projectBaRange = projectPkg.dependencies?.['better-auth']
                ?? projectPkg.devDependencies?.['better-auth']
                ?? ''

            expect(ssoPeer, 'sso 必须声明 better-auth peer dep').not.toBe('')
            expect(projectBaRange, '项目必须声明 better-auth 依赖').not.toBe('')

            const ssoMajor = extractLeadingMajor(ssoPeer)
            const projectMajor = extractLeadingMajor(projectBaRange)

            if (ssoMajor && projectMajor) {
                expect(ssoMajor, [
                    `sso peer dep better-auth=${ssoPeer} 与项目锁定的 ${projectBaRange} 主版本不同。`,
                    '防止跨主版本依赖破坏：',
                    '  - 升级 better-auth 主版本前先在 plan/roadmap 评估；',
                    '  - dependabot 应给 better-auth 生态配置 groups 统一升级。',
                ].join('\n')).toBe(projectMajor)
            }
        })
    })
})
