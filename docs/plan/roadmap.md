# 项目路线图 (Roadmap)

本文档概述草梅 Auth 的中长期发展方向与大颗粒度阶段规划。候选条目、优先级与验收要点见 [backlog.md](./backlog.md)；进行中阶段的小条目见 [todo.md](./todo.md)；已收口阶段的索引见 [todo-archive.md](./todo-archive.md)（阶段 1–9 的权威记录见 [规划规范](../standards/planning.md) §4，摘要见 [已完成工作归档](../archive/completed-work.md)）；准入与归档规则见 [规划规范](../standards/planning.md)。

> **归档模型（2026-11-20 起）**：阶段 1–9 详情保留在本文件；自阶段 10 起，已收口阶段详情按 [规划规范](../standards/planning.md) §8 迁入 `docs/plan/archive/roadmap-phases-*.md`，本文件只保留里程碑概览与当前阶段。


> **当前状态**：**阶段 15「认证移动端可用性」已于 2026-11-26 登记并确认开工（进行中）**（范围见 [阶段 15 范围登记](../design/governance/2026-11-26-phase15-registration.md)，条目见 [todo.md](./todo.md)）。阶段 14「国际化门禁与前端健壮性」已于 2026-11-26 收口（里程碑见 [roadmap-phases-14](./archive/roadmap-phases-14.md)，阶段正文见 [todo-archive-phases-14](./archive/todo-archive-phases-14.md)，收口记录见 [阶段 14 收口记录](../design/governance/2026-11-26-phase14-closure.md)）。阶段 13「可观测性规模化与运维闭环」已于 2026-11-23 收口（里程碑见 [roadmap-phases-13](./archive/roadmap-phases-13.md)，阶段正文见 [todo-archive-phases-13](./archive/todo-archive-phases-13.md)）。阶段 12「安全可观测性与会话治理」已于 2026-11-23 收口（里程碑见 [roadmap-phases-12](./archive/roadmap-phases-12.md)，阶段正文见 [todo-archive-phases-12](./archive/todo-archive-phases-12.md)）。阶段 11「2FA 覆盖收紧与登录通道闭环」已于 2026-11-21 收口（里程碑见 [roadmap-phases-11](./archive/roadmap-phases-11.md)，阶段正文见 [todo-archive-phases-11](./archive/todo-archive-phases-11.md)）。阶段 10「用户侧替代证明」已于 2026-11-21 收口（里程碑见 [roadmap-phases-10](./archive/roadmap-phases-10.md)）。阶段 9「账号找回与 2FA 边界治理」已于 2026-11-20 收口（M1–M13 全部交付），记录见 [阶段 9 收口记录](../design/governance/2026-11-20-phase9-closure.md)；后续候选见 [backlog §2.12](./backlog.md)。

---

## 阶段 1: 稳定性、规范化与核心增强（主体完成，已暂停）

_目标：通过重构和技术规范升级，打造稳健、安全的统一认证基石。_

- [x] **架构解耦 (G1)**: 邮件、短信、验证码模块完成解耦与 DI 引入。
- [x] **文件瘦身 (G2)**: 超长文件清理，逻辑下沉至 Composables。
- [x] **Zod 基础设施**: 引入 Zod 实现 Schema 驱动校验，前后端共用 Schema。

> 阶段 1 的已完成部分见 [已完成工作归档](../archive/completed-work.md)。剩余候选（i18n 全量落地、测试覆盖率达标）已迁入 backlog / 阶段 2，不在本阶段保留未完成条目。

---

## 阶段 2: 安全收口与迁移预备（已完成，2026-11-06 归档）

_目标：在进入两条大迁移前，清掉安全与质量硬债，并完成组件库与 i18n 的低风险预备。_
_2026-11-06：11 条原子条目全部完成并归档，交付摘要见 [已完成工作归档 §8](../archive/completed-work.md)。_

