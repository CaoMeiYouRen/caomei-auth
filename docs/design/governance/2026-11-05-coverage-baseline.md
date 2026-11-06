# 2026-11-05 覆盖率基线复测与目标校准

> **状态**：基线已复测，阶段目标已校准（2026-11-05 用户选择「按范围设下限」）。
> **关联条目**：[阶段 2 M3-1](../../archive/completed-work.md)。
> **测量口径**：Vitest 4 + v8 coverage，`pnpm test:coverage`，仓库根目录 `vitest.config.ts` 的 include / exclude。

## 1. 复现方式

```bash
pnpm install
pnpm test:coverage
# 明细：coverage/coverage-final.json（json reporter）+ coverage/index.html
```

- 基线采集时间：2026-11-05，提交 `e5a5c68`（M2 收口后）。
- 全量测试：通过（测试文件与用例数见当次输出）。
- 覆盖率统计范围：`utils/`、`server/`、`composables/`、`components/`、`pages/`、`middleware/`、`plugins/`、`lib/` 等运行时代码；排除 `tests/`、`scripts/`、`public/`、`assets/`、构建产物与配置文件。

## 2. 复测结果

| 指标 | 覆盖 / 总数 | 覆盖率 |
| :--- | :--- | :--- |
| Statements | 3520 / 4647 | **75.74%** |
| Branches | 1805 / 3098 | 58.26% |
| Functions | 579 / 876 | 66.09% |
| Lines | 3415 / 4496 | **75.95%** |

按目录（Statements）：

| 范围 | 文件数 | 覆盖 / 总数 | 覆盖率 |
| :--- | :--- | :--- | :--- |
| `server/api` | 21 | 473 / 493 | 95.94% |
| `server`（其它） | 47 | 980 / 1528 | 64.14% |
| `composables` | 29 | 1255 / 1610 | 77.95% |
| `components/base` | 7 | 66 / 91 | 72.53% |
| `components`（其它） | 6 | 98 / 108 | 90.74% |
| `utils` | 26 | 598 / 665 | 89.92% |
| `pages` | 9 | 22 / 63 | 34.92% |
| `plugins` | 5 | 18 / 72 | 25.00% |
| `middleware` | 1 | 9 / 16 | 56.25% |

结论：历史记录的 17.65% 与当前口径不一致（应为旧配置或旧统计范围），**以本次复测的 75.74% / 75.95% 为唯一基线**。

## 3. 目标校准

阶段登记原公式为 `max(30%, 复测基线 + 10pp)`。按本次基线代入会得到 85.74%（Statements），高于长期目标 60%，且本阶段定位是「预备 / 收口」，不适合用大规模补测拉高全局数字。

2026-11-05 与用户确认后改为**按范围设下限**：

| 范围 | 阶段下限 | 复测基线 | 缺口 |
| :--- | :--- | :--- | :--- |
| 全局 Statements | ≥ 75.74%（不退化） | 75.74% | 守线 |
| `server/api` | ≥ 95% | 95.94% | 已达标 |
| `composables` | ≥ 80% | 77.95% | +2.05pp（约 33 条语句） |
| `components/base` | ≥ 75% | 72.53% | +2.47pp（约 3 条语句） |

- 全局、`server/api`、`composables`、`components/base` 四项任一跌破下限即视为 M3 未达成。
- 不追求 Branches / Functions 的阶段下限（当前 58.26% / 66.09%），只要求不显著退化；分支覆盖作为后续阶段的观察指标。
- 长期目标（核心逻辑 Lines ≥ 60%，实际已超过）保持不变，见 [Backlog](../../plan/backlog.md)。

## 4. 定向补测优先级（M3-2）

按「缺口大 + 关键路径」排序：

| 优先级 | 文件 | 当前 Statements | 理由 |
| :--- | :--- | :--- | :--- |
| 1 | `composables/use-login-flow.ts` | 45.7%（107/234） | 登录主流程，异常分支未覆盖 |
| 1 | `composables/use-register-flow.ts` | 55.7%（59/106） | 注册主流程，校验失败分支未覆盖 |
| 2 | `composables/use-quick-login-flow.ts` | 69.1%（85/123） | 快捷登录，OTP 失败分支未覆盖 |
| 2 | `components/base/phone-input.vue` | 58.3%（28/48） | `components/base` 下限的唯一缺口 |
| 2 | `composables/admin/use-logs-management.ts` | 62.0%（31/50） | 管理端筛选逻辑 |
| 3 | `composables/admin/use-sso-providers.ts` | 63.0%（29/46） | 管理端 SSO 逻辑 |
| 3 | `composables/admin/use-application-management.ts` | 66.7%（36/54） | 管理端应用逻辑 |

## 5. 定向补测结果（M3-2 复测）

2026-11-05 补测后再次执行 `pnpm test:coverage`：

| 指标 | 基线 | 补测后 |
| :--- | :--- | :--- |
| Statements | 75.74% | **78.26%**（3637 / 4647） |
| Branches | 58.26% | 59.84% |
| Functions | 66.09% | 68.03% |
| Lines | 75.95% | **78.49%**（3529 / 4496） |

按范围（Statements）：

| 范围 | 阶段下限 | 基线 | 补测后 | 结论 |
| :--- | :--- | :--- | :--- | :--- |
| 全局 | ≥75.74% | 75.74% | 78.26% | 达标 |
| `server/api` | ≥95% | 95.94% | 95.94% | 达标 |
| `composables` | ≥80% | 77.95% | 84.35% | 达标 |
| `components/base` | ≥75% | 72.53% | 90.11% | 达标 |

补测内容：

- `composables/use-login-flow.ts`（45.7% → 82.1%）：2FA 弹窗与三种验证方式、发送 OTP 成功 / 验证码失败 / 接口失败、匿名与社交登录、邮箱 / 手机号验证码校验、社交图标配色映射。
- `composables/use-register-flow.ts`（55.7% → 72.6%）：验证码失败、注册接口错误、手机号验证失败、更新用户失败、发送注册验证码前的手机号校验、模式切换清理错误。
- `components/base/phone-input.vue`（58.3% → 91.7%）：错误态渲染、`modelValue` 同步 / 解析失败 / 清空、切换区域后重新格式化。

## 6. 关联文档

-   [阶段 2 范围登记](./2026-11-05-phase2-registration.md)｜[待办事项](../../plan/todo.md)｜[Backlog](../../plan/backlog.md)
-   [测试规范](../../standards/testing.md)｜[Zod 迁移计划](../../plan/zod-migration.md)
