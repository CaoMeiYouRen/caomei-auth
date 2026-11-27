/**
 * 文档锚点 slug（阶段 18 D67）。
 *
 * 为什么需要：VitePress 默认 slugify 会给数字开头的标题补一个 `_` 前缀
 * （`## 7. 进度表` → `_7-进度表`），而仓库内 30+ 交叉引用沿用 GitHub 的锚点
 * （`#7-进度表`），导致这些链接在文档站点上全部落空；`ignoreDeadLinks: true`
 * 又让 `docs:build` 不报错，问题长期不可见。
 *
 * 这里按 GitHub 的口径实现：
 * - 转小写；
 * - 去掉标点（保留字母、数字、CJK、空格、连字符、下划线）；
 * - 连续空白折叠成单个连字符；
 * - 不补前缀。
 *
 * 站点配置与校验脚本共用本模块，保证「生成的 id」与「校验的 id」永远同源。
 */

/** GitHub 会从锚点里剥掉的标点（Unicode 标点 + ASCII 符号，保留 `-` 与 `_`） */
const STRIPPED_PUNCTUATION = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65]/gu

export function githubSlugify(text) {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(STRIPPED_PUNCTUATION, '')
        .trim()
        /* GitHub 逐个把空白替换成连字符、不折叠：`Coverage & Recovery` 去掉 `&` 后
         * 会留下两个空格 → `coverage--recovery`，折叠会产出与 GitHub 不同的 id */
        .replace(/\s/gu, '-')
}

/**
 * 从 Markdown 文本中提取标题 slug（与站点渲染顺序一致：按出现顺序，重复标题追加 `-1`、`-2`）。
 *
 * 只处理 ATX 标题（`#` 开头），忽略代码块内的行与引用块。
 */
export function extractHeadingSlugs(markdown) {
    const slugs = []
    const seen = new Map()
    let inFence = false

    for (const line of markdown.split(/\r?\n/u)) {
        if (/^\s*(```|~~~)/u.test(line)) {
            inFence = !inFence
            continue
        }
        if (inFence) {
            continue
        }
        const match = /^(#{1,6})\s+(.*?)\s*#*\s*$/u.exec(line)
        if (!match) {
            continue
        }
        const base = githubSlugify(match[2])
        if (!base) {
            continue
        }
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        slugs.push(count === 0 ? base : `${base}-${count}`)
    }

    return slugs
}