- **M1 安全与合规收口**：CodeQL #20 已按误报 dismiss（2026-11-05）；SSO 历史配置排查完成（2026-11-06，部署实例 0 个 provider），记录见 [SSO 排查记录](../design/governance/2026-11-06-sso-audit.md)。
- **M2 Zod 后端迁移收尾**：14 个参数校验 handlers 已全部使用 Zod（2026-11-05 收口）；测试与 API 文档同步。
- **M3 测试覆盖率第一阶段**：基线已复测（Statements 75.74%），阶段目标按范围设下限（`server/api` ≥95% / `composables` ≥80% / `components/base` ≥75%，全局不退化）；补测后 78.26%（`composables` 84.35%、`components/base` 90.11%）。
- **M4 caomei-ui 迁移预备**：用量快照 + 白名单初值 + 版本锁定 + 回退方案 + 接入基座（P0/P1），双库并存，**不替换页面**；`keyCss` +4.76%、入口 JS 0%。
- **M5 i18n 迁移预备**：`@nuxtjs/i18n@10` 技术验证 + Zod per-parse error map 验证完成，M2 准入有条件通过，**不全量翻译**。

> 交付摘要见 [已完成工作归档 §8](../archive/completed-work.md)；范围、验收、依赖与风险见 [阶段 2 登记记录](../design/governance/2026-11-05-phase2-registration.md)。

---

## 阶段 3: caomei-ui P2–P3 迁移与 i18n 非组件面（已收口 2026-11-09；含 M0 插队）

_目标：启动组件库正式替换（P2 试点 → P3 认证 / 个人 / 安全 / OAuth / SSO），并并行推进不改页面文案的 i18n 前置与服务端能力。_

- **M0 发布链路（插队，2026-11-08 授权）**：提取 `docker-build.yml` 复用工作流；`docker.yml`、`release.yml`、`docker-publish.yml` 改为调用，去 QEMU；验收见 [原生多架构评估](../design/governance/2026-11-08-native-multiarch-docker-review.md)。
- **M1 迁移准备与决策**：用量快照复测、P2 视觉基线、DatePicker range 与 Toast 语气样式裁定。
- **M2 P2 登录页试点**：`/login` 整页切换 + 专用 V2 薄封装；白名单只登记已迁移路由。
- **M3 P3 认证入口**：注册、忘记 / 重置 / 修改密码、快速登录与认证页 Toast / Confirm。
- **M4 P3 个人、安全、OAuth、SSO**：`profile`、`security`、`oauth/consent`、`sso-login`；`oauth/clients` 与 Admin 数据页仍在 P4。
- **M5 i18n 非组件面**：移除 schema 级中文 message、补齐 `validation.*` 键、治理脚本与门禁、服务端错误消息试点。
- **M6 阶段收口**：白名单、包体复测、迁移记录、文档同步、回退验证。

> **收口**：P2–P3 九条认证路由完成，白名单 9 条，视觉 50/50，入口 CSS `+2.87%`；M0-3 定时验证已移至 backlog。交付与回退证据见 [阶段 3 收口记录](../design/governance/2026-11-09-phase3-closure.md)。
> **不做**：P4 Admin 数据页、P5 卸载 PrimeVue、页面文案翻译、邮件与 `User.locale`、SEO 放量、体验与性能项。范围与验收见 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)。


---

## 阶段 4: caomei-ui P4 Admin 与 P5 单库收尾（已完成 2026-11-14）

_目标：完成剩余 Admin 数据页与共享封装迁移，建立 Admin 视觉基线，并卸载 PrimeVue。_

- **M1 P4-0 基座与视觉**：DataTable / Dialog / Select 适配决策；Admin 浅色 / 暗色 token；Admin 视觉参考态与自基线；Admin 夹具。
- **M2–M11 P4 页面迁移**：`admin/users`、`admin/oauth/applications`、`admin/sso/providers`、`admin/logs`、`oauth/clients`、`index`、`error`、`components/base/*` V1；每页按“参考态 → 迁移 → 归因 → 自基线 → 文档 → 单提交”推进。
- **M12 P4 收口**：白名单、包体、视觉、回退、文档。
- **M13–M15 P5 单库收尾**：移除 PrimeVue 依赖 / Provider / 导入 / 构建配置 / 样式 token / 测试 mock / 白名单；最终包体与视觉回归，阶段归档。

