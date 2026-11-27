# 2026-11-27 阶段 16 收口记录：平板收尾与 Admin 移动端可访问性

> 范围与决策见 [阶段 16 范围登记](./2026-11-27-phase16-registration.md)；阶段正文见 [todo-archive-phases-16](../../plan/archive/todo-archive-phases-16.md)，里程碑见 [roadmap-phases-16](../../plan/archive/roadmap-phases-16.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 平板断点收尾 | 登录 Tab 的 3 列自适应与登录 / 注册 / SSO 右侧安全廊道（4–5rem）统一扩到 ≤1024；769 / 800 / 1024 × 5 语言几何断言（Tab 完整可见、组内不可滚动、与固定按钮相交 0、无横向溢出） | `7594a02`（断言随 M4 提交） |
| M2 1024 横向视觉矩阵 | `tablet-landscape-1024.visual.spec.ts` 4 张 1024×768 浅色整页基线；admin-users 用 `?userId=visual-user-03` 深链固定夹具行 | `d8116b0` |
| M3 SSO 暗色主题 | `sso-login-dark-theme` mixin 接入既有 `$dark-*` token；`sso-dark.visual.spec.ts` 390 / 768 暗色基线 + 计算样式断言；auth 与 localized-narrow 的 4 张 SSO 暗色基线重采 | `be24b90` |
| M4 Admin 导航可访问性与首帧 | 9 个导航链接常驻 `aria-label`、折叠按钮 `aria-label` / `aria-expanded`；≤768 收起改 CSS-first（`mobile-expanded` 才展开，`onMounted` 不再写显示状态）；parity 移动端 12 张永久漂移豁免；`admin-matrix` 就绪判定收敛到 `.admin-main` | `bc4c7f4` |
| M5 文档与阶段收口 | 口径同步（测试规范）、归档分片、索引与 roadmap、收口记录 | 收口提交 |

## 2. 终态指标

- 测试：**1572** 用例通过，无新增单测（本阶段改动集中在模板 / 样式与视觉层，逻辑未变）。
- 覆盖率：Statements 78.87% / Branch 65.88% / Functions 72.68% / Lines 79.07%（较阶段 15 的 78.86% / 65.88% / 72.62% / 79.06% 基本持平）。
- 视觉：**389** 用例通过，自基线 PNG **195** 张（新增 6 张：1024 四页 + SSO 暗色 2 张；更新 4 张既有 SSO 暗色基线）。
- 重复代码 3.75%（阈值 5%）；入口 CSS 405,555 B（+1.46%，上限 +10%）；`build` 通过；`docs:build` 通过。
- i18n：`i18n:check` 29 条用例通过；`ai:check` / `planning:check` / `quality:file-size` / `migration:check-imports` / `migration:check-budget` 通过。
- 提交：4 个条目提交 + 阶段收口提交。

## 3. Review Gate 轮次

- M1.1–M1.3 R1 Pass：断点扩展只作用于登录 Tab 与三页廊道，`>`1024 桌面样式未变；断言覆盖 5 语言 × 769 / 800 / 1024。
- M2.1 R1 Reject → R2 Pass：R1 发现 1024 admin-users 整表随随机账号漂移（该 spec 在套件靠后执行，库中已有其它用例创建的账号）；改为 `?userId=` 深链固定夹具行后稳定。
- M3.1 / M3.2 R1 Pass：暗色只做 token 映射，未改版式；计算样式断言先于像素，桌面浅色基线未变。
- M4.1 / M4.2 / M4.3 R1 Pass：R1 补充 parity 就绪守卫对首页 / 错误页 / 我的应用的回退（这些路由不走 admin 布局，收敛到 `.admin-main` 会误红）。
- M5.1 R1 Pass：规范与实现口径一致，归档块 6 项字段齐全。

## 4. 偏差

- 计划 10 小条目 / 10–12 commits；实际 4 个条目提交 + 收口提交。原因：M1 的几何断言与 M4 落在同一 spec 文件（`mobile-auth-layout`），拆文件会产生中间红色提交，故 M1 断言随 M4 提交；M2 与 M3 各自只需 1 个提交。
- 登记记录写「10 个导航链接」，实际 `nav-item` 为 **9** 个（用户 / 应用 / SSO / 注册 / 日志 + 个人中心 / 我的应用 / 文档 / 首页）。断言按实际 9 个锁定，并在验收标准中注明。
- CSS-first 收起后，移动端侧栏类名不再含 `collapsed`；`mobile-auth-layout` 的 admin 断言改为检查 `mobile-expanded`、标签可见性与首帧类名一致性。
- 视觉更新时 `--update-snapshots=all` 会把无像素差异的 PNG 重编码；已把 84 张非本阶段变更的基线还原，只保留 4 张 SSO 暗色基线与 6 张新增基线。

## 5. 已知残留

- Admin 移动端参考态 12 张（6 路由 × 2 主题）为永久已知漂移（D57）：参考态采自迁移前、侧栏当时展开，已由自基线保护，parity 层跳过移动端视口。
- 平板断点只在 769 / 800 / 1024 三档验证，768 与 769 的交界由 `localized-narrow` 与 `security-session-cards` 的断点断言间接覆盖；1025–1100 的窄桌面未单独采基线。
- SSO 暗色复用认证页既有 token，未做对比度自动化门禁（仅断言 token 值）。
- 真机 iOS Safari / Android 未实测；反馈按钮在视觉环境未配置时仍由廊道几何与文档盒断言覆盖。
