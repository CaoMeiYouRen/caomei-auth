# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)，未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前进行中阶段：阶段 3「caomei-ui P2–P3 迁移与 i18n 非组件面」已收口（2026-11-09）**

- 范围与验收口径的单一事实源：[阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)
- 收口结果与回退证据：[阶段 3 收口记录](../design/governance/2026-11-09-phase3-closure.md)
- 当前仅剩 **M0-3 `release.yml` 定时发版验证**（2026-11-14 20:00 UTC+8 或手动 dispatch）；其余原子条目已完成并归档。
- 边界：本阶段只做 P2–P3 页面替换、非组件 i18n 与发布链路修复；P4/P5、页面文案、邮件与 SEO 未授权。

## 阶段 3 原子条目

### M0 发布链路插队（2026-11-08 授权，不计入主线）

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M0-3 | `release.yml` 去 QEMU | `release` 输出 tag → `docker` 调用复用工作流；保留 semver / latest / 日期 / `sha-*` | 待验证（定时 2026-11-14 20:00 UTC+8 或手动 dispatch 会正式发版） |

## 说明

- 阶段 3 的验收、依赖与风险以 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md) 为准；本表只登记状态，不重复条款。
- 每个迁移路由整页切换、独立提交、独立回滚；未登记路由继续使用 PrimeVue。
- 完成态不得早于 Review Gate 结论；未完成事项的登记口径见 [规划规范 §5](../standards/planning.md#5-状态同步)。