> **不做**：i18n 页面文案、邮件、`User.locale`、SEO（阶段 5）；新产品功能；UI 改版；PrimeVue 5.x 升级。范围与验收见 [阶段 4 登记记录](../design/governance/2026-11-10-phase4-registration.md)。

---

## 阶段 5: i18n 全量落地与体验收口（2026-11-16 收口）

_目标：完成 i18n 页面文案、邮件与 `User.locale`、API 错误面与 SEO 放量，建立双语质量门，并收口组件库内建文案与个人中心导航。_

- **M1 基座对齐**：caomei-ui 1.3.0 升级 + `CaomeiConfigProvider` locale 桥接 + 受影响视觉基线重采。
- **M2–M3 基础设施与门禁**：消息模块化与按需加载；扫描盲区修复；`lint:i18n` / `test:i18n`；Admin 校验键直显与 `usePageMeta` / `app.head`。
- **M4–M10 页面文案**：认证入口、SSO 与错误页、个人中心、安全设置、OAuth、首页与静态页、§2.10 导航互联。
- **M11–M14 Admin 文案**：用户、OAuth、SSO、日志四个业务域。
- **M15–M16 服务端**：邮件模板与 `User.locale`；API 错误面与内容协商。
- **M17–M19 治理 / SEO / 收口**：未用键清理与双语视觉回归；sitemap / hreflang 与 `en-US` 升 `seo-ready`；阶段收口与归档。

> **不做**：新增第三语言 / RTL、日志与内部错误翻译、UI 改版、认证流程与权限模型变更、sitemap 之外的新 SEO 平台。范围与验收见 [阶段 5 范围登记](../design/governance/2026-11-14-phase5-registration.md)。
> **检查点**：已随 2026-11-16 收口关闭，未拆分阶段。

---

## 阶段 6: 质量门禁补齐、Admin 错误面与体验性能（已收口 2026-11-17）

_目标：先关闭质量门禁盲区与 Admin 错误面口径，再落时区、注册控制、日志筛选、性能基准与 Demo 数据。_

- **A 批 M1–M8**：`lint:md` 多层目录与历史漂移、i18n 源码 → 语言包反向键校验；Admin 错误读取 helper 与 10 处去重、OAuth 应用接口错误面、Zod error map；Admin 日期本地化、`auth.quick` 命名空间收敛、用户对话框定向单测。
- **M9 检查点**：A 批收口后进入 B 批。
- **B 批 M10–M17**：`User.timezone` 与前端展示、服务端 / 邮件时区；注册控制规则与入口、管理端配置与审计；性能基准与索引、缓存策略与回归阈值；Admin 日志 IP 精确筛选与统计联动；Demo 数据分布增强。
- **M18 收口**：全量门禁、包体 / 视觉 / 覆盖率复核、文档同步与归档。

> **不做**：第三语言 / RTL、UI 改版、认证流程结构变更、Redis 必需化、Admin 日志事件类型维度与热力图（无数据源）、jscpd / stylelint 18 / 视觉矩阵扩展 / DataTable 上游能力等 backlog 项。范围与验收见 [阶段 6 范围登记](../design/governance/2026-11-16-phase6-registration.md)。
> **检查点**：A 批（M9）与阶段收口（M18）均已完成。

---

## 阶段 7: 质量与测试基建（2026-11-17 收口）

_目标：收口工具链与测试基建——stylelint 18、文件规模门禁、平板视觉基线、固定时钟口径、Admin 失败反馈与覆盖率短板。_

