# 阶段 12 里程碑：安全可观测性与会话治理（2026-11-23 收口）

> 索引与阶段正文见 [todo-archive-phases-12.md](./todo-archive-phases-12.md)；范围登记见 [2026-11-21-phase12-registration.md](../../design/governance/2026-11-21-phase12-registration.md)，收口记录见 [2026-11-23-phase12-closure.md](../../design/governance/2026-11-23-phase12-closure.md)。

- **目标**：建立可查询的登录事件数据源与管理端事件视图，提供时间 × 事件类型热力图；补齐可信设备查看 / 吊销、按用户批量撤销会话与多方言撤销脚本。
- **交付**：
    - 事件基座：`LoginEvent` 实体 + 5 个索引、better-auth 生命周期写入插件（fail-open / 超时 / 元数据白名单）、90 天保留期与 1 小时节流惰性清理、契约矩阵。
    - 查询与视图：`/api/admin/login-events` 列表 / 统计 / 热力图端点，`/admin/logs` 事件面板（筛选 / 分页 / 用户直达）与 6 张热力图基线。
    - 可信设备：`TrustedDevice` 实体与 2FA 采集、用户安全页面板与端点、管理员查看 / 吊销、按用户批量撤销会话与多方言脚本。
    - 隐私与门禁：`security.md` §1.4、安全可观测性口径、5 语事件 / 可信设备文案、全量门禁。
- **关键决策**：D18 事件模型；D19 保留期与惰性清理；D20 fail-open 与禁敏感字段；D21 管理员专用查询；D22 热力图 7 天 / 30 天粒度；D23 可信设备模型；D24 批量撤销与脚本；D25 不导出 / 不评分。
- **质量门**：`lint` / `lint:css` / `typecheck` / `test`（213 文件 / 1493 用例）/ `test:coverage`（Statements 78.76% / Lines 78.96%）/ `i18n:check` / `ai:check` / `lint:md:check` / `planning:check` / `quality:file-size` / `lint:duplicate` / `migration:check-imports` / `migration:check-budget` / `build` / `test:visual`（151）全绿；官方 Playwright 1.65 镜像复跑一致。
- **Review Gate**：M1.1 R1 Reject → R2 Pass；M1.2 R1 Reject → R2 Pass；M1.3 R1 Pass；M1.4 R1 Pass → R2 Pass；M2.1 R1 Pass；M2.2 R1 Reject → R3 Pass；M2.3 R1 Reject → R2 Pass；M3.1 R1 Reject → R2 Pass；M3.2 R1 Pass → R2 Pass；M4.1 R1 Pass → R2 Pass；M4.2 R1 Reject → R2 Pass；M4.3 R1 Reject → R2 Pass；M5.1 R1 Pass。
- **未覆盖边界**：MySQL / PostgreSQL 撤销脚本无运行时实例验证；可信设备管理端列表仅空态视觉基线；热力图 1440 桌面内滚动未单独基线；统计 / 热力图内存上限与 IP 索引、多方言清理脚本已登记 backlog；真实社交 / 企业 IdP 回调与多实例限流不在范围。
