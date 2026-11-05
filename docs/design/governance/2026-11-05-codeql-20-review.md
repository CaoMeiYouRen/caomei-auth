# 2026-11-05 CodeQL #20 复核记录

> **状态**：已结案（按误报 dismiss，豁免台账改为 `false-positive`）。
> **关联条目**：[阶段 2 M1-1](../../plan/todo.md#阶段-2-原子条目)。
> **门禁规则**：[安全开发规范 5.1.3](../../standards/security.md#513-发布前安全告警门禁-release-security-alert-gate)。

## 1. 告警基线

| 字段 | 值 |
| :--- | :--- |
| 编号 | [CodeQL #20](https://github.com/CaoMeiYouRen/caomei-auth/security/code-scanning/20) |
| 规则 | `js/insufficient-password-hash`（CWE-916） |
| 级别 | `high`（CodeQL severity `warning`） |
| 位置 | `server/utils/oauth-client-view.ts:13`（`hashClientSecret`） |
| 数据流 | `generateDemoOAuthApps` → `server/database/index.ts` → `hashClientSecret` |
| 首次发现 | 2026-10-29；最后一次分析提交 `3f84ee8` |

## 2. 复核结论

**按误报处理**：告警把 OAuth client secret 当作"用户口令"处理，但本项目中被哈希的值是机器生成的高熵凭证，不满足 CWE-916 的适用前提（低熵、可被猜测或字典爆破的口令）。

2026-11-05 通过 GitHub API 将告警 #20 dismiss 为 `false positive`，并按门禁要求把豁免台账条目从 `hard-fix` 改为 `false-positive`。

## 3. 依据

### 3.1 被哈希值的熵

| 来源 | 生成方式 | 熵 | 是否可爆破 |
| :--- | :--- | :--- | :--- |
| 真实 client secret | `generateClientSecret()`：`crypto.randomBytes(24).toString('base64url')` | 192 bit | 否 |
| 演示 client secret | `demo_secret_` + `generateRandomString(16)`（`secureRandom()` + base62 字符集） | 约 95 bit | 否 |

两者都由 CSPRNG 生成，与用户口令（人类记忆、低熵、可复用）不同，慢哈希只能延缓"口令被猜中"的攻击，对 95 bit 以上的随机串没有实际收益。

### 3.2 存储算法由上游决定

-   `@better-auth/oauth-provider@1.7.14` 的 `storeClientSecret` 默认值为 `"hashed"`，实现为 `SHA-256` + base64url（无 padding），比较使用 `constantTimeEqual`。
-   本项目 `hashClientSecret` 必须与上游算法一致，否则 `verifyStoredClientSecret` 无法校验 client 认证请求。
-   上游自 1.7.x 起已支持 `storeClientSecret: { hash, verify }` 自定义哈希，因此"等待上游提供可配置哈希"不再是阻塞理由，本条豁免已同步修正。

### 3.3 为什么不做慢哈希迁移

改用 `scrypt` / `PBKDF2` / `Argon2` 需要同时改写存量数据，而数据库里只有哈希、没有明文，无法重新计算：

1. 存量 OAuth client 的哈希与新算法不匹配，会立即导致这些 client 的 `client_secret` 认证失败。
2. 可行路径只有"强制全部 client 重签 secret"，属于破坏性变更，需要迁移窗口与用户通知；对一个 192 bit 随机串换算法，收益与风险不成比例。

因此本阶段结论是**保持 SHA-256 存储，不做迁移**；若未来出现"允许强制重签 client secret"的运维能力，可重新评估。

## 4. 处置与证据

| 项 | 内容 |
| :--- | :--- |
| GitHub 处置 | `state=dismissed`，`dismissed_reason=false positive`，2026-11-05T10:58:17Z |
| 豁免台账 | `.github/security-alert-exemptions.json`：`category=false-positive`，`expiresAt=2027-05-31` |
| 追踪 | `docs/plan/todo.md#阶段-2-原子条目`（M1-1） |
| 复核周期 | 到期前复核一次；规则升级或引入口令类凭证时提前复核 |

## 5. 残留风险

-   若未来出现"确实由用户自选"的 client secret（低熵、可复用），同一条哈希路径会变成真实风险，必须在接入时改用慢哈希并单独登记。
-   dismiss 不改变代码，CodeQL 若在同一位置以新的数据流再次报出，需按新告警复核，不能沿用本条结论。

## 6. 关联文档

-   [阶段 2 范围登记](./2026-11-05-phase2-registration.md)｜[待办事项](../../plan/todo.md)
-   [安全开发规范](../../standards/security.md)｜[better-auth 1.7 升级记录](./better-auth-1.7-upgrade.md)
