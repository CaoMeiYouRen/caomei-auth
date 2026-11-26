# 2026-11-27 阶段 15 收口记录：认证移动端可用性

> 范围与决策见 [阶段 15 范围登记](./2026-11-26-phase15-registration.md)；阶段正文见 [todo-archive-phases-15](../../plan/archive/todo-archive-phases-15.md)，里程碑见 [roadmap-phases-15](../../plan/archive/roadmap-phases-15.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 窄屏首屏可用性 | 登录方式 Tab ≤768 改 3 列自适应，按钮高度自适应并允许断行；验证码行输入 `flex: 1 1 0 + min-width: 0`、按钮不压缩（含 2FA 自建行）；SSO 标题让出顶部 4rem 安全区 | `7494ed1`、`9d2acd7`、`ea014c6` |
| M2 悬浮控件与遮挡 | 认证页右侧 4–5rem 安全廊道（内容右缘恒早于固定按钮，任意滚动位置相交为 0）；5 语言 × 390 / 360 / 768 首屏几何断言与 theme / feedback 存在性兜底 | `ea4a738`、`b52afcf` |
| M3 个人中心与 Admin 基础 | 操作行 ≤768 允许换行；Admin 侧栏移动端默认收起（桌面与手动展开不受影响）；主区表单控件 ≤768 字号 16px，表格保持容器内横向滚动 | `4af44da`、`e0c63cf`、`c795f39` |
| M4 语言与跨语言基线 | OAuth 授权入口按 `i18n_locale` 补前缀并保留 query（服务端 302、registry 归一化、`no-store` + `Vary`）；会话卡片补 en-US / ja / ko / zh-TW 390 元素基线 | `288bb3c`、`4450b8b` |
| M5 视觉矩阵与阶段收口 | 5 语言 × 360 × login / register / forgot-password / sso-login 共 20 张整页矩阵（掩码 + ui-ready noindex）；ja 社交按钮文案恢复换行；文档与归档 | `c361c59`、收口提交 |

## 2. 终态指标

- 测试：**1572** 用例通过（新增 7 条 OAuth 入口单测）；覆盖率 Statements 78.86% / Branch 65.88% / Functions 72.62% / Lines 79.06%。
- 视觉：**320** 个用例通过，自基线 PNG **189** 张（新增 26 张：矩阵 20、会话卡片 4、2 张改名）。
- 重复代码 3.76%（阈值 5%）；入口 CSS 405,555 B（+1.46%，上限 +10%）；`build` 通过；`docs:build` 通过。
- i18n：`i18n:check` 29 条用例通过；`ai:check` / `planning:check` / `quality:file-size` / `migration:check-imports` 通过。
- 安全：`security:alerts` 通过（1 个已豁免 high，豁免未过期）。
- 提交：10 个条目提交（M1 3 / M2 2 / M3 3 / M4 2 / M5 2 中的 1 个实现提交）+ 阶段收口提交；`artifacts/review-gate/2026-11-27-phase15-m1-m3.md` 为本地审查汇总（`artifacts/` 不入库）。

## 3. Review Gate 轮次

- M1.1 R1 Reject → R2 Pass（R1：遗漏 2FA 挑战基线、缺全量视觉反向校验）；M1.2 R1 Pass（补 2FA 断言与换手机号口径）；M1.3 R1 Pass。
- M2.1 / M2.2 R1 Reject → R2 Pass（R1：底部 padding 未消除首屏遮挡、反馈按钮无证据；改为右侧廊道 + 文档盒兜底）。
- M3.1 / M3.2 / M3.3 R1 Pass（M3.3 补筛选 Select 字号断言；收起态 aria-label 与首帧展开登记 backlog）。
- M4.1 R1 Pass（deep：补 `no-store` / `Vary`、语言归一化、外部 host / 协议相对 URL / 双重编码用例）；M4.2 R1 Reject → R2 Pass（补 en-US / zh-TW 基线、按语言断言字段名）。
- M5.1 R1 Reject → R2 Pass（视觉环境限流导致页面缺社交按钮、掩码与 noindex 口径、基线命名统一）。

## 4. 偏差

- 计划 commits 12–15 / files 32–45 / 行 900–1,500；实际 10 个条目提交（M2 合并实现与断言为 2 次，M4.1 的视觉断言先行提交于 M3.3 提交内并在 M4.1 说明中登记）+ 收口提交，文本改动在区间内（视觉基线 PNG 不计）。
- 追加了计划外的视觉环境限流豁免（`VISUAL_HARNESS=1` 且数据库路径含 `.visual`），属矩阵落地必需的基础设施修复。
- 会话卡片基线命名由 M3 的「默认语言省略」统一为 `<locale>-light-mobile`（2 张改名），矩阵为 `auth-<slug>-light-360-<locale>`。

## 5. 已知残留

- 769–1024 登录 Tab 仍依赖组内横向滚动，同区间右侧廊道未覆盖（实测 769×640 登录页悬浮遮挡 471px²），登记 backlog §3.5。
- Admin 收起态导航无 `aria-label`、SSR 首帧展开态、参考态 admin 移动端已知漂移，登记 backlog §3.4。
- OAuth 入口首访不读 `Accept-Language`（只认 cookie），与 D48 一致；真机 iOS Safari 与 320px 未实测。
- 反馈按钮在视觉环境未配置 `feedbackUrl`，其遮挡由右侧廊道几何与文档盒断言覆盖，未做像素基线。
