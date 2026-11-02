const DAY_IN_MS = 24 * 60 * 60 * 1000
const BLOCKING_SEVERITIES = new Set(['critical', 'high'])
const OPEN_EXEMPTION_CATEGORIES = new Set(['no-fix', 'hard-fix'])
const DISMISSED_EXEMPTION_CATEGORIES = new Set(['false-positive'])

/** 豁免类别：open 告警只认 no-fix / hard-fix，dismissed 告警只认 false-positive */
export const EXEMPTION_CATEGORIES = ['no-fix', 'hard-fix', 'false-positive']

const SEVERITY_LABELS = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    unknown: 'unknown',
}

export const SCOPE_LABELS = {
    release: '发布前检查',
    weekly: '每周规划检查',
}

export function isExemptionCategoryAllowed(category, state) {
    const allowed = state === 'dismissed' ? DISMISSED_EXEMPTION_CATEGORIES : OPEN_EXEMPTION_CATEGORIES
    return allowed.has(category)
}

export function normalizeSeverity(value) {
    const normalized = String(value ?? '').trim().toLowerCase()

    switch (normalized) {
        case 'critical':
        case 'high':
        case 'medium':
        case 'low':
            return normalized
        case 'error':
            return 'high'
        case 'warning':
            return 'medium'
        case 'note':
            return 'low'
        default:
            return 'unknown'
    }
}

