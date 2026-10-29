import { appendFile, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
    evaluateAlerts,
    normalizeSeverity,
    parseDateOnly,
    renderMarkdown,
    SCOPE_LABELS,
} from './alert-policy.mjs'

const API_ROOT = 'https://api.github.com'
const API_VERSION = '2022-11-28'
const DEFAULT_EXEMPTIONS_PATH = '.github/security-alert-exemptions.json'
const PER_PAGE = 100
const MAX_PAGES = 20
const VALID_SOURCES = new Set(['dependabot', 'code-scanning'])

class GitHubApiError extends Error {
    constructor(status, url, detail = '') {
        super(`GitHub API 请求失败（${status || 'network'}）：${url}${detail ? ` - ${detail}` : ''}`)
        this.name = 'GitHubApiError'
        this.status = status
        this.url = url
    }
}

function parseArgs(argv) {
    const args = {}

    for (const arg of argv) {
        if (!arg.startsWith('--')) {
            continue
        }

        const separatorIndex = arg.indexOf('=')

        if (separatorIndex === -1) {
            args[arg.slice(2)] = true
            continue
        }

        args[arg.slice(2, separatorIndex)] = arg.slice(separatorIndex + 1)
    }

    return args
}

function resolveRepo({ repoArg, packageJson, env = process.env } = {}) {
    if (typeof repoArg === 'string' && repoArg.trim() !== '') {
        return repoArg.trim()
    }

    if (typeof env.GITHUB_REPOSITORY === 'string' && env.GITHUB_REPOSITORY.trim() !== '') {
        return env.GITHUB_REPOSITORY.trim()
    }

    const repository = packageJson?.repository
    const repositoryUrl = typeof repository === 'string' ? repository : repository?.url

    if (typeof repositoryUrl === 'string') {
        const match = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?$/u)

        if (match) {
            return `${match[1]}/${match[2]}`
        }
    }

    throw new Error('无法确定目标仓库：请通过 --repo=owner/repo 或环境变量 GITHUB_REPOSITORY 指定。')
}

function resolveToken({ tokenArg, env = process.env } = {}) {
    if (typeof tokenArg === 'string' && tokenArg.trim() !== '') {
        return tokenArg.trim()
    }

    return String(env.GH_TOKEN || env.GITHUB_TOKEN || '').trim()
}

async function requestJson({ url, token, fetchImpl = fetch, allowNotFound = false }) {
    let response

    try {
        response = await fetchImpl(url, {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'User-Agent': 'caomei-auth-security-alert-gate',
                'X-GitHub-Api-Version': API_VERSION,
            },
        })
    } catch (error) {
        throw new GitHubApiError(0, url, `网络请求异常：${error instanceof Error ? error.message : String(error)}`)
    }

    if (allowNotFound && response.status === 404) {
        return { data: null, headers: response.headers, notFound: true }
    }

    if (!response.ok) {
        const detail = typeof response.text === 'function' ? await response.text().catch(() => '') : ''
        throw new GitHubApiError(response.status, url, detail.slice(0, 500))
    }

    return { data: await response.json(), headers: response.headers, notFound: false }
}

function findNextLink(headers) {
    const linkHeader = typeof headers?.get === 'function' ? headers.get('link') : ''

    if (!linkHeader) {
        return ''
    }

    for (const part of linkHeader.split(',')) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/u)

        if (match) {
            return match[1]
        }
    }

    return ''
}

