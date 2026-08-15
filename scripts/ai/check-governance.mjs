import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

const governanceRoots = {
    githubAgents: path.join(projectRoot, '.github', 'agents'),
    claudeAgents: path.join(projectRoot, '.claude', 'agents'),
    githubSkills: path.join(projectRoot, '.github', 'skills'),
    claudeSkills: path.join(projectRoot, '.claude', 'skills'),
    opencodeAgents: path.join(projectRoot, '.opencode', 'agents'),
    opencodeSkills: path.join(projectRoot, '.opencode', 'skills'),
    agentsAgents: path.join(projectRoot, '.agents', 'agents'),
    agentsSkills: path.join(projectRoot, '.agents', 'skills'),
}

/** 平台镜像组：镜像目录与主定义逐文件一致（由 scripts/setup-ai.mjs 维护链接） */
const mirrorGroups = [
    { name: 'claude', agentRoot: governanceRoots.claudeAgents, skillRoot: governanceRoots.claudeSkills },
    { name: 'opencode', agentRoot: governanceRoots.opencodeAgents, skillRoot: governanceRoots.opencodeSkills },
    { name: 'agents', agentRoot: governanceRoots.agentsAgents, skillRoot: governanceRoots.agentsSkills },
]

const governanceDocs = [
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, 'CLAUDE.md'),
    path.join(projectRoot, '.github', 'copilot-instructions.md'),
    path.join(projectRoot, 'docs', 'standards', 'ai-governance.md'),
    path.join(projectRoot, 'docs', 'standards', 'development.md'),
]

const externalSkillRegistryPath = path.join(projectRoot, '.github', 'external-skills-registry.json')
const externalSkillRegistryDocPath = path.join(projectRoot, 'docs', 'standards', 'external-skills-intake.md')

const supportedSkillFrontmatterKeys = new Set([
    'argument-hint',
    'compatibility',
    'description',
    'disable-model-invocation',
    'license',
    'metadata',
    'name',
    'user-invocable',
])

function toPosixPath(targetPath) {
    return path.relative(projectRoot, targetPath).replaceAll('\\', '/')
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

async function listFilesRecursive(baseDir, matcher, currentDir = '') {
    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const relativePath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
            files.push(...await listFilesRecursive(baseDir, matcher, relativePath))
            continue
        }

        if (entry.isFile() && matcher(entry.name)) {
            files.push(relativePath.replaceAll('\\', '/'))
        }
    }

    return files.sort()
}

async function listDirectoriesRecursive(baseDir, currentDir = '') {
    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const directories = []

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }

        const relativePath = path.join(currentDir, entry.name)
        const normalizedPath = relativePath.replaceAll('\\', '/')

        directories.push(normalizedPath)
        directories.push(...await listDirectoriesRecursive(baseDir, relativePath))
    }

    return directories.sort()
}

async function readUtf8(filePath) {
    return readFile(filePath, 'utf8')
}

async function readRaw(filePath) {
    return readFile(filePath)
}

