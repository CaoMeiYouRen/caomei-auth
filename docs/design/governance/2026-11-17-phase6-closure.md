# 2026-11-17 阶段 6 收口记录：质量门禁补齐、Admin 错误面与体验性能

> **状态**：M1–M18 全部交付，2026-11-17 收口。
> **范围与验收**：[阶段 6 范围登记](./2026-11-16-phase6-registration.md)。
> **前置**：[阶段 5 收口记录](./2026-11-16-phase5-closure.md)。

## 1. 交付清单

| 条目 | 交付 | 状态 |
| :--- | :--- | :--- |
| M1 | `lint:md` 多层目录门禁 + 历史漂移修正；`lint:md:check` 接入 test / 周回归 | 完成（2026-11-16） |
| M2 | i18n 源码 → 语言包反向键校验（t/$t/te/$te/模板字符串/keypath/usePageMeta，白名单文件化） | 完成 |
| M3 | `getApiErrorMessage` 统一错误读取；10 处 `errorMessage` 去重 | 完成 |
| M4 | OAuth 应用接口失败改 4xx/5xx + 本地化；失败日志改名 | 完成 |
| M5 | Admin 校验统一 Zod error map（写入 + 查询 + 参数入口） | 完成 |
| M6 | `useLocaleDate`（full/short）+ 8 个调用点 + 9 张基线重采 | 完成 |
| M7 | `auth.quick` 合并进 `auth.quickLogin`（30 键） | 完成 |
| M8 | Admin 用户对话框定向单测（封禁时长 / 自操作保护 / 撤销会话） | 完成 |
| M9 | A 批检查点：全量门禁通过（2026-11-16） | 完成 |
| M10 | `User.timezone` + 个人中心时区选择 + `useUserTimezone`（用户 > 浏览器 > UTC） | 完成 |
| M11 | 服务端 / 邮件时区：`getUserTimeZoneByEmail`，OTP 到期时间按收件人时区 | 完成 |
| M12 | 注册控制规则（邮箱域名 / 手机号国家码）与 create/update 钩子校验 | 完成 |
| M13 | 管理端 `/admin/registration` 与 CRUD API、审计日志、Demo 守卫 | 完成 |
| M14 | 会话热点查询基准脚本 + `createdAt/expiresAt` 索引 | 完成 |
| M15 | 缓存边界说明（lru-cache / Redis 可选）+ `perf:check` 绝对阈值 | 完成 |
| M16 | Admin 日志 IP 精确筛选 + 统计联动 + 文档纠偏 | 完成 |
| M17 | Demo 会话 seed / 峰谷 / 长尾分布 | 完成 |
| M18 | 阶段收口与归档 | 完成 |

## 2. 终态指标

| 指标 | 收口值 |
| :--- | :--- |
| 测试 | **1090 passed / 148 files** |
| 覆盖率 | Statements **76.07%** / Branches 59.73% / Functions 67.17% / Lines **76.36%** |
| 视觉基线 | **110 passed**（重采后 verify 通过） |
| 包体 | 总 JS / CSS **2,302,231 B / 1,499,989 B**；`migration:check-budget` 通过 |
| 重复代码 | jscpd 3.71%（4,883 / 131,762 行） |
| 质量门 | `lint` 0 error（26 warnings）、`lint:css`、`typecheck`、`build`、`i18n:check`、`ai:check`、`migration:check-imports`、`lint:md:check` 全绿 |
| 性能基准 | 50k 行会话：token p95 < 0.01 ms、userId / 时间范围 p95 < 0.1 ms，无全表扫描 |

## 3. 阶段级变更

- **质量门禁**：markdown 三级 / 四级目录纳入门禁；i18n 增加反向键校验；CI 使用无 `--fix` 的 `lint:md:check`。
- **错误面**：Admin 统一 `getApiErrorMessage`；OAuth 应用接口改为 HTTP 语义状态码；所有 admin 校验入口挂 Zod error map。
- **展示口径**：Admin 日期统一 `useLocaleDate`（表格短格式、详情含秒）；快速登录命名空间收敛；时区偏好贯通页面展示与邮件。
- **体验功能**：注册控制（域名 / 国家码白黑名单、管理端 CRUD、审计日志、Demo 守卫）；Admin 日志 IP 精确筛选与统计联动；Demo 数据可复现分布。
- **性能与治理**：会话查询基准与索引、绝对阈值脚本、缓存选型说明。

## 4. 与范围登记的偏差（均已登记理由）

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| M10 三方言实跑 | `create.sql` 各实跑一次 | SQLite 内存实跑；MySQL / PostgreSQL 脚本语法核对 | 本地与 CI 无 MySQL / PostgreSQL 实例；部署由 `docs/deployment/database.md` 的 ALTER 兜底 |
| M12 邀请入口 | 覆盖邀请 | 项目无邀请端点（N/A）；覆盖注册、手机号、第三方首登、改邮箱 / 改手机号 | 仓库不存在邀请流程 |
| M16 事件类型 | 按事件类型筛选 | 不纳入（无登录事件数据源），转 backlog §2.4 | 仅有 Session 实体，事件类型需新数据源 |

## 5. 遗留与已知边界

- **多实例注册规则缓存**：规则缓存 30 秒 TTL，多实例部署下最坏 30 秒内仍按旧规则；单实例 / 常规部署可接受，Redis 共享缓存列入 backlog。
- **注册规则值格式**：仅做长度与枚举校验（域名格式、`+digits` 未强校验）；错配会静默放行或全拒，管理端已有提示文案。
- **审计记录**：注册规则变更写 winston 业务日志（操作者、前后值），未落库；如需合规导出另立条目。
- **手机号注册端到端**：钩子覆盖 create/update，已用邮箱路径手工验证；手机号 OTP 端到端需真实短信通道，未在本地验证。
- **时区展示**：SSR 首帧固定 UTC，挂载后切换到用户 / 浏览器时区，预渲染内容可能与最终值不同（无水合报错）。
- **既有 backlog 保留**：jscpd 重复率、stylelint 18、视觉矩阵中间宽度、视觉阈值 token 断言、DataTable 上游能力、固定时钟用例改造、`docker-publish` 重建 gate、`braces` 升级、Admin 日志热力图 / 事件源等。

## 6. 验证命令

```bash
pnpm lint && pnpm lint:css && pnpm ai:check && pnpm migration:check-imports && \
pnpm i18n:check && pnpm typecheck && pnpm build && pnpm migration:check-budget && \
pnpm test && pnpm test:coverage && pnpm lint:duplicate && pnpm lint:md:check
pnpm test:visual
pnpm perf:check
```