async function fetchOpenAlerts({ repo, source, token, fetchImpl = fetch }) {
    const endpoint = source === 'dependabot'
        ? `/repos/${repo}/dependabot/alerts`
        : `/repos/${repo}/code-scanning/alerts`
    const alerts = []
    // Dependabot alerts 使用游标分页（page 参数会返回 400），统一改为跟随 Link 头的 rel="next"。
    let url = `${API_ROOT}${endpoint}?state=open&per_page=${PER_PAGE}`

    for (let page = 1; page <= MAX_PAGES && url; page += 1) {
        // code scanning 未启用时返回 404，按"无告警"处理，不阻塞发布。
        let result

        try {
            result = await requestJson({ url, token, fetchImpl, allowNotFound: source === 'code-scanning' })
        } catch (error) {
            error.source = source
            throw error
        }

        const { data, headers, notFound } = result

        if (notFound) {
            return { alerts, unavailable: true }
        }

        if (!Array.isArray(data)) {
            throw new GitHubApiError(0, url, '返回内容不是数组')
        }

        alerts.push(...data)
        url = findNextLink(headers)
    }

    return { alerts, unavailable: false }
}

function normalizeDependabotAlert(alert) {
    const advisory = alert.security_advisory ?? {}
    const vulnerability = advisory.vulnerabilities?.[0] ?? {}
    const packageName = alert.dependency?.package?.name ?? 'unknown'

    return {
        source: 'dependabot',
        id: alert.number,
        severity: normalizeSeverity(advisory.severity),
        title: advisory.summary ?? `${packageName} 依赖漏洞`,
        subject: packageName,
        ghsaId: advisory.ghsa_id ?? '',
        file: alert.dependency?.manifest_path ?? '',
        fixedVersion: vulnerability.first_patched_version?.identifier ?? '',
        createdAt: alert.created_at ?? '',
        url: alert.html_url ?? '',
    }
}

function normalizeCodeScanningAlert(alert) {
    const rule = alert.rule ?? {}
    const location = alert.most_recent_instance?.location ?? {}

    return {
        source: 'code-scanning',
        id: alert.number,
        severity: normalizeSeverity(rule.security_severity_level ?? rule.severity),
        title: rule.description ?? rule.name ?? rule.id ?? '代码扫描告警',
        subject: rule.id ?? 'unknown',
        ruleId: rule.id ?? '',
        path: location.path ?? '',
        createdAt: alert.created_at ?? '',
        url: alert.html_url ?? '',
    }
}

function normalizeAlert(source, alert) {
    return source === 'dependabot'
        ? normalizeDependabotAlert(alert)
        : normalizeCodeScanningAlert(alert)
}

async function loadExemptions(filePath) {
    let content

    try {
        content = await readFile(filePath, 'utf8')
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {
                exemptions: [],
                warnings: [`未找到豁免清单 ${filePath}，本次按"无豁免"处理。`],
                errors: [],
            }
        }

        throw error
    }

    let parsed

    try {
        parsed = JSON.parse(content)
    } catch {
        return { exemptions: [], warnings: [], errors: [`豁免清单 ${filePath} 不是合法 JSON。`] }
    }

    const rawList = Array.isArray(parsed) ? parsed : parsed?.exemptions

    if (!Array.isArray(rawList)) {
        return { exemptions: [], warnings: [], errors: [`豁免清单 ${filePath} 缺少 exemptions 数组。`] }
    }

    const exemptions = []
    const errors = []

    for (const [index, entry] of rawList.entries()) {
        const location = `${filePath}#exemptions[${index}]`

        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            errors.push(`${location}: 条目必须是对象。`)
            continue
        }

        const entryErrors = []

        if (!VALID_SOURCES.has(entry.source)) {
            entryErrors.push('source 必须是 dependabot 或 code-scanning')
        }

        const alertNumber = Number.isInteger(entry.alertNumber) ? entry.alertNumber : null
        const hasStableIdentity = entry.source === 'dependabot'
            ? typeof entry.ghsaId === 'string' && entry.ghsaId.trim() !== ''
            : typeof entry.ruleId === 'string' && entry.ruleId.trim() !== ''

        if (alertNumber === null && !hasStableIdentity) {
            entryErrors.push('必须提供 alertNumber，或 dependabot 的 ghsaId（可配 package）/ code-scanning 的 ruleId（可配 path）')
        }

        if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
            entryErrors.push('缺少 reason（无可修复版本 / 修复成本过高的说明）')
        }

        if (typeof entry.tracking !== 'string' || entry.tracking.trim() === '') {
            entryErrors.push('缺少 tracking（追踪 Issue 或待办链接）')
        }

        const expiresAtTimestamp = parseDateOnly(entry.expiresAt)

        if (expiresAtTimestamp === null) {
            entryErrors.push('expiresAt 必须是合法的 YYYY-MM-DD')
        }

        if (entryErrors.length > 0) {
            errors.push(`${location}: ${entryErrors.join('；')}`)
            continue
        }

        exemptions.push({
            index,
            source: entry.source,
            alertNumber,
            ghsaId: entry.ghsaId ?? '',
            package: entry.package ?? '',
            ruleId: entry.ruleId ?? '',
            path: entry.path ?? '',
            reason: entry.reason.trim(),
            tracking: entry.tracking.trim(),
            expiresAt: entry.expiresAt,
            expiresAtTimestamp,
            note: typeof entry.note === 'string' ? entry.note.trim() : '',
        })
    }

    return { exemptions, warnings: [], errors }
}