- [x] **M1–M2 工具链门禁**：stylelint 18 升级与共享配置解 pin；文件规模检查（600 行阈值 + 基线清单）接入 CI。
- [x] **M3–M4 视觉测试基建**：核心页 768×1024 基线；对话框内 Select 交互 helper 与固定时钟约束口径。
- [x] **M5 错误面**：Admin 对话框 better-auth 调用失败显式反馈与本地化兜底。
- [x] **M6–M7 指标与收口**：jscpd 达标口径、`pages` / `plugins` 覆盖率补测；阶段收口与归档。

> **不做**：历史大文件拆分、业务新功能、视觉阈值调整、DataTable 依赖行为修改。范围与验收见 [阶段 7 范围登记](../design/governance/2026-11-17-phase7-registration.md)。

---

## 阶段 9: 账号找回与 2FA 边界治理（阶段 0–1 + 管理员协助恢复，2026-11-20 收口）

_目标：先修「看起来有、实际没有」的恢复通道与审计，再给管理员一条只能发起、必须用户确认、确认后强制重置密码的协助路径；不触碰 2FA 与备份码。_

- **M1–M3 基座**：结构化审计、恢复路径失败用例、`security.md` 2FA 边界与恢复等级（L0 / L1 / L2）。
- **M4–M7 假通道**：短信重置、备份码再生成、2FA 邮件 OTP 回落与提示、改绑 / 撤销会话错误检查。
- **M8–M12 管理员协助恢复**：改绑请求实体与验证码、管理员发起、用户确认、强制重置、2FA / 备份码不变断言。
- **M13 收口**：全量门禁、视觉回归、迁移说明、归档。

> **不做**：恢复码 / 冷静期（阶段 2）、2FA 覆盖收紧（阶段 3）、管理员重置 2FA / 备份码（D4）、管理员代设密码（D8）、短信供应商引入、审批工单。范围与验收见 [阶段 9 范围登记](../design/governance/2026-11-19-phase9-registration.md)，交付结果见 [收口记录](../design/governance/2026-11-20-phase9-closure.md)（测试 1225、覆盖率 78.53% / 78.80%、视觉 136）。

---

## 阶段 8: 国际化 5 语推广（10 语架构，2026-11-19 收口）

_目标：语言架构扩到 10 码并启用 zh-CN / en-US / zh-TW / ja-JP / ko-KR；新语言 ui-ready（可切换、不索引），保留母语审校与后续 5 语扩展。_

- **M1A–M2 基建**：Registry 10 码 + 启用开关；治理脚本适配启用集；caomei-ui `registerLocale` 桥接、切换器与协商。
- **M3–M5 zh-TW**：微信 / 核心 / Admin 三批语言包，转换 + 台湾术语校订。
- **M6–M8 ja-JP**：核心 / 业务 / Admin 三批语言包，机器翻译 draft。
- **M9–M11 ko-KR**：核心 / 业务 / Admin 三批语言包，机器翻译 draft。
- **M12 收口**：新语言视觉基线、SEO noindex 断言、文档、台账与归档。

> **不做**：es-ES / fr-FR / de-DE / ru-RU / pt-BR 内容启用、母语者终审与 `seo-ready` 升级、RTL、用户生成内容与 Demo 种子数据翻译。范围与验收见 [阶段 8 范围登记](../design/governance/2026-11-17-phase8-registration.md)，交付结果见 [收口记录](../design/governance/2026-11-19-phase8-closure.md)（5 语 × 1510 键、测试 1154、视觉 136）。

---

## 阶段 10: 用户侧替代证明（恢复码 / 已验证手机 / 冷静期）（2026-11-21 收口）

_目标：旧邮箱失效但持有恢复因子的用户可自助换邮箱；换绑经冷静期可撤销，生效后旧邮箱立即失效；OAuth-only 用户可受控自助设置密码进入自助恢复（L0 扩展）。_

> 已完成（M1–M5 全部交付）。里程碑详情、提交清单与未覆盖边界见 [roadmap-phases-10](./archive/roadmap-phases-10.md)，阶段正文见 [todo-archive-phases-10](./archive/todo-archive-phases-10.md)，范围与决策见 [阶段 10 范围登记](../design/governance/2026-11-21-phase10-registration.md)。后续候选见 [backlog §2.12](./backlog.md)。

