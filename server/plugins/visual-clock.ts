/**
 * 视觉验证层的固定时钟（仅测试环境生效）。
 *
 * 为什么需要：Admin 页面会展示注册时间、会话时间、相对时间与「最近 30 天」趋势图。
 * 若直接使用真实时间，同一条视觉基线在跨天后必然漂移，无法作为回归门禁。
 * 这里把进程时钟整体平移到固定锚点，并**继续按真实速度前进**（偏移量固定，
 * 不是冻结时间），因此 better-auth 的限流窗口、会话过期等时间语义仍然成立。
 *
 * 启用条件：`VISUAL_HARNESS=1` + `VISUAL_FIXED_NOW` 可解析 + `DATABASE_PATH` 含 `.visual`
 * （由 `tests/visual/helpers/config.ts` 注入）。生产环境不设置这些变量，本插件不会改变任何行为。
 *
 * 依据：docs/design/governance/2026-11-10-p4-admin-migration-plan.md §3.5。
 */
export default defineNitroPlugin(() => {
    const fixedNow = process.env.VISUAL_FIXED_NOW
    const databasePath = process.env.DATABASE_PATH ?? ''

    /* 三重保险：视觉 harness 开关 + 显式锚点 + 视觉库路径同时成立才改时钟，
     * 避免生产环境误设变量后影响运行。 */
    if (process.env.VISUAL_HARNESS !== '1' || !fixedNow || !databasePath.includes('.visual')) {
        return
    }

    const anchor = Date.parse(fixedNow)

    if (!Number.isFinite(anchor)) {
        throw new Error(`VISUAL_FIXED_NOW 不是有效时间：${fixedNow}`)
    }

    const RealDate = Date
    const offset = anchor - RealDate.now()

    /* 使用 Proxy 保留 `instanceof Date`、`Date.parse` / `Date.UTC` 与原型链语义，
     * 只拦截「无参构造」与 `Date.now`，避免子类化带来的重载与跨模块实例问题。 */
    const visualDate = new Proxy(RealDate, {
        construct(target, args, newTarget) {
            if (args.length === 0) {
                return Reflect.construct(target, [RealDate.now() + offset], newTarget)
            }
            return Reflect.construct(target, args, newTarget)
        },
        get(target, property, receiver) {
            if (property === 'now') {
                return () => RealDate.now() + offset
            }
            return Reflect.get(target, property, receiver)
        },
    })

    globalThis.Date = visualDate
})