function describeApiFailure(error, source) {
    const lines = [`安全告警扫描失败：${error.message}`]

    if (!(error instanceof GitHubApiError)) {
        return lines
    }

    if (error.status === 401) {
        lines.push('GH_TOKEN 已失效：请重新生成 fine-grained PAT 并更新 Secret GH_TOKEN。')
    } else if (error.status === 403) {
        lines.push(source === 'dependabot'
            ? 'GITHUB_TOKEN 无法读取 Dependabot alerts：请配置具备 Dependabot alerts: read 的 GH_TOKEN。'
            : '权限不足：GH_TOKEN 需要 security-events: read（或对应 Code scanning 权限）。')
    } else if (error.status === 404) {
        lines.push('仓库未启用 Dependabot alerts 或 token 无权访问该仓库，请在 Settings → Code security 开启后重试。')
    } else {
        lines.push('请检查网络与 GitHub API 可用性后重试；本次检查未完成，按未通过处理。')
    }

    return lines
}

async function readPackageJson() {
    try {
        return JSON.parse(await readFile('package.json', 'utf8'))
    } catch {
        return {}
    }
}

/**
 * 收集开放告警：默认调用 GitHub API，也支持用 --dependabot-json / --code-scanning-json 回放本地快照。
 */
async function collectAlerts({ args, repo, warnings }) {
    if (typeof args['dependabot-json'] === 'string' && typeof args['code-scanning-json'] === 'string') {
        warnings.push('当前为离线回放模式（--dependabot-json / --code-scanning-json），未调用 GitHub API。')

        const rawDependabotAlerts = JSON.parse(await readFile(args['dependabot-json'], 'utf8'))
        const rawCodeScanningAlerts = JSON.parse(await readFile(args['code-scanning-json'], 'utf8'))

        return { rawDependabotAlerts, rawCodeScanningAlerts }
    }

    const token = resolveToken({ tokenArg: typeof args.token === 'string' ? args.token : '' })

    if (!token) {
        throw new Error('缺少 GH_TOKEN / GITHUB_TOKEN：读取 Dependabot alerts 需要 fine-grained PAT（Dependabot alerts: read）。')
    }

    const dependabotResult = await fetchOpenAlerts({ repo, source: 'dependabot', token })
    const codeScanningResult = await fetchOpenAlerts({ repo, source: 'code-scanning', token })

    if (codeScanningResult.unavailable) {
        warnings.push('仓库未启用 Code scanning（API 返回 404），本次按 0 条告警处理。')
    }

    return {
        rawDependabotAlerts: dependabotResult.alerts,
        rawCodeScanningAlerts: codeScanningResult.alerts,
    }
}

