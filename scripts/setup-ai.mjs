import { mkdir, lstat, realpath, symlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const linkMappings = [
    { linkRelPath: '.claude/agents', targetRelPath: '.github/agents' },
    { linkRelPath: '.claude/skills', targetRelPath: '.github/skills' },
    { linkRelPath: '.agents/agents', targetRelPath: '.github/agents' },
    { linkRelPath: '.agents/skills', targetRelPath: '.github/skills' },
    { linkRelPath: '.opencode/agents', targetRelPath: '.github/agents' },
    { linkRelPath: '.opencode/skills', targetRelPath: '.github/skills' },
]

function runGitWorktreeList() {
    return new Promise((resolve, reject) => {
        const child = spawn('git', ['worktree', 'list', '--porcelain'], {
            cwd: repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk
        })

        child.stderr.on('data', (chunk) => {
            stderr += chunk
        })

        child.on('error', reject)
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || `git worktree list failed with exit code ${code}`))
                return
            }

            const worktrees = stdout
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.startsWith('worktree '))
                .map((line) => line.slice('worktree '.length).trim())

            resolve(worktrees)
        })
    })
}

function toSymlinkTarget(linkPath, targetPath) {
    if (process.platform === 'win32') {
        return targetPath
    }

    return path.relative(path.dirname(linkPath), targetPath)
}

async function ensureSymlink(linkPath, targetPath) {
    await mkdir(path.dirname(linkPath), { recursive: true })

    try {
        const existing = await lstat(linkPath)
        if (!existing.isSymbolicLink()) {
            console.warn(`  跳过: ${path.relative(repoRoot, linkPath)} 已存在且不是符号链接`)
            return
        }

        const resolvedLink = await realpath(linkPath)
        const resolvedTarget = await realpath(targetPath)
        if (resolvedLink === resolvedTarget) {
            console.info(`  已存在: ${path.relative(repoRoot, linkPath)}`)
            return
        }

        console.warn(`  跳过: ${path.relative(repoRoot, linkPath)} 已指向其他目标`)
        return
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error
        }
    }

    const symlinkType = process.platform === 'win32' ? 'junction' : 'dir'
    const symlinkTarget = toSymlinkTarget(linkPath, targetPath)
    await symlink(symlinkTarget, linkPath, symlinkType)
    console.info(`  创建: ${path.relative(repoRoot, linkPath)} -> ${path.relative(repoRoot, targetPath)}`)
}

async function main() {
    const worktrees = await runGitWorktreeList()

    console.info(`发现 ${worktrees.length} 个工作树，开始同步...`)

    for (const worktree of worktrees) {
        console.info(`\n处理工作树: ${worktree}`)

        for (const mapping of linkMappings) {
            const linkPath = path.join(worktree, mapping.linkRelPath)
            const targetPath = path.join(worktree, mapping.targetRelPath)

            await ensureSymlink(linkPath, targetPath)
        }
    }

    console.info('\n所有工作树同步完成！')
}

main().catch((error) => {
    console.error(error?.message || error)
    process.exit(1)
})