function startOfUtcDay(date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function parseDateOnly(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(String(value ?? ''))

    if (!match) {
        return null
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const timestamp = Date.UTC(year, month - 1, day)
    const parsed = new Date(timestamp)

    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
        return null
    }

    return timestamp
}

function matchesStableIdentity(alert, exemption) {
    if (alert.source === 'dependabot') {
        if (!exemption.ghsaId || exemption.ghsaId !== alert.ghsaId) {
            return false
        }

        return !exemption.package || exemption.package === alert.subject
    }

    if (!exemption.ruleId || exemption.ruleId !== alert.ruleId) {
        return false
    }

    return !exemption.path || exemption.path === alert.path
}

export function matchesAlert(alert, exemption) {
    if (exemption.source !== alert.source) {
        return false
    }

    if (exemption.alertNumber !== null && exemption.alertNumber === alert.id) {
        return true
    }

    return matchesStableIdentity(alert, exemption)
}

function describeCriticalBlockingReason(alert, matches) {
    if (alert.state === 'dismissed') {
        return 'critical 不允许豁免（dismiss 不能替代修复）'
    }

    return matches.length > 0 ? 'critical 不允许豁免' : 'critical 必须修复'
}

function describeHighBlockingReason(matches, liveMatches, state) {
    if (matches.length === 0) {
        return 'high 未登记豁免'
    }

    if (liveMatches.length === 0) {
        return 'high 豁免已过期'
    }

    return `high 豁免类别（${liveMatches[0].category ?? '未填写'}）不适用于 ${state} 告警`
}

export function evaluateAlerts({ alerts, exemptions, configErrors = [], warnings = [], today = new Date() }) {
    const todayTimestamp = startOfUtcDay(today)
    const preparedExemptions = exemptions.map((exemption) => {
        const daysLeft = Math.round((exemption.expiresAtTimestamp - todayTimestamp) / DAY_IN_MS)
        return { ...exemption, daysLeft, expired: daysLeft < 0, matched: false }
    })

    const items = alerts.map((alert) => {
        const matches = preparedExemptions.filter((exemption) => matchesAlert(alert, exemption))
        matches.forEach((exemption) => {
            exemption.matched = true
        })

        if (!BLOCKING_SEVERITIES.has(alert.severity)) {
            return {
                alert,
                status: 'non-blocking',
                reason: `${SEVERITY_LABELS[alert.severity] ?? alert.severity} 暂不阻塞发布`,
                exemption: null,
                daysLeft: null,
            }
        }

        if (alert.severity === 'critical') {
            return {
                alert,
                status: 'blocking',
                reason: describeCriticalBlockingReason(alert, matches),
                exemption: matches[0] ?? null,
                daysLeft: null,
            }
        }

        const state = alert.state ?? 'open'
        const liveMatches = matches.filter((exemption) => !exemption.expired)
        const validExemption = liveMatches.find((exemption) => isExemptionCategoryAllowed(exemption.category, state))

        if (validExemption) {
            return {
                alert,
                status: 'exempted',
                reason: `high 已登记有效豁免（${validExemption.category}）`,
                exemption: validExemption,
                daysLeft: validExemption.daysLeft,
            }
        }

        return {
            alert,
            status: 'blocking',
            reason: describeHighBlockingReason(matches, liveMatches, state),
            exemption: matches[0] ?? null,
            daysLeft: matches[0]?.daysLeft ?? null,
        }
    })

    return {
        items,
        blocking: items.filter((item) => item.status === 'blocking'),
        exempted: items.filter((item) => item.status === 'exempted'),
        nonBlocking: items.filter((item) => item.status === 'non-blocking'),
        staleExemptions: preparedExemptions.filter((exemption) => !exemption.matched),
        criticalExemptions: items.filter((item) => item.alert.severity === 'critical' && item.exemption),
        configErrors,
        warnings,
    }
}

function escapeCell(value) {
    return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function renderTable(headers, rows) {
    const lines = [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
    ]

    for (const row of rows) {
        lines.push(`| ${row.map(escapeCell).join(' | ')} |`)
    }

    return lines.join('\n')
}

function formatAlertSubject(item) {
    const alert = item.alert
    return alert.file ? `${alert.subject}（${alert.file}）` : alert.subject
}

export function renderMarkdown({ scope, repo, generatedAt, exemptionsPath, evaluation }) {
    const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
    }

    for (const item of evaluation.items) {
        counts[item.alert.severity] = (counts[item.alert.severity] ?? 0) + 1
    }

    const passed = evaluation.blocking.length === 0 && evaluation.configErrors.length === 0
    const lines = []

    lines.push(`# 安全告警门禁报告（${SCOPE_LABELS[scope] ?? scope}）`, '')
    lines.push(`- 仓库：\`${repo}\``)
    lines.push(`- 检查时间：${generatedAt}`)
    lines.push('- 数据源：Dependabot alerts、Code scanning alerts（open + dismissed，auto_dismissed 除外）')
    lines.push(`- 豁免清单：\`${exemptionsPath}\``)
    lines.push('')
    lines.push(`## 结论：${passed ? '✅ 通过' : '🚫 未通过'}`, '')
    lines.push(renderTable(
        ['严重级别', '告警数', '阻塞', '已豁免'],
        ['critical', 'high', 'medium', 'low', 'unknown'].map((severity) => [
            severity,
            counts[severity] ?? 0,
            evaluation.blocking.filter((item) => item.alert.severity === severity).length,
            evaluation.exempted.filter((item) => item.alert.severity === severity).length,
        ]),
    ), '')

    if (evaluation.blocking.length > 0) {
        lines.push('### 阻塞项（必须处理）', '')
        lines.push(renderTable(
            ['来源', '编号', '状态', '级别', '对象', '原因', '处理建议', '链接'],
            evaluation.blocking.map((item) => [
                item.alert.source,
                item.alert.id,
                item.alert.state ?? 'open',
                item.alert.severity,
                formatAlertSubject(item),
                item.reason,
                item.alert.severity === 'critical'
                    ? '升级或移除受影响依赖/规则，critical 不允许豁免'
                    : '升级到已修复版本；确无可用修复版本时登记豁免并安排跟进',
                item.alert.url || '-',
            ]),
        ), '')
    }

    if (evaluation.exempted.length > 0) {
        lines.push('### 已豁免的 high 告警（需按 tracking 跟进）', '')
        lines.push(renderTable(
            ['来源', '编号', '状态', '对象', '类别', '豁免原因', '追踪', '到期日', '剩余天数'],
            evaluation.exempted.map((item) => [
                item.alert.source,
                item.alert.id,
                item.alert.state ?? 'open',
                formatAlertSubject(item),
                item.exemption.category,
                item.exemption.reason,
                item.exemption.tracking,
                item.exemption.expiresAt,
                item.daysLeft,
            ]),
        ), '')
    }

    if (evaluation.nonBlocking.length > 0) {
        lines.push('### 暂不阻塞（medium / low / unknown）', '')
        lines.push(renderTable(
            ['来源', '编号', '级别', '对象', '链接'],
            evaluation.nonBlocking.map((item) => [
                item.alert.source,
                item.alert.id,
                item.alert.severity,
                formatAlertSubject(item),
                item.alert.url || '-',
            ]),
        ), '')
    }

    const exemptionIssues = [
        ...evaluation.criticalExemptions.map((item) => `critical 告警 #${item.alert.id} 登记了豁免，必须删除该豁免并修复漏洞。`),
        ...evaluation.staleExemptions.map((exemption) => `豁免条目已无对应告警（alertNumber=${exemption.alertNumber ?? '-'}），请删除以免掩盖新告警。`),
        ...evaluation.configErrors,
    ]

    if (exemptionIssues.length > 0) {
        lines.push('### 豁免清单问题', '')
        lines.push(...exemptionIssues.map((issue) => `- ${issue}`), '')
    }

    if (evaluation.warnings.length > 0) {
        lines.push('### 提示', '')
        lines.push(...evaluation.warnings.map((warning) => `- ${warning}`), '')
    }

    lines.push('## 处置口径', '')
    lines.push('- 扫描范围：open 与 dismissed 告警都要看；auto_dismissed（不再适用）不参与阻断。')
    lines.push('- critical：必须修复，不允许豁免；被 dismiss 也不能替代修复。')
    lines.push('- high：默认阻塞；open 告警仅 no-fix（上游无可用修复版本）/ hard-fix（本发布窗口无法完成）可豁免，dismissed 告警仅 false-positive 可豁免且 reason 需写明原 dismiss 原因；均须登记 tracking 与 expiresAt。')
    lines.push('- medium / low：不阻塞当前发布，随后续版本升级修复。')
    lines.push('- Code scanning alerts 与 Dependabot alerts 采用同一口径。')
    lines.push('- 无法完成扫描（token 失效、权限不足、404、网络异常）按未通过处理，不得把"未扫描"当作"无告警"。')
    lines.push('')

    return lines.join('\n')
}