## 阶段 11: 2FA 覆盖收紧与登录通道闭环（2026-11-21 收口）

> 5 大条目 / 15 小条目；邮箱 / 手机 OTP、邮箱验证码 / 链接、魔法链接、社交与 SSO 登录已接入第二因子挑战，登录页完成挑战接线，新增 6 张视觉基线。里程碑详情、提交清单与未覆盖边界见 [roadmap-phases-11](./archive/roadmap-phases-11.md)，阶段正文见 [todo-archive-phases-11](./archive/todo-archive-phases-11.md)，范围与决策见 [阶段 11 范围登记](../design/governance/2026-11-21-phase11-registration.md)，收口记录见 [2026-11-21-phase11-closure](../design/governance/2026-11-21-phase11-closure.md)。OAuth 授权链 state 回跳与会话撤销脚本已迁入 backlog。

## 阶段 12: 安全可观测性与会话治理（2026-11-23 收口）

_目标：建立可查询的登录事件数据源与时间 × 事件类型热力图，补齐管理端事件视图；提供可信设备列表 / 吊销与按用户批量撤销会话，并补多方言撤销脚本。_

- **M1 登录事件基座**：`LoginEvent` 实体与索引、生命周期写入、保留期与清理、事件契约。
- **M2 Admin 事件查询**：查询 / 统计 API、`/admin/logs` 事件视图与 5 语文案。
- **M3 热力图**：时间桶 × 事件类型聚合、组件与 6 张视觉基线。
- **M4 可信设备与会话治理**：`TrustedDevice` 采集、用户安全页、管理端吊销与多方言撤销脚本。
- **M5 隐私、门禁与收口**：权限 / 保留期口径、全量门禁、归档。

> 5 大条目 / 15 小条目；范围、决策 D18–D25 见 [阶段 12 范围登记](../design/governance/2026-11-21-phase12-registration.md)，交付与未覆盖边界见 [roadmap-phases-12](./archive/roadmap-phases-12.md)、[阶段正文](./archive/todo-archive-phases-12.md) 与 [收口记录](../design/governance/2026-11-23-phase12-closure.md)。

## 阶段 13: 可观测性规模化与运维闭环（2026-11-23 收口）

_目标：把阶段 12 的登录事件推进到可持续运行——索引、数据库侧聚合、多方言清理、发布门禁收敛与回归基座补齐。_

- **M1 登录事件 IP 索引**：`varchar(45)` 列类型、`(ip, created_at)` 索引与筛选口径（已闭环）。
- **M2 统计与热力图方言聚合**：`dailyTrend` 与热力图改为方言 SQL 聚合，响应与时区不变（已闭环）。
- **M3 运维脚本与发布门禁**：多方言清理脚本、`docker-publish` 重建门禁、3 条 medium 依赖收敛（已闭环）。
- **M4 回归基线补充**：1440 热力图基线与可信设备非空态基线（已闭环）。
- **M5 文档与阶段收口**：口径同步、全量门禁、归档（已闭环）。

> 5 大条目 / 13 小条目全部交付；里程碑与未覆盖边界见 [roadmap-phases-13](./archive/roadmap-phases-13.md)，阶段正文见 [todo-archive-phases-13](./archive/todo-archive-phases-13.md)，收口记录见 [2026-11-23-phase13-closure](../design/governance/2026-11-23-phase13-closure.md)。

## 阶段 14: 国际化门禁与前端健壮性（2026-11-26 收口）

_目标：把 i18n 从「5 语可用」推进到「未启用语言也有门禁」，并收敛前端错误处理、类型逃逸、样式门禁与两处布局缺陷。_

