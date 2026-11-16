import Database from 'better-sqlite3'

/** 线性插值分位数（输入无需排序） */
export function percentile(values, p) {
    if (values.length === 0) {
        throw new Error('values 不能为空')
    }
    if (!(p > 0 && p <= 1)) {
        throw new Error('p 必须在 (0, 1] 之间')
    }
    const sorted = [...values].sort((a, b) => a - b)
    const rank = p * (sorted.length - 1)
    const low = Math.floor(rank)
    const high = Math.ceil(rank)
    if (low === high) {
        return sorted[low]
    }
    return sorted[low] + (sorted[high] - sorted[low]) * (rank - low)
}

/** EXPLAIN QUERY PLAN 的结果里是否出现全表扫描 */
export function hasFullScan(planRows) {
    return planRows.some((row) => /^SCAN\b/u.test(String(row.detail)))
}

/** 确定性伪随机数（mulberry32），保证同 seed 可复现 */
export function createRandom(seed) {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6D2B79F5) >>> 0
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** 创建与生产实体一致的 session 表与索引（仅基准用） */
export function createSchema(db) {
    db.exec(`
        CREATE TABLE session (
            id VARCHAR(36) PRIMARY KEY,
            createdAt DATETIME NOT NULL,
            expiresAt DATETIME NOT NULL,
            token TEXT NOT NULL,
            userId VARCHAR(36) NOT NULL,
            ipAddress TEXT
        );
        CREATE INDEX IDX_session_token ON session (token);
        CREATE INDEX IDX_session_userId ON session (userId);
        CREATE INDEX IDX_session_createdAt ON session (createdAt);
        CREATE INDEX IDX_session_expiresAt ON session (expiresAt);
    `)
}

/** 写入确定性测试数据 */
export function seedSessions(db, { rows, seed = 20260101 }) {
    const random = createRandom(seed)
    const insert = db.prepare('INSERT INTO session (id, createdAt, expiresAt, token, userId, ipAddress) VALUES (?, ?, ?, ?, ?, ?)')
    const base = Date.parse('2026-01-01T00:00:00Z')
    const run = db.transaction((count) => {
        for (let index = 0; index < count; index += 1) {
            const createdAt = new Date(base + Math.floor(random() * 180) * 86400000)
            const expiresAt = new Date(createdAt.getTime() + 7 * 86400000)
            insert.run(
                `sess-${index.toString(36)}`,
                createdAt.toISOString(),
                expiresAt.toISOString(),
                `token-${index.toString(36)}-${Math.floor(random() * 1e9).toString(36)}`,
                `user-${Math.floor(random() * Math.max(1, count / 10)).toString(36)}`,
                `203.0.113.${Math.floor(random() * 255)}`,
            )
        }
    })
    run(rows)
}

/** 重复执行查询并统计耗时（毫秒） */
export function measure(run, iterations) {
    const samples = []
    for (let index = 0; index < iterations; index += 1) {
        const start = process.hrtime.bigint()
        run(index)
        samples.push(Number(process.hrtime.bigint() - start) / 1e6)
    }
    return {
        iterations,
        p50: percentile(samples, 0.5),
        p95: percentile(samples, 0.95),
        max: Math.max(...samples),
    }
}

/**
 * 运行热点查询基准。
 * @param {{ rows?: number, iterations?: number, seed?: number }} [options]
 */
export function runBenchmark(options = {}) {
    const { rows = 50000, iterations = 200, seed = 20260101 } = options
    const db = new Database(':memory:')
    createSchema(db)
    seedSessions(db, { rows, seed })

    const queries = {
        sessionByToken: db.prepare('SELECT * FROM session WHERE token = ?'),
        sessionByUserId: db.prepare('SELECT * FROM session WHERE userId = ? ORDER BY createdAt DESC LIMIT 20'),
        sessionByDateRange: db.prepare('SELECT * FROM session WHERE createdAt BETWEEN ? AND ? ORDER BY createdAt DESC LIMIT 20'),
        deleteExpired: db.prepare('DELETE FROM session WHERE expiresAt < ?'),
    }

    const plans = {}
    const timings = {}
    const checkPlan = (name, sql, params) => {
        plans[name] = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params)
    }

    checkPlan('sessionByToken', 'SELECT * FROM session WHERE token = ?', ['token-x'])
    checkPlan('sessionByUserId', 'SELECT * FROM session WHERE userId = ? ORDER BY createdAt DESC LIMIT 20', ['user-x'])
    checkPlan('sessionByDateRange', 'SELECT * FROM session WHERE createdAt BETWEEN ? AND ? ORDER BY createdAt DESC LIMIT 20', ['2026-01-01', '2026-02-01'])

    timings.sessionByToken = measure((index) => queries.sessionByToken.get(`token-${index.toString(36)}-x`), iterations)
    timings.sessionByUserId = measure((index) => queries.sessionByUserId.all(`user-${(index % Math.max(1, Math.floor(rows / 10))).toString(36)}`), iterations)
    timings.sessionByDateRange = measure(() => queries.sessionByDateRange.all('2026-03-01', '2026-06-30'), iterations)
    timings.deleteExpired = measure(() => queries.deleteExpired.run('2025-12-01'), Math.max(3, Math.floor(iterations / 20)))

    db.close()

    return {
        rows,
        iterations,
        seed,
        plans,
        fullScanQueries: Object.entries(plans)
            .filter(([, plan]) => hasFullScan(plan))
            .map(([name]) => name),
        timings,
    }
}
