import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 视觉层统一入口：本地在固定 Playwright 容器内运行，CI 直接在容器镜像里运行。
 *
 * 为什么不在宿主直接跑：视觉基线是像素级比对，字体回退、fontconfig 与浏览器库版本都会
 * 造成整页漂移。本地（WSL2）与 GitHub runner 的字体集合不同，同一份基线不可能同时匹配。
 * 因此把渲染环境固定为 `mcr.microsoft.com/playwright:v<版本>-noble`，本地与 CI 共用。
 *
 * 用法：
 *   pnpm test:visual            自基线回归门禁
 *   pnpm test:visual:update     更新自基线（差异归因后）
 *   pnpm test:visual:parity     参考态一致性审计
 *   pnpm test:visual:reference  采集参考态（仅迁移前提交）
 *
 * 容器内（CI 或已经进入镜像）由 `VISUAL_IN_CONTAINER=1` 标识，直接执行 playwright。
 */

const MODES = {
    '--update': { raw: 'test:visual:raw:update', copyBack: ['tests/visual/__screenshots__'] },
    '--parity': { raw: 'test:visual:parity:raw', copyBack: [] },
    '--reference': { raw: 'test:visual:reference:raw', copyBack: ['tests/visual/reference', 'tests/visual/reference-manifest.json'] },
}
const DEFAULT_MODE = { raw: 'test:visual:raw', copyBack: [] }

const projectRoot = resolve(import.meta.dirname, '../..')
const passthrough = process.argv.slice(2).filter((arg) => !arg.startsWith('--mode='))
const modeFlag = passthrough.find((arg) => Object.hasOwn(MODES, arg))
const mode = modeFlag ? MODES[modeFlag] : DEFAULT_MODE
const forwarded = passthrough.filter((arg) => arg !== modeFlag)
/* 逐项加引号：`--grep "quick-login 短信验证码"` 这类参数含空格，直接拼接会被拆成多个位置参数 */
const forwardedCommand = forwarded.map((arg) => `'${arg.replaceAll('\'', '\'\\\'\'')}'`).join(' ')

const pnpmVersion = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')).packageManager?.split('@').pop() ?? '11.17.0'
const playwrightVersion = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')).devDependencies['@playwright/test']?.replace(/^[^\d]*/, '')
const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-noble`

if (process.env.VISUAL_IN_CONTAINER === '1' || existsSync('/ms-playwright')) {
    run('pnpm', [mode.raw, ...forwarded])
    process.exit(0)
}

const workDir = process.env.VISUAL_WORK_DIR || '/tmp/opencode/caomei-auth-visual'

syncSource()
run('docker', [
    'run', '--rm', '--init', '--ipc=host',
    '-v', `${workDir}:/work`,
    '-w', '/work',
    '-e', 'VISUAL_IN_CONTAINER=1',
    '-e', 'CI',
    image,
    'bash', '-lc', `npm i -g pnpm@${pnpmVersion} >/dev/null && pnpm i --frozen-lockfile && pnpm build && pnpm ${mode.raw} ${forwardedCommand}`,
])
copyBack()

/** 把工作区源码同步到临时目录；依赖与构建产物保留在临时目录中复用。 */
function syncSource() {
    run('rsync', [
        '-a', '--delete',
        '--exclude', '/node_modules',
        '--exclude', '/.output',
        '--exclude', '/.nuxt',
        '--exclude', '/.git',
        /* 构建不得依赖本地 .env：CI 检出没有 .env，两侧必须同源 */
        '--exclude', '/.env*',
        '--exclude', '/artifacts',
        '--exclude', '/test-results',
        '--exclude', '/playwright-report',
        '--exclude', '/coverage',
        '--exclude', '/.session',
        '--exclude', '/logs',
        '--exclude', '/dependfix-reports',
        '--exclude', '/database/.visual',
        `${projectRoot}/`,
        `${workDir}/`,
    ])
}

function copyBack() {
    for (const relative of mode.copyBack) {
        const source = join(workDir, relative)
        if (!existsSync(source)) {
            continue
        }
        const target = join(projectRoot, relative)
        if (relative.endsWith('.json')) {
            cpSync(source, target)
            continue
        }
        rmSync(target, { recursive: true, force: true })
        cpSync(source, target, { recursive: true })
    }
}

function run(command, args) {
    const result = spawnSync(command, args, { stdio: 'inherit', cwd: projectRoot })
    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }
}