- **M1 i18n 门禁与产物**：未启用语言同构门禁、语言包产物过滤。
- **M2 台账与多语言链接**：译文台账消费方、内部链接 `localePath`。
- **M3 i18n 视觉回归**：ja / ko 窄屏基线与长语言窄容器用例。
- **M4 前端健壮性与样式门禁**：非 Admin 失败处理、Admin 类型收紧、stylelint 覆盖 `styles/`。
- **M5 Admin 日志页 1440 布局**：容器内滚动 / 宽度收敛与无溢出断言。
- **M6 移动端安全页会话表**：卡片式会话项与移动端基线。
- **M7 文档与阶段收口**：口径同步、全量门禁、归档。
- **M8 验证码可选配置修复（插队，2026-11-25 授权并闭环）**：4 条流程按启用状态放宽 captcha 解析。

> 8 大条目 / 16 小条目全部交付；里程碑与未覆盖边界见 [roadmap-phases-14](./archive/roadmap-phases-14.md)，阶段正文见 [todo-archive-phases-14](./archive/todo-archive-phases-14.md)，范围与决策 D33–D44 见 [阶段 14 范围登记](../design/governance/2026-11-24-phase14-registration.md)，收口记录见 [2026-11-26-phase14-closure](../design/governance/2026-11-26-phase14-closure.md)。

## 阶段 15: 认证移动端可用性（2026-11-26 登记并开工）

_目标：让 5 语言认证首屏在 390 / 360 下可用，消除固定悬浮控件遮挡，收敛个人中心与 Admin 移动端基础体验，并补齐 OAuth 入口语言与跨语言卡片基线。_

- **M1 窄屏首屏可用性**：登录页 Tab 自适应、验证码行换行、SSO 顶部安全区。
- **M2 悬浮控件与遮挡**：认证页安全区、遮挡相交断言。
- **M3 个人中心与 Admin 基础**：操作行换行、侧栏默认收起、输入字号 ≥16px（不做表格卡片化）。
- **M4 语言与跨语言基线**：OAuth 入口按 cookie 补前缀、会话卡片跨语言基线。
- **M5 视觉矩阵与阶段收口**：5 语言 390 / 360 轻量矩阵、文档与归档。

> 5 大条目 / 12 小条目；范围、决策 D45–D51 与不做边界见 [阶段 15 范围登记](../design/governance/2026-11-26-phase15-registration.md)，条目明细见 [todo.md](./todo.md)。

## 后续方向（未授权）

以下方向不属于当前阶段，作为中长期方向保留；候选详情与触发条件见 [backlog.md](./backlog.md)。未授权方向不构成启动授权。

### 开发者生态与集成优化

- 轻量化 Web / Node.js SDK。
- 文档中心自动化、API Playground。
- 插件 / 钩子系统。
- 飞书、企业微信、钉钉等国内办公场景社交登录。