/**
 * 解析 frontmatter（不依赖 YAML 库）：
 * 返回 { raw, keys, data }；data 为通过简单解析得到的字段值对象。
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)

    if (!match) {
        return null
    }

    const raw = match[1]
    const keys = []
    const data = {}

    for (const line of raw.split(/\r?\n/u)) {
        const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/u)

        if (keyMatch) {
            keys.push(keyMatch[1])
            const key = keyMatch[1]
            const value = keyMatch[2].trim()

            if (key === 'metadata') {
                data.metadata = {}
            } else if (key === 'name') {
                data.name = value
            } else if (key === 'description') {
                data.description = value
            }

            continue
        }

        // 嵌套字段（metadata 下的缩进行）
        if (data.metadata && typeof data.metadata === 'object') {
            const nestedMatch = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/u)

            if (nestedMatch) {
                data.metadata[nestedMatch[1]] = nestedMatch[2].trim()
            }
        }
    }

    return { raw, keys, data }
}

function extractMarkdownLinks(content) {
    const links = []
    const regex = /\[[^\]]+\]\(([^)]+)\)/gu

    for (const match of content.matchAll(regex)) {
        links.push(match[1].trim())
    }

    return links
}

function isExternalLink(target) {
    return /^[a-z][a-z0-9+.-]*:/iu.test(target)
}

function normalizeLocalTarget(target) {
    return target.split('#')[0]
}

function buildIssue(type, filePath, message, severity = 'error') {
    return { type, filePath, message, severity }
}

async function validateSkillFile(filePath, issues) {
    const content = await readUtf8(filePath)
    const relativePath = toPosixPath(filePath)
    const frontmatter = parseFrontmatter(content)

    if (!frontmatter) {
        issues.push(buildIssue('missing-frontmatter', relativePath, '缺少 frontmatter。'))
        return
    }

    if (!frontmatter.keys.includes('name')) {
        issues.push(buildIssue('missing-name', relativePath, '缺少 name 字段。'))
    }

    if (!frontmatter.keys.includes('description')) {
        issues.push(buildIssue('missing-description', relativePath, '缺少 description 字段。'))
    }

    for (const key of frontmatter.keys) {
        if (!supportedSkillFrontmatterKeys.has(key)) {
            issues.push(buildIssue('unsupported-skill-frontmatter', relativePath, `包含不受支持的 skill frontmatter 字段: ${key}`))
        }
    }

    const folderName = path.basename(path.dirname(filePath))
    const declaredName = frontmatter.data?.name
    const metadata = frontmatter.data?.metadata

    if (!metadata || metadata.internal !== 'true') {
        issues.push(buildIssue('skill-internal-mismatch', relativePath, '内部 skill 必须显式声明 metadata.internal: true。'))
    }

    if (declaredName && declaredName !== folderName) {
        issues.push(buildIssue('skill-name-mismatch', relativePath, `frontmatter name 与目录名不一致: ${declaredName} != ${folderName}`))
    }

    for (const target of extractMarkdownLinks(content)) {
        if (isExternalLink(target) || target.startsWith('#')) {
            continue
        }

        if (target.includes('#')) {
            issues.push(buildIssue('skill-anchor-link', relativePath, `skill 相对链接不能携带锚点: ${target}`))
        }

        const normalizedTarget = normalizeLocalTarget(target)

        if (!normalizedTarget) {
            continue
        }

        const resolvedPath = path.resolve(path.dirname(filePath), normalizedTarget)

        if (!(await pathExists(resolvedPath))) {
            issues.push(buildIssue('missing-link-target', relativePath, `相对链接目标不存在: ${target}`))
        }
    }
}

async function loadExternalSkillRegistry(issues) {
    const relativePath = toPosixPath(externalSkillRegistryPath)

    if (!(await pathExists(externalSkillRegistryPath))) {
        issues.push(buildIssue('missing-external-skill-registry', relativePath, '缺少外部 skill 准入清单。'))
        return []
    }

    let parsed

    try {
        parsed = JSON.parse(await readUtf8(externalSkillRegistryPath))
    } catch {
        issues.push(buildIssue('invalid-external-skill-registry', relativePath, '外部 skill 准入清单不是合法 JSON。'))
        return []
    }

    if (!Array.isArray(parsed)) {
        issues.push(buildIssue('invalid-external-skill-registry', relativePath, '外部 skill 准入清单必须是数组。'))
        return []
    }

    const requiredFields = [
        'id',
        'displayName',
        'sourceType',
        'sourcePath',
        'syncAddress',
        'updateCadence',
        'failurePolicy',
        'internalizationThreshold',
        'adoptedFor',
    ]

    const seenIds = new Set()

    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            issues.push(buildIssue('invalid-external-skill-entry', relativePath, '外部 skill 条目必须是对象。'))
            continue
        }

        for (const field of requiredFields) {
            if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
                issues.push(buildIssue('invalid-external-skill-entry', relativePath, `外部 skill 条目缺少必填字段: ${field}`))
            }
        }

        if (typeof entry.id === 'string') {
            if (seenIds.has(entry.id)) {
                issues.push(buildIssue('duplicate-external-skill-id', relativePath, `外部 skill 条目重复: ${entry.id}`))
            }

            seenIds.add(entry.id)
        }

        const projectLocalPath = typeof entry.sourcePath === 'string'
            && (entry.sourcePath.startsWith('.github/') || entry.sourcePath.startsWith('.claude/'))

        if (projectLocalPath) {
            issues.push(buildIssue('invalid-external-skill-source', relativePath, `外部 skill 不应指向项目内部定义路径: ${entry.sourcePath}`))
        }
    }

    return parsed
}

async function validateExternalSkillRegistryDoc(registryEntries, issues) {
    const relativeDocPath = toPosixPath(externalSkillRegistryDocPath)

    if (!(await pathExists(externalSkillRegistryDocPath))) {
        issues.push(buildIssue('missing-external-skill-doc', relativeDocPath, '缺少外部 skill 准入说明文档。'))
        return
    }

    const content = await readUtf8(externalSkillRegistryDocPath)
    const tableRows = content
        .split(/\r?\n/u)
        .filter((line) => line.startsWith('|'))
        .slice(2)
        .map((line) => line
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim()))

    const docIds = tableRows
        .filter((cells) => cells.length >= 1)
        .map((cells) => cells[0].replaceAll('`', ''))

    const docRowMap = new Map(
        tableRows
            .filter((cells) => cells.length >= 7)
            .map((cells) => [cells[0].replaceAll('`', ''), cells]),
    )

    const registryIds = new Set(registryEntries.map((entry) => entry.id))
    const seenDocIds = new Set()

    for (const docId of docIds) {
        if (seenDocIds.has(docId)) {
            issues.push(buildIssue('external-skill-doc-drift', relativeDocPath, `文档存在重复外部 skill 条目: ${docId}`))
            continue
        }

        seenDocIds.add(docId)

        if (!registryIds.has(docId)) {
            issues.push(buildIssue('external-skill-doc-drift', relativeDocPath, `文档存在未登记到事实源的外部 skill 条目: ${docId}`))
        }
    }

    for (const entry of registryEntries) {
        const docRow = docRowMap.get(entry.id)

        if (!docRow) {
            issues.push(buildIssue('external-skill-doc-drift', relativeDocPath, `文档缺少外部 skill 条目: ${entry.id}`))
            continue
        }

        const expectedRow = [
            entry.id,
            entry.adoptedFor,
            entry.sourcePath,
            entry.syncAddress,
            entry.updateCadence,
            entry.failurePolicy,
            entry.internalizationThreshold,
        ]

        const actualRow = [
            docRow[0].replaceAll('`', ''),
            docRow[1],
            docRow[2].replaceAll('`', ''),
            docRow[3].replaceAll('`', ''),
            docRow[4],
            docRow[5],
            docRow[6],
        ]

        const mismatchedFields = [
            'id',
            'adoptedFor',
            'sourcePath',
            'syncAddress',
            'updateCadence',
            'failurePolicy',
            'internalizationThreshold',
        ].filter((fieldName, index) => actualRow[index] !== expectedRow[index])

        if (mismatchedFields.length > 0) {
            issues.push(buildIssue('external-skill-doc-drift', relativeDocPath, `文档与事实源不一致: ${entry.id} -> ${mismatchedFields.join(', ')}`))
        }
    }
}

async function validateAgentOrDocLinks(filePath, issues) {
    const content = await readUtf8(filePath)
    const relativePath = toPosixPath(filePath)

    for (const target of extractMarkdownLinks(content)) {
        if (isExternalLink(target) || target.startsWith('#') || target.startsWith('@')) {
            continue
        }

        const normalizedTarget = normalizeLocalTarget(target)

        if (!normalizedTarget) {
            continue
        }

        const resolvedPath = path.resolve(path.dirname(filePath), normalizedTarget)

        if (!(await pathExists(resolvedPath))) {
            issues.push(buildIssue('missing-link-target', relativePath, `相对链接目标不存在: ${target}`))
        }
    }
}

async function compareMirrorTrees(mainRoot, mirrorRoot, relativeFiles, issues, type) {
    for (const relativeFile of relativeFiles) {
        const mainPath = path.join(mainRoot, relativeFile)
        const mirrorPath = path.join(mirrorRoot, relativeFile)

        if (!(await pathExists(mirrorPath))) {
            issues.push(buildIssue('missing-mirror-file', toPosixPath(mainPath), `${type} 镜像缺失: ${toPosixPath(mirrorPath)}`))
            continue
        }

        const [mainContent, mirrorContent] = await Promise.all([
            readRaw(mainPath),
            readRaw(mirrorPath),
        ])

        if (!mainContent.equals(mirrorContent)) {
            issues.push(buildIssue('mirror-drift', toPosixPath(mainPath), `${type} 主定义与镜像内容不一致: ${toPosixPath(mirrorPath)}`))
        }
    }
}

function findMissingRelativeFiles(mainFiles, mirrorFiles) {
    const mirrorSet = new Set(mirrorFiles)
    return mainFiles.filter((file) => !mirrorSet.has(file))
}

function findExtraRelativeFiles(mainFiles, mirrorFiles) {
    const mainSet = new Set(mainFiles)
    return mirrorFiles.filter((file) => !mainSet.has(file))
}

async function collectReferenceWarnings(skillFiles, agentFiles) {
    const searchableFiles = [
        ...governanceDocs,
        ...agentFiles,
        ...skillFiles,
    ]
    const searchableContents = new Map()

    for (const filePath of searchableFiles) {
        searchableContents.set(filePath, await readUtf8(filePath))
    }

    const warnings = []

    for (const skillPath of skillFiles) {
        const skillName = path.basename(path.dirname(skillPath))
        const skillNeedle = `${skillName}/SKILL.md`
        let referenced = false

        for (const [filePath, content] of searchableContents.entries()) {
            if (filePath === skillPath) {
                continue
            }

            if (content.includes(skillNeedle) || content.includes(skillName)) {
                referenced = true
                break
            }
        }

        if (!referenced) {
            warnings.push(buildIssue('unreferenced-skill', toPosixPath(skillPath), '未在其他治理文件中发现引用，建议确认是否仍需保留。', 'warning'))
        }
    }

    for (const agentPath of agentFiles) {
        const fileName = path.basename(agentPath)
        const agentKey = fileName.replace(/\.agent\.md$/u, '')
        let referenced = false

        for (const [filePath, content] of searchableContents.entries()) {
            if (filePath === agentPath) {
                continue
            }

            if (content.includes(fileName) || content.includes(agentKey)) {
                referenced = true
                break
            }
        }

        if (!referenced) {
            warnings.push(buildIssue('unreferenced-agent', toPosixPath(agentPath), '未在其他治理文件中发现引用，建议确认是否仍需保留。', 'warning'))
        }
    }

    return warnings
}

function printSection(title, lines) {
    console.info(`${title}:`)

    if (lines.length === 0) {
        console.info('- 无')
        return
    }

    for (const line of lines) {
        console.info(`- ${line}`)
    }
}

function unique(values) {
    return [...new Set(values)].sort()
}

async function main() {
    const issues = []

    const githubSkillRelFiles = await listFilesRecursive(governanceRoots.githubSkills, (name) => name === 'SKILL.md')
    const githubAgentRelFiles = await listFilesRecursive(governanceRoots.githubAgents, (name) => name.endsWith('.agent.md'))
    const githubSkillMirrorFiles = await listFilesRecursive(governanceRoots.githubSkills, () => true)
    const githubAgentMirrorFiles = await listFilesRecursive(governanceRoots.githubAgents, () => true)
    const githubSkillDirs = await listDirectoriesRecursive(governanceRoots.githubSkills)
    const githubAgentDirs = await listDirectoriesRecursive(governanceRoots.githubAgents)

    for (const group of mirrorGroups) {
        const skillRoot = group.skillRoot
        const agentRoot = group.agentRoot
        const mirrorSkillFiles = skillRoot ? await listFilesRecursive(skillRoot, () => true) : []
        const mirrorAgentFiles = agentRoot ? await listFilesRecursive(agentRoot, () => true) : []
        const mirrorSkillDirs = skillRoot ? await listDirectoriesRecursive(skillRoot) : []
        const mirrorAgentDirs = agentRoot ? await listDirectoriesRecursive(agentRoot) : []

        if (skillRoot) {
            for (const relativeFile of findMissingRelativeFiles(githubSkillMirrorFiles, mirrorSkillFiles)) {
                issues.push(buildIssue('missing-mirror-file', `.github/skills/${relativeFile}`, `缺少 .${group.name} skill 镜像: .${group.name}/skills/${relativeFile}`))
            }

            for (const relativeFile of findExtraRelativeFiles(githubSkillMirrorFiles, mirrorSkillFiles)) {
                issues.push(buildIssue('extra-mirror-file', `.${group.name}/skills/${relativeFile}`, `发现多余的 .${group.name} skill 镜像定义: .${group.name}/skills/${relativeFile}`))
            }

            for (const directoryName of findExtraRelativeFiles(githubSkillDirs, mirrorSkillDirs)) {
                issues.push(buildIssue('extra-mirror-directory', `.${group.name}/skills/${directoryName}`, `发现未在 .github/skills 中定义的残留镜像目录: .${group.name}/skills/${directoryName}`))
            }

            await compareMirrorTrees(governanceRoots.githubSkills, skillRoot, githubSkillMirrorFiles, issues, 'skill')
        }

        if (agentRoot) {
            for (const relativeFile of findMissingRelativeFiles(githubAgentMirrorFiles, mirrorAgentFiles)) {
                issues.push(buildIssue('missing-mirror-file', `.github/agents/${relativeFile}`, `缺少 .${group.name} agent 镜像: .${group.name}/agents/${relativeFile}`))
            }

            for (const relativeFile of findExtraRelativeFiles(githubAgentMirrorFiles, mirrorAgentFiles)) {
                issues.push(buildIssue('extra-mirror-file', `.${group.name}/agents/${relativeFile}`, `发现多余的 .${group.name} agent 镜像定义: .${group.name}/agents/${relativeFile}`))
            }

            for (const directoryName of findExtraRelativeFiles(githubAgentDirs, mirrorAgentDirs)) {
                issues.push(buildIssue('extra-mirror-directory', `.${group.name}/agents/${directoryName}`, `发现未在 .github/agents 中定义的残留镜像目录: .${group.name}/agents/${directoryName}`))
            }

            await compareMirrorTrees(governanceRoots.githubAgents, agentRoot, githubAgentMirrorFiles, issues, 'agent')
        }
    }

    const githubSkillFiles = githubSkillRelFiles.map((relativeFile) => path.join(governanceRoots.githubSkills, relativeFile))
    const githubAgentFiles = githubAgentRelFiles.map((relativeFile) => path.join(governanceRoots.githubAgents, relativeFile))

    for (const skillFile of githubSkillFiles) {
        await validateSkillFile(skillFile, issues)
    }

    for (const agentFile of githubAgentFiles) {
        await validateAgentOrDocLinks(agentFile, issues)
    }

    for (const docFile of governanceDocs) {
        await validateAgentOrDocLinks(docFile, issues)
    }

    const externalSkillRegistry = await loadExternalSkillRegistry(issues)
    await validateExternalSkillRegistryDoc(externalSkillRegistry, issues)

    const deferredIssues = await collectReferenceWarnings(githubSkillFiles, githubAgentFiles)

    const blockingIssues = issues.filter((issue) => issue.severity === 'error')
    const impactPaths = unique([...blockingIssues, ...deferredIssues].map((issue) => issue.filePath))
    const suggestionLines = unique([
        blockingIssues.some((issue) => issue.type === 'unsupported-skill-frontmatter')
            ? '删除 skill frontmatter 中不受支持的字段，仅保留受支持键。'
            : null,
        blockingIssues.some((issue) => issue.type === 'skill-anchor-link')
            ? '移除 skill 相对链接中的锚点，仅保留实际文件路径。'
            : null,
        blockingIssues.some((issue) => ['skill-internal-mismatch'].includes(issue.type))
            ? '为内部 skill 统一补齐合法的 metadata.internal: true，并保持 .github 与各平台镜像一致。'
            : null,
        blockingIssues.some((issue) => issue.type === 'missing-link-target')
            ? '修正治理文档中的相对路径，确保目标文件真实存在。'
            : null,
        blockingIssues.some((issue) => ['missing-external-skill-registry', 'invalid-external-skill-registry', 'invalid-external-skill-entry', 'duplicate-external-skill-id', 'invalid-external-skill-source', 'missing-external-skill-doc', 'external-skill-doc-drift'].includes(issue.type))
            ? '补齐外部 skill 准入清单与说明文档，并确保文档描述与事实源一致。'
            : null,
        blockingIssues.some((issue) => ['mirror-drift', 'missing-mirror-file', 'extra-mirror-file', 'extra-mirror-directory'].includes(issue.type))
            ? '以 .github 作为主定义，并将各平台镜像（.claude/.opencode/.agents）同步到逐文件一致。'
            : null,
        deferredIssues.length > 0
            ? '为未被引用的 agent / skill 补充入口引用，或确认后归档删除。'
            : null,
    ].filter(Boolean))

    console.info(blockingIssues.length === 0 ? 'AI governance check passed.' : 'AI governance check failed.')

    printSection('问题清单', blockingIssues.map((issue) => `[${issue.type}] ${issue.filePath}: ${issue.message}`))
    printSection('影响范围', impactPaths)
    printSection('修复建议', suggestionLines)
    printSection('可延后事项', deferredIssues.map((issue) => `[${issue.type}] ${issue.filePath}: ${issue.message}`))

    if (blockingIssues.length > 0) {
        process.exitCode = 1
    }
}

await main()