function buildJsonPayload({ scope, repo, generatedAt, exemptionsPath, alertList, evaluation, warnings }) {
    return {
        scope,
        repo,
        generatedAt,
        exemptionsPath,
        passed: evaluation.blocking.length === 0 && evaluation.configErrors.length === 0,
        counts: {
            total: alertList.length,
            blocking: evaluation.blocking.length,
            exempted: evaluation.exempted.length,
            nonBlocking: evaluation.nonBlocking.length,
            bySeverity: alertList.reduce((accumulator, alert) => {
                accumulator[alert.severity] = (accumulator[alert.severity] ?? 0) + 1
                return accumulator
            }, {}),
        },
        blocking: evaluation.blocking.map((item) => ({ ...item.alert, reason: item.reason })),
        exempted: evaluation.exempted.map((item) => ({ ...item.alert, exemption: item.exemption, daysLeft: item.daysLeft })),
        nonBlocking: evaluation.nonBlocking.map((item) => item.alert),
        staleExemptions: evaluation.staleExemptions,
        configErrors: evaluation.configErrors,
        warnings,
    }
}

async function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv)
    const scope = typeof args.scope === 'string' ? args.scope : 'release'

    if (!Object.hasOwn(SCOPE_LABELS, scope)) {
        console.error(`未知的 scope: ${scope}（可选：${Object.keys(SCOPE_LABELS).join(' / ')}）`)
        process.exitCode = 1
        return
    }

    const exemptionsPath = typeof args.exemptions === 'string' ? args.exemptions : DEFAULT_EXEMPTIONS_PATH
    const packageJson = await readPackageJson()
    const repo = resolveRepo({ repoArg: typeof args.repo === 'string' ? args.repo : '', packageJson })
    const generatedAt = new Date().toISOString()
    const warnings = []

    let collected

    try {
        collected = await collectAlerts({ args, repo, warnings })
    } catch (error) {
        const source = error?.source === 'code-scanning' ? 'code-scanning' : 'dependabot'
        console.error(describeApiFailure(error, source).join('\n'))
        process.exitCode = 1
        return
    }

    const alertList = [
        ...collected.rawDependabotAlerts.map((alert) => normalizeAlert('dependabot', alert)),
        ...collected.rawCodeScanningAlerts.map((alert) => normalizeAlert('code-scanning', alert)),
    ]

    const exemptionResult = await loadExemptions(exemptionsPath)
    warnings.push(...exemptionResult.warnings)

    const evaluation = evaluateAlerts({
        alerts: alertList,
        exemptions: exemptionResult.exemptions,
        configErrors: exemptionResult.errors,
        warnings,
    })

    const markdown = renderMarkdown({
        scope,
        repo,
        generatedAt,
        exemptionsPath,
        evaluation,
    })

    console.info(markdown)

    const failed = evaluation.blocking.length > 0 || evaluation.configErrors.length > 0

    if (failed) {
        console.error(`安全告警门禁未通过：阻塞项 ${evaluation.blocking.length} 个，豁免清单问题 ${evaluation.configErrors.length} 个。`)
    } else {
        console.info(`安全告警门禁通过：已豁免 high ${evaluation.exempted.length} 个，非阻塞 ${evaluation.nonBlocking.length} 个。`)
    }

    if (typeof args.report === 'string' && args.report !== '') {
        await writeFile(args.report, markdown, 'utf8')
    }

    if (typeof args.json === 'string' && args.json !== '') {
        const payload = buildJsonPayload({ scope, repo, generatedAt, exemptionsPath, alertList, evaluation, warnings })
        await writeFile(args.json, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    }

    if (typeof process.env.GITHUB_STEP_SUMMARY === 'string' && process.env.GITHUB_STEP_SUMMARY !== '') {
        await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, 'utf8')
    }

    if (failed) {
        process.exitCode = 1
    }
}

export {
    collectAlerts,
    fetchOpenAlerts,
    loadExemptions,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    parseArgs,
    resolveRepo,
    resolveToken,
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
    await main()
}