> 候选详情见 [backlog §2.7](./backlog.md#27-开发者生态长期方向)。

### 安全增强与智能化管理

- 风险管控体系（地理位置 / 设备指纹）。
- 安全告警系统（异地登录、高频失败、异常 IP）。
- 高级审计日志（CSV / JSON 导出，SOC2 / ISO27001）。

> 候选详情见 [backlog §2.8](./backlog.md#28-安全增强长期方向)。

### 企业级特性与 SaaS

- 多租户 SaaS。
- 组织 / 部门管理、权限委派。
- LDAP / AD 集成。

> 候选详情见 [backlog §2.9](./backlog.md#29-企业级特性长期方向)。

### 移动端与认证可用性

- 认证移动端首屏、悬浮控件遮挡、OAuth 入口语言与个人中心操作行已上收阶段 15；剩余候选（Admin 数据表卡片化、`/sso-login` 暗色主题、OAuth web http 回环）见 backlog。

> 候选详情见 [backlog §3.5](./backlog.md#35-移动端与认证可用性)，阶段 15 范围见 [阶段 15 范围登记](../design/governance/2026-11-26-phase15-registration.md)。

---

## 跨阶段候选方向（未授权）

- **Admin 登录事件与热力图**：事件类型数据源（登录事件日志）与热力图保留候选，见 [backlog §2.4](./backlog.md#24-admin-日志登录事件与热力图)。

---

## 里程碑时间线

```text
阶段 1（主体完成，暂停）
        │
        ▼
阶段 2（已完成 2026-11-06）：安全收口 + 迁移预备
        │  M1 安全 → M2 Zod → M3 覆盖率 → M4 caomei-ui 预备 → M5 i18n 预备
        ▼
阶段 3（已收口 2026-11-09）：caomei-ui P2–P3 + i18n 非组件面（+ M0 发布链路插队）
        │  M0 原生多架构 → M1 准备 → M2 登录页 → M3 认证入口 → M4 个人/安全/OAuth/SSO → M5 i18n 前置 → M6 收口
        ▼
阶段 4（已完成 2026-11-14）：caomei-ui P4 Admin 与 P5 单库收尾
        │  P4 基座 → Admin 页面 → P4 收口 → P5 卸载 PrimeVue
        ▼
阶段 5（已收口 2026-11-16）：i18n 全量落地与体验收口
        │  基座 1.3.0 → 模块化 / 门禁 → 页面文案 → Admin → 邮件 / API → SEO → 收口
        ▼
阶段 6（已收口 2026-11-17）：质量门禁 + Admin 错误面（A 批）→ 体验与性能（B 批）
        │  A：门禁 / 错误面 / 展示口径 → M9 检查点 → B：时区 / 注册控制 / 性能 / 筛选 / Demo → M18 收口
        ▼
阶段 7（2026-11-17 收口）：质量与测试基建
        │  stylelint 18 / 文件规模门禁 → 平板基线 / 固定时钟口径 → Admin 失败反馈 → 覆盖率 → 收口
        ▼
阶段 8（已收口 2026-11-19）：国际化 5 语推广（10 语架构）
        │  Registry 10 码 → caomei 桥接 → zh-TW / ja-JP / ko-KR 语言包 → 视觉与收口
        ▼
阶段 9（已收口 2026-11-20）：账号找回与 2FA 边界治理（阶段 0–1 + 管理员协助恢复）
        │  审计与失败用例 → 假通道修复 → 管理员协助恢复（改绑→确认→强制重置）→ 收口
        ▼
阶段 10（已收口 2026-11-21）：用户侧替代证明（恢复码 / 已验证手机 / 冷静期）
        │  恢复码基座 → 替代证明与改邮箱 → 冷静期与生效 → 自助设密码 → 界面与收口
        ▼
阶段 11（已收口 2026-11-21）：2FA 覆盖收紧与登录通道闭环
        │  通道矩阵与挑战基座 → OTP / 验证码 / 链接自动登录 / 魔法链接 → 社交 / SSO（含共享回调）→ 恢复与审计边界 → 界面与收口
        ▼
阶段 12（已收口 2026-11-23）：安全可观测性与会话治理
        │  登录事件基座 → Admin 事件查询 / 统计 → 热力图 → 可信设备与会话治理 → 隐私 / 门禁 / 收口
        ▼
阶段 13（已收口 2026-11-23）：可观测性规模化与运维闭环
        │  IP 索引 → 方言聚合 → 多方言清理 / 发布门禁 / 依赖收敛 → 回归基线 → 收口
        ▼
阶段 14（2026-11-26 收口）：国际化门禁与前端健壮性
        │  i18n 门禁 / 产物过滤 → 台账与链接 → 窄屏视觉 → 前端健壮性 → 两处布局 → 验证码可选 → 收口
        ▼
阶段 15（2026-11-26 登记并开工）：认证移动端可用性
        │  窄屏首屏 → 悬浮遮挡 → 个人中心 / Admin 基础 → OAuth 语言 → 视觉矩阵与收口
        ▼
后续方向（未授权）：审计检索 / 安全增强 / 开发者生态 / 企业级
        │
        └─ 候选详情：backlog.md
```

---

> 路线图会根据项目进展和社区反馈定期更新（建议每季度回顾一次）。阶段登记与归档规则以 [规划规范](../standards/planning.md) 为准。
