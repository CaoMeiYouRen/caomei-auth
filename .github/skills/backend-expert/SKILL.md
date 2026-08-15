---
name: backend-expert
description: 设计或实现后端 API、服务层、数据库读写、鉴权权限控制、输入校验、事务处理与错误处理时使用。用户提到 API、route、handler、server、auth、permission、drizzle、database、zod、Hono、Nuxt server routes、backend bug 修复时都应触发。

metadata:
  internal: true
---

# Backend Expert

铁律：不要在没有确认输入校验、权限边界和数据写入规则前直接写后端逻辑。

## 工作流

- [ ] Step 1: 建立后端上下文 ⚠️ REQUIRED
	- [ ] 1.1 阅读目标路由、服务层、schema 和相关数据模型。
	- [ ] 1.2 确认当前项目使用的后端模式是 Hono、Nuxt server routes 还是自定义服务层。
- [ ] Step 2: 明确接口契约 ⚠️ REQUIRED
	- [ ] 2.1 先定义输入、输出、错误语义和边界条件。
	- [ ] 2.2 明确是否需要分页、排序、过滤、幂等或事务。
- [ ] Step 3: 处理安全与数据一致性
	- [ ] 3.1 先做鉴权和权限检查，再进入业务逻辑。
	- [ ] 3.2 输入校验优先于数据库操作。
	- [ ] 3.3 数据写入必须避免拼接查询、隐式权限绕过和部分写入。
- [ ] Step 4: 实现与验证
	- [ ] 4.1 给出语义清晰的错误处理。
	- [ ] 4.2 如果改动可测，补齐对应测试或至少指出缺失测试点。
	- [ ] 4.3 涉及高风险改动时，建议联动 security-guardian 与 test-engineer。

## 关注点

- 输入校验是否覆盖空值、非法值和边界值。
- 鉴权是否在真正敏感操作前完成。
- 数据访问是否参数化、可回滚、可追踪。
- 错误是否对用户和日志分别提供恰当信息。

## 项目特化提示

- 如果项目使用 Nuxt server routes，优先遵循 defineEventHandler 和 createError 的惯用模式。
- 如果项目已有 Zod、Drizzle ORM、TypeORM、Better-Auth 或权限中间件，优先复用，而不是临时发明另一套接口层。
- 列表接口要考虑 ApiResponse 风格、分页和可扩展过滤条件。
- 权限检查优先放在 handler 或服务入口，而不是散落在内部步骤中。

## 反模式

- 先写 SQL 或 ORM 调用，再回头补校验与权限控制。
- 把控制器、业务逻辑、数据访问全部塞进一个文件。
- 用宽泛 catch 吞掉错误上下文。
- 对列表接口忽略分页与性能成本。

## 交付前检查

- [ ] 输入、输出和错误语义已经明确。
- [ ] 鉴权、权限和数据写入顺序正确。
- [ ] 未引入字符串拼接查询或隐式越权。
- [ ] 已说明需要的测试或后续验证。








