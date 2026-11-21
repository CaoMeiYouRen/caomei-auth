# 项目设计 (Design)

本文档概括了草梅 Auth 的核心设计理念，是系统架构、接口、数据库及 UI 设计的入口。

## 核心设计

### 1. [架构设计](./architecture.md)

详细描述了系统的分层架构、模块解耦逻辑（G1 重构）及核心流程控制。

### 2. [数据库设计](./database.md)

详细介绍了数据库实体关系图 (ERD)、表结构定义及关键业务字段说明。

### 3. [接口设计 (API)](../api/)

系统对外提供的 RESTful API 规范、认证请求流程及错误码定义。

### 4. [UI/UX 设计](./ui-ux.md)

包含项目的视觉规范、主题色方案、响应式适配策略及核心组件设计细节。

### 5. [特殊模式设计](./demo-mode.md)

有关演示模式 (Demo Mode) 的实现方案，包括数据拦截与仿真逻辑。

### 6. [治理与规划 (Governance)](./governance)

AI 基建、依赖治理、架构演进等决策与规划文档。

-   [账号找回与 2FA 边界设计草案](./governance/2026-11-18-account-recovery-design.md): 现状取证、威胁模型、恢复等级、分阶段路线与待定决策（2026-11-18 草案；阶段 0–1 随阶段 9、阶段 3 随阶段 10 交付，阶段 4 已随阶段 11 交付，阶段 2 剩余（审批流 / 工单）与阶段 5 仍为候选）。
-   [主流平台账号找回与改邮箱机制调研](./governance/2026-11-18-account-recovery-research.md): Google / Microsoft / Apple / GitHub / Supabase / Auth0 / Okta / Cognito / Keycloak / Firebase 与 NIST / OWASP 的公开口径（2026-11-18 快照）。
-   [AI 基建优化规划](./governance/ai-infrastructure-optimization.md): Skills / Agents / 项目规范 / i18n 规划的评估与分批复核清单。
-   [PrimeVue → caomei-ui 迁移评估](./governance/2026-11-05-caomei-ui-migration-evaluation.md): 组件库迁移的现状盘点、逐组件映射、主题 / 测试耦合、分阶段计划与风险。
-   [caomei-ui 1.2.0 复核记录](./governance/2026-11-08-caomei-ui-1.2.0-revaluation.md): 1.1.0 / 1.2.0 能力变化、导出面差分、对 DatePicker / Toast / Form / DataTable 口径的修订与升级验证。
-   [阶段 5 M1：caomei-ui 1.3.0 升级与 locale 桥接](./governance/2026-11-15-m1-caomei-ui-1.3.0.md): 1.3.0 依赖与 lockfile 归因、`CaomeiConfigProvider` 接线、视觉差异归因与自基线重采、内建文案双语抽检。
-   [阶段 5 M2：消息模块化与按需加载](./governance/2026-11-15-m2-locale-modules.md): 17 模块注册表、core / 懒加载边界、路由中间件、端到端按需加载验证与包体归因。
-   [阶段 5 M3：治理门禁与既有缺陷](./governance/2026-11-15-m3-governance-gates.md): `<script setup>` 扫描与基线构成、`lint:i18n` / `test:i18n` 接入、Admin 校验键直显修复、`usePageMeta` / `app.head` 去硬编码。
-   [阶段 5 M4：认证入口文案](./governance/2026-11-15-m4-auth-text.md): M4-1 组合式函数与共享组件、M4-2 五个认证页面与收尾清理；`useI18nText` / `usePasswordHints`、单测语言包替身、旧密码工具下线与视觉重采归因。
-   [阶段 5 M5：SSO 登录与错误页](./governance/2026-11-15-m5-sso-error-reset.md): 邮件链接重置通道下线的决策与清理、`sso-login` 页面 / flow 双语、错误页状态码文案与 `error.vue` 纳入扫描根。
-   [阶段 5 M6：个人中心文案](./governance/2026-11-15-m6-profile-text.md): `profile` 模块 116 键、页面 / 6 个组件 / 3 个对话框 / flow 全量双语，隐私模式与头像上传文案收口。
-   [阶段 5 M7：安全设置文案](./governance/2026-11-15-m7-security-text.md): `security` 模块 71 键、2FA 面板与会话表全量双语，会话日期列改按 locale 格式化。
-   [阶段 5 M8：OAuth 与授权应用文案](./governance/2026-11-15-m8-oauth-text.md): `oauth` 模块 96 键、同意页与授权列表双语，两套 scope 文案与法律提示句用 `<i18n-t>` 收口。
-   [阶段 5 M9：首页、静态页与共享壳文案](./governance/2026-11-15-m9-static-text.md): 新增 `static` 模块（141 键，路由懒加载）、页脚 / 反馈 / Demo 横幅入 core，隐私与条款的内嵌链接句统一走 `<i18n-t>`。
-   [阶段 5 M10：个人中心 ↔ 授权应用 / 安全设置互联](./governance/2026-11-15-m10-cross-links.md): 三页头部入口与返回路径打通，移动端按钮组换行，回归基线同步。
-   [阶段 5 M11：Admin 用户域文案](./governance/2026-11-15-m11-admin-users-text.md): `admin-users` 190 键、用户页与 4 个对话框双语，`common.status.*` 统一状态 / 角色标签。
-   [阶段 5 M12：Admin OAuth 域文案](./governance/2026-11-15-m12-admin-oauth-text.md): `admin-oauth` 113 键、应用页与创建 / 凭据 / API 文档三个对话框双语。
-   [阶段 5 M13：Admin SSO 域文案](./governance/2026-11-15-m13-admin-sso-text.md): `admin-sso` 142 键、提供商页与创建 / 详情对话框、OIDC / SAML / 属性映射三段表单双语。
-   [阶段 5 M14：Admin 日志域文案](./governance/2026-11-15-m14-admin-logs-text.md): `admin-logs` 51 键、统计概览 / 时间段 / 登录方式 / 趋势图 / 日志表双语，图表随语言重绘。
-   [阶段 5 M15：邮件模板与用户语言偏好](./governance/2026-11-16-m15-email-locale.md): `email` 58 键、`User.locale` 持久化、7 个邮件方法与模板双语、生产库 ALTER 说明。
-   [阶段 5 M16：API 错误面与内容协商](./governance/2026-11-16-m16-api-errors.md): 全部 `/api/**` 返回 `Content-Language` / `Vary`，管理端 / 上传 / 社交登录文案按请求语言输出，新增静态守卫。
-   [阶段 5 M17：治理清理与双语回归](./governance/2026-11-16-m17-governance-cleanup.md): 未使用键清零、Admin 壳层与主题切换双语、核心页 6 张 `en-US` 视觉基线、allowlist 收紧到 132 行 / 24 文件。
-   [阶段 5 M18：SEO 与 `en-US` 升 `seo-ready`](./governance/2026-11-16-m18-seo.md): sitemap / robots / hreflang / `og:locale` / 私有页 `noindex`，`en-US` 放开索引。
-   [阶段 5 收口记录](./governance/2026-11-16-phase5-closure.md): M1–M19 全部交付、终态指标、与范围登记的偏差、遗留与验证命令。
-   [阶段 7 收口记录](./governance/2026-11-17-phase7-closure.md): M1–M7 全部交付、终态指标（测试 1137 / 视觉 123 / pages 77.46%）、偏差与候选回填。
-   [阶段 8 范围登记：国际化 5 语推广（10 语架构）](./governance/2026-11-17-phase8-registration.md): 10 语 Registry、5 语启用、zh-TW / ja / ko 三批语言包、ui-ready 与审校边界（2026-11-17 授权）。
-   [阶段 9 范围登记：账号找回与 2FA 边界治理](./governance/2026-11-19-phase9-registration.md): 审计通道、假通道修复、管理员协助恢复（D8 / D9）与验证矩阵（2026-11-19 授权）。
-   [阶段 9 收口记录](./governance/2026-11-20-phase9-closure.md): M1–M13 交付、测试 1225 / 视觉 136、偏差与遗留（2026-11-20 收口）。
-   [阶段 10 范围登记：用户侧替代证明](./governance/2026-11-21-phase10-registration.md): 恢复码、替代证明改邮箱、冷静期与撤销、OAuth-only 自助设密码（2026-11-21 登记）。
-   [阶段 10 收口记录](./governance/2026-11-21-phase10-closure.md): M1–M5 交付、测试 1325 / 视觉 138、与范围登记的偏差与遗留（2026-11-21 收口）。
-   [阶段 11 范围登记：2FA 覆盖收紧与登录通道闭环](./governance/2026-11-21-phase11-registration.md): 5 大条目 / 15 小条目、逐通道覆盖矩阵、上游挑战复用、D11–D17 决策（2026-11-21 登记 → 收口）。
-   [阶段 11 收口记录](./governance/2026-11-21-phase11-closure.md): M1–M5 交付、测试 1370 / 视觉 144、偏差与遗留（2026-11-21 收口）。
-   [阶段 12 范围登记：安全可观测性与会话治理](./governance/2026-11-21-phase12-registration.md): 登录事件 / 热力图 / 可信设备 / 会话撤销，D18–D25 拟定决策（2026-11-21 登记，尚未开工）。
-   [2FA 覆盖矩阵](./two-factor-coverage.md): 通道 / 端点 / 响应形态 / 开关 / 测试状态与实现约束（阶段 11 收口，长期口径）。
-   [发布链路原生多架构评估](./governance/2026-11-08-native-multiarch-docker-review.md): issue #718 的入口核验、方案比较与方案 C 复用工作流落地（已排期阶段 3 插队，待工作流验证）。
-   [i18n 评估与实施方案](./governance/2026-11-05-i18n-evaluation.md): 原 i18n 规划的复核修订、Locale Registry、模块化消息、Zod v4 错误本地化、服务端 / 邮件方案与批次。
-   [阶段 2 范围登记：安全收口与迁移预备](./governance/2026-11-05-phase2-registration.md): 阶段 2 的 5 条主线 / 11 条原子条目、验收与边界（2026-11-06 完成归档）。
-   [阶段 3 范围登记：caomei-ui P2–P3 迁移与 i18n 非组件面](./governance/2026-11-06-phase3-registration.md): 阶段 3 的 6 条主线 / 16 条原子条目 + M0 发布链路插队 4 条、两项决策裁定、验收与边界（2026-11-06 授权启动；2026-11-08 插队 M0）。
-   [CodeQL #20 复核记录](./governance/2026-11-05-codeql-20-review.md): `js/insufficient-password-hash` 误报判定依据、dismiss 处置与慢哈希迁移取舍。
-   [覆盖率基线复测与目标校准](./governance/2026-11-05-coverage-baseline.md): 2026-11-05 复测数据、按范围设下限的阶段目标与定向补测优先级。
-   [caomei-ui 迁移 P0 基线与护栏](./governance/2026-11-05-caomei-ui-p0-baseline.md): 用量快照脚本、路由白名单初值、`1.2.0` 精确锁定（2026-11-08 升级）与回退方案。
-   [caomei-ui P2 视觉基线方案](./governance/2026-11-05-caomei-ui-p2-visual-baseline-plan.md): 截图矩阵、已知预期差异与差异登记放行规则（口径已由「视觉参考态基座」替代）。
-   [视觉参考态基座](./governance/2026-11-08-visual-baseline-harness.md): 迁移前参考态 + 当前自基线两层快照、固定环境、采集 / 比对命令与差异处置纪律。
-   [阶段 4 范围登记：P4 Admin 与 P5 单库收尾](./governance/2026-11-10-phase4-registration.md): 阶段 4 的 2 条主线 / 15 条原子条目、验收、回退与视觉策略。
-   [P4-0 Admin 迁移基座决策](./governance/2026-11-10-p4-0-decisions.md): DataTable / Dialog / DatePicker 映射、Admin 暗色 token 契约、PrimeVue 暗色选择器修复、Admin 视觉矩阵与 P4-1 任务单。
-   [P4-0 Admin 迁移基座技术方案](./governance/2026-11-10-p4-admin-migration-plan.md): P4 开工前的风险验证项、执行顺序与交付物。
-   [i18n 技术验证记录](./governance/2026-11-05-i18n-verification.md): `@nuxtjs/i18n@10` 接入验证、Zod per-parse map 结果与 M2 准入结论。
-   [阶段 2 UI 视觉审查](./governance/2026-11-05-ui-visual-review.md): 语言切换、暗色主题、社交按钮与 caomei-ui 基座的视觉回归结论。
-   [SSO 历史配置排查记录](./governance/2026-11-06-sso-audit.md): 部署实例 provider 数量、可疑项判定与 M1-2 完成结论。
