# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)，未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前进行中阶段：阶段 4「caomei-ui P4 Admin 与 P5 单库收尾」（2026-11-10 授权）**

- 范围与验收口径：[阶段 4 登记记录](../design/governance/2026-11-10-phase4-registration.md)
- P4-0 技术方案：[Admin 迁移基座方案](../design/governance/2026-11-10-p4-admin-migration-plan.md)
- 构成：**2 条主线 / 15 条原子条目**（P4 Admin 数据页 + P5 卸载 PrimeVue）
- 边界：只做 P4/P5 组件迁移与收尾；i18n 页面文案、邮件、SEO 与新产品功能不在本阶段。

## 阶段 4 原子条目

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M1 | P4-0 Admin 迁移基座与视觉矩阵 | DataTable / Dialog / Select 适配决策、Admin 视觉参考态与自基线、Admin 夹具、暗色 token | 已完成（2026-11-10） |
| M2 | P4-1 Admin 用户页 | `pages/admin/users.vue`：DataTable / 筛选 / 分页 / 选择 / 批量操作 | 已完成（2026-11-10） |
| M3 | P4-2 Admin 用户对话框 | `components/admin/users/*`：创建 / 封禁 / 详情 / 会话 | 已完成（2026-11-11） |
| M4 | P4-3 Admin OAuth 应用页 | `pages/admin/oauth/applications.vue`：DataTable / 筛选 / 分页 | 已完成（2026-11-12） |
| M5 | P4-4 Admin OAuth 对话框 | `components/admin/oauth/*`：创建 / 密钥 / API 文档 | 已完成（2026-11-12） |
| M6 | P4-5 Admin SSO 提供商页 | `pages/admin/sso/providers.vue`：DataTable / 筛选 / 分页 | 已完成（2026-11-12） |
| M7 | P4-6 Admin SSO 表单 | `components/admin/sso/*`：OIDC / SAML / 属性映射 | 已完成（2026-11-13） |
| M8 | P4-7 Admin SSO 对话框 | `components/admin/sso/*`：创建 / 详情 | 已完成（2026-11-13） |
| M9 | P4-8 Admin 日志页与表格 | `pages/admin/logs.vue`、`components/admin/logs/logs-table.vue`、筛选与 DatePicker range | 已完成（2026-11-14） |
| M10 | P4-9 Admin 日志统计组件 | `components/admin/logs/{stats-overview,period-stats,provider-stats,trend-chart}.vue` | 已完成（2026-11-14） |
| M11 | P4-10 剩余页面与共享封装 | `pages/oauth/clients.vue`、`pages/index.vue`、`error.vue`、`components/base/*` V1 收口 | 已完成（2026-11-14） |
| M12 | P4-11 P4 收口 | 白名单、包体、视觉、回退、文档 | 待开始 |
| M13 | P5-1 移除 PrimeVue 运行时与依赖 | 依赖、Provider、导入、构建配置、测试 mock | 待开始 |
| M14 | P5-2 清理样式 / token / 白名单 | `--p-*` / `.p-*`、V1 封装（含无消费者的 send-code-button / demo-mode-dialog）、白名单文件、迁移守卫 | 待开始 |
| M15 | P5-3 阶段 4 收口与归档 | 最终包体、视觉、文档、Review Gate、归档 | 待开始 |

## 说明

- 阶段 4 的验收、依赖与风险以 [阶段 4 登记记录](../design/governance/2026-11-10-phase4-registration.md) 为准；本表只登记状态，不重复条款。
- 每个迁移路由整页切换、独立提交、独立回滚；未登记路由继续使用 PrimeVue。
- 完成态不得早于 Review Gate 结论；未完成事项的登记口径见 [规划规范 §5](../standards/planning.md#5-状态同步)。
