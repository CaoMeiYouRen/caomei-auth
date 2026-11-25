# 2026-11-26 阶段 14 收口记录：国际化门禁与前端健壮性

> 范围与决策见 [阶段 14 范围登记](./2026-11-24-phase14-registration.md)；阶段正文见 [todo-archive-phases-14](../../plan/archive/todo-archive-phases-14.md)，里程碑见 [roadmap-phases-14](../../plan/archive/roadmap-phases-14.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 i18n 门禁与产物 | 未启用语言目录级键 / 占位符同构门禁（`--allow-incomplete` 白名单）；`import.meta.glob` 按启用语言过滤静态包，core / server 与回退语言保留 | `35c03b2`、`b418af7` |
| M2 台账与多语言链接 | 译文台账消费方（条目集合 / 模块覆盖 / readiness / nativeReview）；登录页四条链接与页脚站内链接 `localePath()` | `b18323e`、`e6dda59` |
| M3 i18n 视觉回归 | ja / ko 的 register / forgot-password / sso-login 12 张窄屏基线（390 浅 / 768 暗，整页）；360×640 长语言用例，结论为无需恢复 `white-space: normal` | `044ed57`、`33cc218` |
| M4 前端健壮性与样式门禁 | 改密码 / 登出校验 `{ error }`；4 条流程失败 Toast 与失败分支单测；`useDataTable` 去默认 `any`、用户列表去断言；stylelint 覆盖 `styles/` 与深层 Vue；eslint 忽略 `.session` | `5937a4e`、`0d12400`、`711acad`（`54ae9f2` 为门禁配套，不计容量） |
| M5 Admin 日志页 1440 布局 | 主区 `min-width: 0`；日志筛选行换行，769–1240 不再裁切；1440 页面溢出归零；热力图基线恢复元素口径 + 1024 守卫 | `5b6d690` |
| M6 移动端安全页会话表 | ≤768 卡片式会话项，769 起恢复表格；暗色边框改用 `$dark-border-color`；390 元素基线与 768/769 断言 | `47e12c6` |
| M7 文档与阶段收口 | 口径同步（i18n / 视觉 / 前端错误 / 样式 / 布局）、全量门禁、归档分片与索引 | `b918e53`、`8b24d7a` |
| M8 验证码可选配置修复（插队） | 浏览器启用判定改用 `useRuntimeConfig().public`；`resolveCaptchaToken` 可选空 token 放行；注册 / OTP / 换邮箱 5 处接入，两态浏览器冒烟通过 | `2debcf2` |

## 2. 终态指标

- 测试：218 文件 / **1565** 用例全通过；覆盖率 Statements 78.84% / Branch 65.89% / Functions 72.56% / Lines 79.04%。
- 视觉：**173** 个用例通过，自基线 PNG **165** 张（新增 12 张窄屏基线与 2 张移动端会话卡片元素基线，重采 6 张 1440 布局基线）。
- 重复代码 3.77%（阈值 5%）；入口 CSS 405,196 B（+1.37%，上限 +10%）；`build` 56.9 MB / 13.6 MB gzip；`docs:build` 通过。
- i18n：`i18n:check` 串联门禁与 29 条 i18n 用例通过；未启用语言目录级校验与产物过滤生效。
- 安全：`security:alerts` 通过（1 个已豁免 high，豁免未过期）；CodeQL / Dependabot 无新增阻塞项。
- 提交：13 个条目提交（M1 2 / M2 2 / M3 2 / M4 3 / M5 1 / M6 1 / M7 1 / M8 1）+ 阶段收口提交；辅助 / 回填提交为 `110e806`（确认开工）、`5a11b0f`（安全规范）、`b3ff91a`、`1c3a686`（候选登记）、`54ae9f2`（eslint 忽略 `.session`）、`1687f05` / `1bbe169` / `add28ff`（进度回填）、`9cdaa54`（文件规模门禁修复）、`291da24`（移动端审计）、`d553201`（M8 插入登记）、`4220c7f`（M8 闭环回填）。

## 3. Review Gate 轮次

- M1.1 R1 Reject → R2 Reject → R3 Pass → R4 Reject → R5 Pass；M1.2 R1 Pass → R2 Pass。
- M2.1 R1 Reject → R2 Pass；M2.2 R1 Reject → R2 Reject → R3 Pass。
- M3.1 R1 Pass；M3.2 R1 Pass → R2 Pass（W01 sso 卡片作用域、W02 语言断言已补）。
- M4.1 / M4.2 / M4.3 R1 Pass（M4.3 的 W01/W02 当轮修复，W03 按条目拆分提交）。
- M5.1 / M5.2 R1 Reject → R2 Pass（R1 blocker：769–1240 筛选控件被裁切）。
- M6.1 / M6.2 R1 Reject → R2 Pass（R1 blocker：暗色卡片边框误用浅色 token）。
- M8.1 R1 Reject → R2 Reject → R3 Pass（R1：浏览器启用判定恒 false；R2：换邮箱缺两态浏览器验证）。
- M7.1 R1 Reject → R2 Pass；M7.2 R1 Reject → R2 Pass（文档与归档：相对链接、.session 同步、Review Gate 轮次留痕已补）。

## 4. 偏差

- 容量：计划 commits 16–21 / files 47–64 / 行 1,580–2,280；实际 13 个条目提交（M5 / M6 各将 2 个小条目合并为 1 次提交，属流程偏差且不可回滚，不作为后续先例；M8 插队 +1，M3 按 2 次提交），文本文件与行数在区间内（不含视觉基线 PNG）。
- M3 基线数量：验收原文「2 语言 × 2 视口 × 3 页 × 浅暗」与 12 张自相矛盾；2026-11-26 用户裁定取 12 张口径（D44），实际为 2 语言 × 3 页 × 2 视口，390 浅色 / 768 暗色，未采完整 24 矩阵。
- M5 复审发现 769–1240 窄桌面筛选控件被 `overflow: hidden` 裁切，补 `.filter-row` 换行与 1024 守卫；M6 复审发现暗色边框 token 误用并重采基线。
- M8 为 2026-11-25 用户授权插队（D43），首轮实现误用 `utils/shared/env` 的浏览器不可用变量，复审退回后改用运行时配置并补两态冒烟。
- 视觉基线重采时 `--update-snapshots=all` 会写入阈值内噪声，已仅保留逐项归因的 6 张 1440 布局基线，其余回滚。

## 5. 未覆盖边界

- 窄屏完整 24 矩阵未采（D44 取舍）；每个视口只覆盖单一主题。
- `/sso-login` 暗色主题缺失：暗色基线呈现浅色内容 + 暗色页脚，已登记 backlog §3.4。
- 移动端安全页卡片仅 zh-CN 元素基线；en-US / ja-JP / ko-KR 无像素保护。
- M3.2 的 360 用例以几何断言与 caomei-ui 按钮截断契约覆盖长文案，未做注入超长文案的负向验证。
- 验证码自定义端点（`/api/security/change-email`、`/api/security/two-factor/send-otp`）服务端未校验 `x-captcha-response`；provider + siteKey 但缺 secret 时服务端注册条件不一致（500），已登记 backlog §3.1。
- 本地门禁通过；推送与 CI 由维护者执行，未在本记录内声明远端结果。
- M1 / M2 的 Review Gate 记录仅存在于任务态与进度表，`artifacts/review-gate/` 未留档；轮次真实性未由仓库内证据复核。

## 6. 后续建议

- 认证移动端可用性组合（验证码已交付）：登录 Tab、SSO 首屏安全区、悬浮按钮遮挡、OAuth 入口语言、个人中心操作行，见 [backlog §4.1](../../plan/backlog.md#41-认证移动端可用性)。
- 验证码服务端校验补齐与插件注册条件修正（backlog §3.1）。
- 窄屏完整矩阵与跨语言卡片基线，按 CI 预算评估后再登记。
