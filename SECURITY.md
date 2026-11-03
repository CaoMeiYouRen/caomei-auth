# Security Policy/安全策略

## Supported Version/支持的版本

Latest commits in the `master` branch; fixes are published with the latest release.

仅 `master` 分支的最新提交获得安全修复，修复随最新 release 发布。历史版本不单独回补，除非另行公告。

> 本文档正文以中文为准；英文标题仅用于导航与检索。

## Reporting a Vulnerability/报告漏洞

**请勿通过公开 Issue、Discussion 或 Pull Request 报告安全漏洞。**

If you believe you have found a security vulnerability, please report it privately through a
[draft security advisory](https://github.com/CaoMeiYouRen/caomei-auth/security/advisories/new).
Do not open a public issue, discussion or pull request for it.

如果您认为在本项目中发现了安全漏洞，请通过 [GitHub 私有安全公告草案](https://github.com/CaoMeiYouRen/caomei-auth/security/advisories/new)
私下报告，不要创建公开 Issue、Discussion 或 PR。我们会在修复发布前保持报告私密。

### 报告前请先自查 / Before you report

-   在最新 `master` 提交上复现，确认问题仍然存在（附上提交 SHA）。
-   确认不是已有公告的重复项，可在 [Security Advisories](https://github.com/CaoMeiYouRen/caomei-auth/security/advisories) 中检索。
-   只使用自己控制的账号与数据验证，不要读取、修改或删除他人数据，不要做破坏性测试。

### 报告中必须包含 / What to include

1.  **受影响目标**：仓库、提交 SHA / 版本号、组件与文件行号。
2.  **漏洞类型**：CWE 编号（如 CWE-863 越权、CWE-287 认证缺陷）。
3.  **根因**：为什么现有防护不生效，引用具体代码位置。
4.  **攻击路径**：从攻击者起点到影响结果的完整步骤，注明前置条件（登录态、配置开关、代理行为等）。
5.  **复现证据**：最小 PoC、请求/响应、测试用例或命令输出。禁止附带真实用户数据。
6.  **影响评估**：机密性 / 完整性 / 可用性影响，以及 CVSS 3.1 向量（可选，但请说明假设）。
7.  **修复建议**：可选，但非常欢迎。
8.  **披露说明**：是否已告知第三方、是否计划公开、期望的时间线。

### 安全公告模板 / Advisory template

新建私有公告时可直接使用以下结构（与项目已发布的公告保持一致）：

```markdown
## 1. Summary

一句话说明漏洞与影响。

## 2. Affected target

| 字段             | 值                                           |
| ---------------- | -------------------------------------------- |
| Repository       | CaoMeiYouRen/caomei-auth                     |
| Commit           | <完整 SHA>                                   |
| Version          | <版本号 / tag>                               |
| Affected versions | <受影响版本范围>                            |
| Patched versions | <修复版本；未修复写 None>                    |
| Component        | <中间件 / 路由 / 插件 / 配置>                |
| Lines            | <文件:行号>                                  |
| CWE              | CWE-xxx                                      |
| CVSS 3.1         | CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N |
| CVE ID           | <已分配则填写，否则写 Pending>               |
| Credits          | <报告者署名或 Anonymous>                     |

## 3. Root cause

说明哪一层校验缺失或失效，引用具体代码。

## 4. Attack path

1. 前置条件（账号、配置开关、部署形态）
2. 请求 / 操作步骤
3. 结果（读取、写入、越权、接管等）

## 5. Proof of concept / evidence

最小 PoC、请求响应、测试用例或命令输出。不要包含真实用户数据。

## 6. Impact

机密性 / 完整性 / 可用性影响，以及受影响的部署形态。

## 7. Remediation

建议的修复方式；如已知上游修复版本请注明。

## 8. Detection and workarounds

日志特征、临时缓解措施（代理规则、关闭配置开关等）。

## 9. Evidence and duplicate check

与已有公告的关系，确认不是重复项的依据。

## 10. Limitations and disclosure notes

未能验证的部分、环境依赖、是否已告知第三方、期望披露时间。
```

## Our process/处理流程

1.  **确认收到**：尽力在 7 天内回复并给出初步判断（尽力而为，不构成法律意义上的时限承诺）。
2.  **分级**：按可利用性、影响范围与是否需要受害者交互评估严重级别，必要时与报告者对齐假设。
3.  **修复**：在私有分支完成修复、回归测试与安全审计；修复会同时覆盖"直接触发"与"同类绕过"路径。
4.  **发布**：修复随版本发布，并在 GitHub Security Advisories 公开公告、致谢报告者（除非要求匿名）。
5.  **协同披露**：默认在修复发布后公开；如需提前或延后披露，请在报告中说明，我们会尽量配合。

We follow coordinated disclosure: the advisory is published after a fix is available, with credit to the reporter unless anonymity is requested.

## Scope/范围

**受理**

-   认证、会话、权限与越权（水平 / 垂直）
-   OAuth 2.0 / OIDC、OAuth 客户端管理、SSO 等协议实现缺陷
-   注入、SSRF、XSS、CSRF、路径穿越、敏感信息泄露
-   依赖与供应链问题中可实际利用的部分
-   CI/CD、发布流程与安全门禁的绕过

**通常不受理**

-   需要受害者安装恶意软件、主动交出凭据的纯社会工程
-   无实际影响的缺失安全响应头、版本号暴露
-   Demo 模式下的数据污染（Demo 数据本就公开且可重置）
-   仅靠超大流量造成可用性下降的拒绝服务
-   上游尚无可用修复的依赖问题不单独发布公告，但仍按发布前安全告警门禁跟踪（`critical` 必须修复且不允许豁免，`high` 按豁免登记流程处理）；请同时反馈给上游

## Safe harbor/安全港

在遵守本策略、不侵犯他人隐私与数据、基于善意研究的前提下，在适用法律允许的范围内，我们不会对其采取法律行动或向平台投诉。该承诺仅适用于本项目官方实例与自建实例；测试他人部署的实例需先获得该部署方授权。请避免破坏服务可用性、数据完整性和他人隐私。

## For deployers/部署方加固建议

-   保持 `master` 最新，并在发布前通过 `pnpm security:alerts` 安全告警门禁（见 [安全开发规范 5.1.3](./docs/standards/security.md#513-发布前安全告警门禁-release-security-alert-gate)）。
-   反向代理若会归一化 URI（如 nginx 默认行为），只能作为纵深防御，**不得**替代应用内的路径归一化校验。
-   按 [安全开发规范](./docs/standards/security.md) 核对 better-auth 插件的管理类端点是否已关闭或加固。

## References/参考

-   [安全开发规范](./docs/standards/security.md)
-   [已发布的安全公告](https://github.com/CaoMeiYouRen/caomei-auth/security/advisories)
-   [AI 协作规范](./docs/standards/ai-collaboration.md)
